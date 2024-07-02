import { CorpusSearchService } from "./client/services.gen.ts";
import { OpenAPI } from "./client/core/OpenAPI.ts";
import { _concordance, _wordlist } from "./client/types.gen.ts";
import type { Hits } from "../index";

type Lines = {
  left: string;
  right: string;
  kwic: string;
  refs: Array<string>;
};

type Items = {
  frq: number;
  relfreq: number;
  str: string;
  attr: string;
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
  selectQueryId?: string;
  urlparam?: boolean;
};

type wlQuery = {
  corpname: string;
  wlattr: string;
  wlmaxitems?: number;
  wlpat?: string;
  includeNonwords?: 0 | 1 | undefined;
  wltype?: "simple" | "struct_wordlist";
  wlicase?: 0 | 1 | undefined;
  wlminfreq?: number;
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
  let q = "q";
  for (let i = 0; i < queryList.length; i++) {
    q += '"' + queryList[i] + '"' + " ";
  }
  return q;
}

export async function getWordsList(options: wlQuery) {
  const response = await CorpusSearchService.getWordList({
    corpname: options.corpname,
    wlattr: options.wlattr,
    wlpat: options.wlpat,
    wlmaxitems: options.wlmaxitems,
    wltype: options.wltype,
    includeNonwords: options.includeNonwords,
    wlicase: options.wlicase,
    wlminfreq: options.wlminfreq,
  });
  return response;
}

export async function getCorpus(query: string, options: Options) {
  const queryType = document.querySelector<HTMLSelectElement>(
    `#${options.selectQueryId}`
  );
  const queryTypeValue = options.urlparam ? "url" : queryType!.value;
  var handledQuery =
    queryTypeValue === "simple"
      ? wrapQuery(query)
      : queryTypeValue === "url"
        ? query
        : `q${query}`;
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
  if (queryTypeValue === "url") queryType!.value = "cql";
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
    let line: Lines = { left: left, right: right, kwic: kwic, refs: refs };
    lines.push(line);
  });
  return lines;
}

export function getItems(response: _wordlist, attr: string) {
  const items: Array<Items> = [];
  // @ts-ignore
  response.Items?.map((value) => {
    // @ts-ignore
    let frq: number | undefined = value.frq!;
    let relfreq: number | undefined = value.relfreq!;
    let str: string | undefined = value.str!;
    // @ts-ignore
    let item: Items = { frq: frq, relfreq: relfreq, str: str, attr: attr };
    items.push(item);
  });
  return items;
}

export function itemsToHTML(items: Array<Items>, containerId: string) {
  const container = document.querySelector<HTMLDivElement>(`#${containerId}`);
  let div = document.createElement("div");
  div.id = "nokse-autocomplete";
  div.classList.add(
    "p-2",
    "border",
    "border-gray-500",
    "absolute",
    "top-20",
    "left-20",
    "bg-white",
    "z-10"
  );
  let ul = document.createElement("ul");
  items.map((item) => {
    let li = document.createElement("li");
    li.classList.add("text-sm", "text-gray-500", "pointer");
    li.innerHTML = item.str! + " | " + item.frq! + " | " + item.attr!;
    li.addEventListener("click", () => {
      // @ts-ignore
      document.getElementById(containerId + "-select")!.value = "cql";
      // @ts-ignore
      let input = document.getElementById(
        containerId + "-input"
      ) as HTMLInputElement;
      input.value = "[" + item.attr! + '="' + item.str! + '"]';
      // @ts-ignore
      input.addEventListener("focusout", (event) => {
        setTimeout(() => {
          document.getElementById("nokse-autocomplete")?.remove();
        }, 200);
      });
    });
    ul.appendChild(li);
  });
  div.appendChild(ul);
  document.getElementById("nokse-autocomplete")?.remove();
  container?.prepend(div);
}

export function getStats(response: _concordance) {
  const stats = response.fullsize;
  return stats;
}

