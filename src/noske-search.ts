import { CorpusSearchService } from "./client/services.gen.ts";
import { OpenAPI } from "./client/core/OpenAPI.ts";
import { _concordance, _wordlist } from "./client/types.gen.ts";
import type {
  Hits,
  URLParams,
  URLCallback,
  CustomSynopticView,
  LineIds,
  AutocompleteOptions,
  CustomResponseHtml,
} from "../index";

export type Lines = {
  left: string;
  right: string;
  kwic: string;
  kwic_attr?: string;
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
  wlsort?: "frq" | "docf" | undefined;
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
    wlsort: options.wlsort,
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
    // @ts-ignore
    let kwic_attr: string = value.Kwic?.map((word) => word.attr).join(" ")!;
    let refs: Array<string> = value.Refs?.map((ref) => ref)!;
    let line: Lines = {
      left: left,
      right: right,
      kwic: kwic,
      kwic_attr: kwic_attr,
      refs: refs,
    };
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

export function initAutocomplete(
  containerId: string,
  autocompleteOptions: AutocompleteOptions
): boolean {
  const autoContainer = document.querySelector<HTMLDivElement>(
    `#${autocompleteOptions.id}`
  );
  if (autoContainer) {
    autoContainer.remove();
  }
  const inputContainer = document.querySelector<HTMLDivElement>(
    `#${containerId}`
  );
  let div = document.createElement("div");
  div.id = autocompleteOptions.id;
  div.classList.add(...autocompleteOptions.css!.div.split(" "));
  div.style.minWidth = "250px";
  div.style.minHeight = "50px";
  inputContainer?.prepend(div);
  const loader = document.createElement("div");
  loader.classList.add(...autocompleteOptions.css!.loader.split(" "));
  loader.classList.add("loader");
  div.appendChild(loader);
  const rollingKeyframes = new KeyframeEffect(
    loader,
    [
      { transform: "rotate(0deg)" }, // keyframe
      { transform: "rotate(1080deg)" }, // keyframe
    ],
    {
      // keyframe options
      duration: 3000,
      direction: "alternate",
      easing: "linear",
      iterations: 1000,
    }
  );
  const rotateAnimation = new Animation(rollingKeyframes, document.timeline);
  rotateAnimation.play();
  return true;
}

export function itemsToHTML(
  items: Array<Items>,
  containerId: string,
  autocompleteOptions: AutocompleteOptions
): void {
  const container = document.getElementById(autocompleteOptions.id);
  let ul = document.createElement("ul");
  ul.classList.add(...autocompleteOptions.css!.ul.split(" "));
  items.map((item) => {
    let li = document.createElement("li");
    li.classList.add(...autocompleteOptions.css!.li.split(" "));
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
      // input.addEventListener("focusout", (event) => {
      //   setTimeout(() => {
      //     document.getElementById("nokse-autocomplete")?.remove();
      //   }, 200);
      // });
    });
    ul.appendChild(li);
  });
  container?.appendChild(ul);
  document.querySelector(".loader")?.remove();
}

export function getStats(response: _concordance): _concordance["fullsize"] {
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
  head: "text-center",
  trHead: "",
  th: "text-sm text-gray-500",
  tbody: "",
  trBody: "p-2",
  td: "text-sm text-gray-500",
  kwic: "text-lg text-red-500",
  left: "text-sm text-gray-500 p-2 text-right",
  right: "text-sm text-gray-500 p-2 text-left",
  item: "p-4 border rounded-md",
};

