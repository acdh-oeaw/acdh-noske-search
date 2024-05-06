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

export async function getCorpus(query: string, options: Options = {
	corpname: "diarium",
	viewmode: "kwic",
	attrs: "word",
	format: "json",
	structs: "doc,head,p,imprimatur",
	kwicrightctx: "100#",
	kwicleftctx: "100#",
	refs: "doc.id,p.id,head.id,imprimatur.id",
	pagesize: 20,
	fromp: 1,

}) {
	const response = await CorpusSearchService.getConcordance({
		corpname: options.corpname,
		q: `q[word="${query}"]`,
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
	console.log(response);
	if (response.Lines!.length === 0) {
		return "No results found";
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
		let refs: Array<string> = value.Refs?.map((ref) => ref.split("=")[1])!;
		let line: Lines = {"left": left, "right": right, "kwic": kwic, "refs": refs};
		lines.push(line);
	});
	console.log(lines);
	return lines;
}

export function getStats(response: _concordance) {
	const stats = response.fullsize;
	return stats;
}

export function responseToHTML(lines: Array<Lines>, containerId: string, stats: number) {
	const hits = document.querySelector<HTMLDivElement>(`#${containerId}`);
	hits!.innerHTML = lines.map((line) => {
		let left = line.left;
		let right = line.right;
		let kwic = line.kwic;
		let refs = line.refs;
		return (
			`<div class="flex flex-row">
				<div class="p-2 border basis-11/12">
					<a href=${refs[0]}?mark=${kwic}#${refs[1]}>
						<span class="text-sm text-gray-500">${left}</span>
						<span class="text-lg text-red-500">${kwic}</span>
						<span class="text-sm text-gray-500">${right}</span>
					</a>
				</div>
			</div>`
		);
	}).join("") + `<label class="text-sm text-gray-500">${stats} Treffer</label>`;
}