function checkRefs(
  refs: Array<string>,
  doc: boolean = false
): Array<string> | null {
  if (doc) {
    for (let ref of refs) {
      if (ref.startsWith("doc.id")) {
        return [ref.split("=")[1]];
      }
    }
  } else {
    var refIds = [];
    for (let ref of refs) {
      if (
        ref === "" ||
        ref === undefined ||
        ref === null ||
        ref.startsWith("doc")
      ) {
        continue;
      } else {
        refIds.push(ref);
      }
    }
    return refIds;
  }
  return null;
}

const hitsCss = {
  div: "overflow-x-auto",
  table: "table",
  thead: "text-center",
  trHead: "",
  th: "text-sm text-gray-500",
  tbody: "",
  trBody: "p-2",
  td: "text-sm text-gray-500",
  kwic: "text-lg text-red-500",
  left: "text-sm text-gray-500 p-2 text-right",
  right: "text-sm text-gray-500 p-2 text-left",
};

export function responseToHTML(
  lines: Array<Lines>,
  containerId: string,
  customUrl: string,
  urlparam: string | boolean = false,
  hits: Hits
) {
  const hitsContainer = document.querySelector<HTMLDivElement>(
    `#${containerId}`
  );
  hitsContainer!.innerHTML = `
		<div class="${hits.css?.div || hitsCss.div}">
			<table class="${hits.css?.table || hitsCss.table}">
				<thead class="${hits.css?.thead || hitsCss.thead}">
				<tr class="${hits.css?.trHead || hitsCss.trHead}" id="hits-header-row">
				</tr>
				</thead>
				<tbody class="${hits.css?.tbody || hitsCss.tbody}" id="hits-table-body">
				</tbody>
			</table>
		</div>
		`;
  const hitsBody =
    document.querySelector<HTMLTableSectionElement>("#hits-table-body");
  var tableHeaderStatic = `<th class="${hits.css?.th || hitsCss.th}">Left KWIC</th>
							<th class="${hits.css?.th || hitsCss.th}">Context</th>
							<th class="${hits.css?.th || hitsCss.th}">Right KWIC</th>`;
  var tableHeaderGeneric = "";
  const results = lines
    .map((line) => {
      let left = line.left;
      let right = line.right;
      let kwic = line.kwic;
      let refs = line.refs;
      let docId = checkRefs(refs, true);
      let refsNorm = checkRefs(refs, false);
      let customUrlNormalized = customUrl.endsWith("/")
        ? customUrl
        : customUrl + "/";
      let refsHeader = refs!
        .filter((ref) => ref.length > 0)
        .map(
          (ref) =>
            `<th class="${hits.css?.th || hitsCss.th}">${ref.split("=")[0]}</th>`
        )
        .join("");
      tableHeaderGeneric = refsHeader;
      let refsColumn = refs!
        .filter((ref) => ref.length > 0)
        .map(
          (ref) =>
            `<td class="${hits.css?.td || hitsCss.td}">${ref.split("=")[1]}</td>`
        )
        .join("");
      let hashId = refsNorm!
        .filter((ref) => !ref.startsWith("doc") && ref.length > 0)
        .map((ref) => `#${ref.split("=")[1]}`)
        .join("");
      return `
			<tr class="${hits.css?.trBody || hitsCss.trBody}">
				${refsColumn}
				<td class="${hits.css?.left || hitsCss.left}">${left}</td>
				<td class="${hits.css?.kwic || hitsCss.kwic}">
					<a href="${customUrlNormalized}${docId}?mark=${kwic.trim()}&noSearch=true${urlparam}${hashId}">
						${kwic}
					</a>
				</td>
				<td class="${hits.css?.right || hitsCss.right}">${right}</td>
			</tr>
			`;
    })
    .join("");
  const tableHeader = tableHeaderGeneric + tableHeaderStatic;
  const hitsHeader =
    document.querySelector<HTMLTableSectionElement>("#hits-header-row");
  hitsHeader!.innerHTML = tableHeader;
  hitsBody!.innerHTML = results;
}
