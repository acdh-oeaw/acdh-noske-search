import { CorpusSearchService } from "./client/services.gen.ts";
import { OpenAPI } from "./client/core/OpenAPI.ts";
import { _concordance } from "./client/types.gen.ts";
import { GetConcordanceData } from "./client/types.gen.ts";

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
	const queryTypeValue = queryType!.value;
	var handledQuery = queryTypeValue === "word" ? `q"${query}"` : queryTypeValue === "phrase" ? wrapQuery(query) : `q${query}`;
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
	if (response.Lines && response.Lines!.length === 0) {
		return "No results found";
		// @ts-ignore
	} else if (response.error) {
		// @ts-ignore
		response.error = `${response.error} see documentation at <a target="_blank" class="text-blue-500" href="https://www.sketchengine.eu/documentation/corpus-querying/">https://www.sketchengine.eu/documentation/corpus-querying/</a>`;
	}
	console.log(response);
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

function checkRefs(refs: Array<string>, refOrDoc: boolean = false) {
	if (refOrDoc) {
		for (let ref of refs) {
			if (ref.startsWith("doc")) {
				return ref.split("=")[1];
			}
		}
	} else {
		for (let ref of refs.slice(1)) {
			if (ref === "" || ref === undefined || ref === null) {
				return "";
			} else {
				return `#${ref.split("=")[1]}`;
			}
		}
	}
}

export function responseToHTML(lines: Array<Lines>, containerId: string, stats: number, customUrl: string) {
	const hits = document.querySelector<HTMLDivElement>(`#${containerId}`);
	hits!.innerHTML = lines.map((line) => {
		let left = line.left;
		let right = line.right;
		let kwic = line.kwic;
		let refs = line.refs;
		let docId = checkRefs(refs, true);
		let hashId = checkRefs(refs, false);
		let customUrlNormalized = customUrl.endsWith("/") ? customUrl : customUrl + "/";
		return (
			`<div class="flex flex-row">
				<div class="p-2 border basis-11/12">
					<a href="${customUrlNormalized}${docId}?mark=${kwic.trim()}&noSearch=true${hashId}">
						<span class="text-sm text-gray-500">${left}</span>
						<span class="text-lg text-red-500">${kwic}</span>
						<span class="text-sm text-gray-500">${right}</span>
					</a>
				</div>
			</div>`
		);
	}).join("") + `<label class="text-sm text-gray-500">${stats} Treffer</label>`;
}