export function responseToHTML(
  lines: Array<Lines>,
  client_attrs: Array<string>,
  containerId: string,
  customUrl: string,
  urlparam: URLParams = false,
  tableView: boolean = true,
  customUrlTransform: URLCallback | false = false,
  customSynopticView: CustomSynopticView | false = false,
  customResponseHtml: CustomResponseHtml | false = false,
  hits: Hits
): void {
  if (customResponseHtml) {
    customResponseHtml(lines, containerId, hits, client_attrs);
    return;
  }
  const hitsContainer = document.querySelector<HTMLDivElement>(
    `#${containerId}`
  );
  if (tableView) {
    hitsContainer!.innerHTML = `
		<div class="${hits.css?.div || hitsCss.div}">
			<table class="${hits.css?.table || hitsCss.table}">
				<thead class="${hits.css?.head || hitsCss.head}">
				<tr class="${hits.css?.trHead || hitsCss.trHead}" id="hits-header-row">
				</tr>
				</thead>
				<tbody class="${hits.css?.tbody || hitsCss.tbody}" id="hits-table-body">
				</tbody>
			</table>
		</div>
		`;
    var hitsBody =
      document.querySelector<HTMLTableSectionElement>("#hits-table-body");
    var tableHeaderStatic = `<th class="${hits.css?.th || hitsCss.th}">Left KWIC</th>
							<th class="${hits.css?.th || hitsCss.th}">Context</th>
							<th class="${hits.css?.th || hitsCss.th}">Right KWIC</th>`;
    var tableHeaderGeneric = "";
  }

  var lineIds: LineIds = {};
  const results = lines
    .map((line, idx) => {
      let left = line.left;
      let right = line.right;
      let kwic = line.kwic;
      let kwic_attr = line.kwic_attr?.split("/");
      let refs = line.refs;
      let docId = checkRefs(refs, true);
      let refsNorm = checkRefs(refs, false);
      let customUrlExists = customUrl.length > 0 ? true : false;
      let customUrlNormalized =
        customUrlExists && customUrl.endsWith("/")
          ? customUrl
          : customUrl + "/";
      let customUrlTransformExists = customUrlExists ? customUrlNormalized : "";
      if (tableView) {
        var refsHeader = refs!
          .filter((ref) => ref.length > 0 && ref.includes("title"))
          .map(
            (ref) =>
              `<th class="${hits.css?.th || hitsCss.th}">${ref.split("=")[0]}</th>`
          )
          .join("");
        tableHeaderGeneric = refsHeader;
        var refsColumn = refs!
          .filter((ref) => ref.length > 0 && ref.includes("title"))
          .map(
            (ref) =>
              `<td class="${hits.css?.td || hitsCss.td}">${ref.split("=")[1]}</td>`
          )
          .join("");
        /*
        Checks if the customUrlTransform callback is provided and uses it to transform the url
        Otherwise, it uses the default logic to transform the url
        customUrlTransform: (line: Lines) => URL returns a URL object
      */
      } else {
        var refsHeader = refs!
          .filter((ref) => ref.length > 0 && ref.includes("title"))
          .map((ref) => `<span>${ref.split("=")[1]}</span><br>`)
          .join("");
      }
      let id: string = "";
      // let pbId: string = "";
      if (customSynopticView) {
        if (client_attrs) {
          var id_idx = client_attrs.indexOf("id");
          id = kwic_attr![id_idx];
          // var id_idx = client_attrs.indexOf("pbId");
          // pbId = kwic_attr![id_idx];
        }
        var lineId = "line-" + idx + "__" + docId + "__" + id;
        lineIds[lineId] = line;
      } else if (customUrlTransform) {
        if (client_attrs) {
          var id_idx = client_attrs.indexOf("id");
          id = kwic_attr![id_idx];
          // var id_idx = client_attrs.indexOf("pbId");
          // pbId = kwic_attr![id_idx];
        }
        var url: URL = customUrlTransform(line);
      } else {
        let hashId = refsNorm!
          .filter((ref) => !ref.startsWith("doc") && ref.length > 0)
          .map((ref) => `#${ref.split("=")[1]}`)
          .join("");
        if (client_attrs) {
          var id_idx = client_attrs.indexOf("id");
          id = kwic_attr![id_idx];
          // var id_idx = client_attrs.indexOf("pbId");
          // pbId = kwic_attr![id_idx];
        }
        if (!id) {
          console.log("id attribute is not present in the client attributes");
          id = "";
        }
        if (
          customUrlTransformExists &&
          customUrlTransformExists.startsWith("http")
        ) {
          var url = new URL(customUrlNormalized + docId);
        } else if (
          customUrlTransformExists &&
          !customUrlTransformExists.startsWith("http")
        ) {
          var url = new URL(
            window.location.origin + customUrlNormalized + docId
          );
        } else {
          var url = new URL(
            window.location.origin + window.location.pathname + docId
          );
        }
        if (typeof urlparam === "object") {
          for (let param of Object.entries(urlparam)) {
            url.searchParams.set(param[0], param[1]);
          }
        }
        if (id) {
          console.log(id);
          url.hash = id;
        } else {
          console.log(hashId);
          url.hash = hashId;
        }
      }
      if (tableView) {
        return `
			<tr class="${hits.css?.trBody || hitsCss.trBody}">
				${refsColumn!}
				<td class="${hits.css?.left || hitsCss.left}">${left}</td>
				<td class="${hits.css?.kwic || hitsCss.kwic}" ${lineId! ? `id="${lineId}"` : ""}>
         ${
           customSynopticView
             ? kwic
             : `<a href="${url!}">
						${kwic}
					</a>`
         }
				</td>
				<td class="${hits.css?.right || hitsCss.right}">${right}</td>
			</tr>
			`;
      } else {
        return `
          <div class="${hits.css?.item || hitsCss.item}" ${lineId! ? `id="${lineId}"` : ""}>
          ${
            customSynopticView
              ? `<span>${left}</span><span class="${hits.css?.kwic || hitsCss.kwic}">${kwic} </span><span>${right}</span>`
              : `<a href="${url!}">
                  <span>${left}</span><span class="${hits.css?.kwic || hitsCss.kwic}">${kwic} </span><span>${right}</span>
                </a>`
          } 
          <small class="${hits.css?.head || hitsCss.head} align-bottom"><br>${refsHeader}</small>
          </div>
          `;
      }
    })
    .join("");
  if (tableView) {
    const tableHeader = tableHeaderGeneric! + tableHeaderStatic!;
    const hitsHeader =
      document.querySelector<HTMLTableSectionElement>("#hits-header-row");
    hitsHeader!.innerHTML = tableHeader;
    hitsBody!.innerHTML = results;
  } else {
    hitsContainer!.innerHTML = results;
  }
  customSynopticView ? customSynopticView(lineIds) : null;
}
