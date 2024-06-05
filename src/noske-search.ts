import { CorpusSearchService } from "./client/services.gen.ts";
import { OpenAPI } from "./client/core/OpenAPI.ts";
import { _concordance } from "./client/types.gen.ts";

type Lines = {
	left: string;
	right: string;
	kwic: string;
	refs: Array<string>;
};

type Options = {
	base: string;
	corpname: string;
	viewmode: "kwic" | "sen" | undefined;
	attrs: string;
	format: "json" | "xml" | "csv" | "tsv" | "txt" | "xls" | undefined;
	structs: string;
	kwicrightctx: string;
	kwicleftctx: string;
	refs: string;
	pagesize: number;
	fromp: number;
	selectQueryId?: string;
	urlparam?: boolean;
};

OpenAPI.interceptors.response.use((response) => {
	if (response.status === 200) {
		console.log(`request to ${response.status} was successful`);
	}
	return response;
});

export function normalizeID(id: string, patterns: Array<string>) {
	var normalizedID = id;
	for (let pattern of patterns) {
		normalizedID = id.replace(pattern, "");
	}
	return normalizedID;
}

function wrapQuery(query: string) {
	let queryList = query.split(" ");
	let q = 'q';
	for (let i = 0; i < queryList.length; i++) {
		q += '"' + queryList[i] + '"' + " ";
	}
	return q;
}

export async function getCorpus(query: string, options: Options) {
	const queryType = document.querySelector<HTMLSelectElement>(`#${options.selectQueryId}`);
	const queryTypeValue = options.urlparam ? "url" : queryType!.value;
	var handledQuery = queryTypeValue === "simple" ? wrapQuery(query) : queryTypeValue === "url" ? query : `q${query}`;
	const response = await CorpusSearchService.getConcordance({
		corpname: options.corpname,
		q: handledQuery,
		viewmode: options.viewmode,
		attrs: options.attrs,
		format: options.format,
		structs: options.structs,
		kwicrightctx: options.kwicrightctx,
		kwicleftctx: options.kwicleftctx,
		refs: options.refs,
		pagesize: options.pagesize,
		fromp: options.fromp,
	});
	const urlparam = new URLSearchParams(window.location.search);
	urlparam.set("corpname", options.corpname);
	urlparam.set("q", handledQuery);
	urlparam.set("viewmode", options.viewmode!);
	urlparam.set("attrs", options.attrs);
	urlparam.set("format", options.format!);
	urlparam.set("structs", options.structs);
	urlparam.set("kwicrightctx", options.kwicrightctx);
	urlparam.set("kwicleftctx", options.kwicleftctx);
	urlparam.set("refs", options.refs);
	urlparam.set("pagesize", options.pagesize.toString());
	urlparam.set("fromp", options.fromp.toString());
	urlparam.set("selectQueryValue", "url");
	window.history.pushState({}, "", `${window.location.pathname}?${urlparam}`);
	if (response.Lines && response.Lines!.length === 0) {
		return "No results found";
		// @ts-ignore
	} else if (response.error) {
		// @ts-ignore
		response.error = `${response.error} see documentation at <a target="_blank" class="text-blue-500" href="https://www.sketchengine.eu/documentation/corpus-querying/">https://www.sketchengine.eu/documentation/corpus-querying/</a>`;
	}
	return response;
}

export function getLines(response: _concordance) {
	const lines: Array<Lines> = [];
	response.Lines?.map((value) => {
		// @ts-ignore
		let left: string = value.Left?.map((word) => word.str).join(" ")!;
		let right: string = value.Right?.map((word) => word.str).join(" ")!;
		let kwic: string = value.Kwic?.map((word) => word.str).join(" ")!;
		let refs: Array<string> = value.Refs?.map((ref) => ref)!;
		let line: Lines = {"left": left, "right": right, "kwic": kwic, "refs": refs};
		lines.push(line);
	});
	return lines;
}

export function getStats(response: _concordance) {
	const stats = response.fullsize;
	return stats;
}

function checkRefs(refs: Array<string>, doc: boolean = false): Array<string> | null {
	if (doc) {
		for (let ref of refs) {
			if (ref.startsWith("doc.id")) {
				return [ref.split("=")[1]];
			}
		}
	} else {
		var refIds = [];
		for (let ref of refs) {
			if (ref === "" || ref === undefined || ref === null || ref.startsWith("doc")) {
				continue;
			} else {
				refIds.push(ref);
			}
		}
		return refIds;
	}
	return null;
}

export function responseToHTML(lines: Array<Lines>, containerId: string, stats: number, customUrl: string, urlparam: string | boolean = false) {
	const hits = document.querySelector<HTMLDivElement>(`#${containerId}`);
	hits!.innerHTML = `
		<div class="flex flex-row">
			<div class="p-2 border basis-full">
				<table class="table">
					<thead>
					<tr class="text-center" id="hits-header-row">
						
					</tr>
					</thead>
					<tbody id="hits-table-body">
					</tbody>
					<tfoot>
						<tr>
							<td class="text-sm text-gray-500"></td>
							<td class="text-sm text-gray-500"></td>
							<td class="text-sm text-gray-500"></td>
							<td class="text-sm text-gray-500"></td>
							<td class="text-sm text-gray-500 text-center">${stats} Treffer</td>
							<td class="text-sm text-gray-500"></td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
		`
	const hitsBody = document.querySelector<HTMLTableSectionElement>("#hits-table-body");
	// hitsBody!.innerHTML
	var tableHeaderStatic = `<th class="text-sm text-gray-500">Left KWIC</th>
							<th class="text-sm text-gray-500">Context</th>
							<th class="text-sm text-gray-500">Right KWIC</th>`;
	var tableHeaderGeneric = "";
	const results = lines.map((line) => {
		let left = line.left;
		let right = line.right;
		let kwic = line.kwic;
		let refs = line.refs;
		let docId = checkRefs(refs, true);
		let refsNorm = checkRefs(refs, false);
		let customUrlNormalized = customUrl.endsWith("/") ? customUrl : customUrl + "/";
		let refsHeader = refs!.filter((ref) => ref.length > 0).map((ref) => `<th class="text-sm text-gray-500 p-2">${ref.split("=")[0]}</th>`).join("");
		tableHeaderGeneric = refsHeader;
		let refsColumn = refs!.filter((ref) => ref.length > 0).map((ref) => `<td class="text-center text-sm text-gray-500 p-2">${ref.split("=")[1]}</td>`).join("");
		let hashId = refsNorm!.filter((ref) => !ref.startsWith("doc") && ref.length > 0).map((ref) => `#${ref.split("=")[1]}`).join("");
		return (
			`
			<tr class="p-2">
				${refsColumn}
				<td class="text-sm text-gray-500 p-2 text-right">${left}</td>
				<td class="text-lg text-red-500 p-2 text-center">
					<a href="${customUrlNormalized}${docId}?mark=${kwic.trim()}&noSearch=true${urlparam}${hashId}">
						${kwic}
					</a>
				</td>
				<td class="text-sm text-gray-500 p-2 text-left">${right}</td>
			</tr>
			`
		);
	}).join("");
	const tableHeader = tableHeaderGeneric + tableHeaderStatic;
	const hitsHeader = document.querySelector<HTMLTableSectionElement>("#hits-header-row");
	hitsHeader!.innerHTML = tableHeader;
	hitsBody!.innerHTML = results;
}
