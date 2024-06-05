import { getCorpus, getLines, getStats, responseToHTML } from './src/noske-search'
import { OpenAPI } from './src/client';

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
  divInputId?: string;
  searchInputId?: string;
  hitsId?: string;
  inputPlaceholder?: string;
  containerId?: string;
  results?: string;
  paginationId?: string;
  paginationcss?: string;
  selectId?: string;
  selectcss?: string;
  inputscss?: string;
  div1css?: string;
  div2css?: string;
  div3css?: string;
  selectQueryId?: string;
  selectQueryCss?: string;
  customUrl?: string;
  urlparam?: string | boolean;
};

/**
  * @param base - API base URL
  * @param coprname - corpus name of the created Noske verticals
  * @param attr - vertical attributes
  * @param structs - structure elements of verticals
  * @param kwicleftctx - number of left kwic e.g. #100 as string
  * @param kwicrightctx - number of right kwic e.g. #100 as string
  * @param refs - structure attributes e.g. doc.id
  * @param pagesize - number of results lines e.g. 20
  * @param fromp - page number to fetch
  * @param searchInputId - html input element id
  * @param buttonId - not in use
  * @param hitsId - html div element id used for the hits div element
  * @param inputPlaceholder - input element placeholder string
  * @param containerId - div html element id the search interface will be attached to
  * @param results - string to show of now results were found
  * @param paginationId - div html element id for the pagination
  * @param selectId - select html element id
  * @param selectcss - select html element classes for css handling
  * @param inputcss - input html element classes for css handling
  * @param div1css - div html element 1 classes for css handling 
  * @param div2css - div html element 2 classes for css handling
  * @param div3css - div html element 3 classes for css handling
  * @param divInputId - div html element id as parent for the input element
  * @param paginationcss - div html element classes for css handling
  * @param selectQueryId - select html element id
  * @param selectQueryCss - select html element classes for css handling
  * @param customUrl - URL base used to link results lines
  * @param urlparam - url parameters attached to the results linkes link
  */
export class NoskeSearch {
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
  searchInputId: string;
  buttonId: string;
  hitsId: string;
  inputPlaceholder: string;
  containerId: string;
  results: string;
  paginationId: string;
  selectId: string;
  selectcss: string;
  inputcss: string;
  div1css: string;
  div2css: string;
  div3css: string;
  divInputId: string;
  paginationcss: string;
  selectQueryId: string;
  selectQueryCss: string;
  customUrl: string;
  urlparam: string | boolean;

  constructor(options: Options) {
    this.base = options.base;
    this.corpname = options.corpname;
    this.viewmode = options.viewmode;
    this.attrs = options.attrs;
    this.format = options.format;
    this.structs = options.structs;
    this.kwicrightctx = options.kwicrightctx;
    this.kwicleftctx = options.kwicleftctx;
    this.refs = options.refs;
    this.pagesize = options.pagesize;
    this.fromp = options.fromp;
    this.divInputId = options.divInputId || "searchbox";
    this.searchInputId = options.searchInputId || "search-input";
    this.hitsId = options.hitsId || "hitsbox";
    this.inputPlaceholder = options.inputPlaceholder || "Suche nach Wörtern oder Phrasen";
    this.containerId = options.containerId || "noske-search";
    this.buttonId = "search-button";
    this.results = options.results || "Keine Treffer gefunden";
    this.paginationId = options.paginationId || "noske-pagination";
    this.paginationcss = options.paginationcss || "p-2";
    this.selectId = options.selectId || "noske-pagination-select";
    this.selectcss = options.selectcss || "basis-2/12 p-2";
    this.inputcss = options.inputscss || "basis-10/12 rounded border p-2";
    this.div1css = options.div1css || "flex flex-row p-2";
    this.div2css = options.div2css || "text-center p-2";
    this.div3css = options.div3css || "text-center p-2";
    this.selectQueryId = options.selectQueryId || "select-query";
    this.selectQueryCss = options.selectQueryCss || "basis-2/12 p-2";
    this.customUrl = options.customUrl || "";
    this.urlparam = options.urlparam || false;
    (() => this.createHTMLSearchInput())();
    (() => this.clearResults())();
  }

  searchInput() {
    return `<div id="${this.divInputId}" class="${this.div1css}">
              <select id="${this.selectQueryId}" class="${this.selectQueryCss}">
                <option value="simple">simple</option>
                <option value="cql">cql</option>
              </select>
              <input
                type="search"
                id="${this.searchInputId}"
                class="${this.inputcss}"
                placeholder="${this.inputPlaceholder}"
              />
            </div>
          `;
  }

  searchHits() {
    return `<div id="${this.hitsId}-init" class="${this.div2css}">
            </div>`;
  }

  searchPagination() {
    return `<div id="${this.paginationId}-init" class="${this.div3css}">
          </div>`
  }

  createHTMLSearchInput() {
    const container = document.querySelector<HTMLDivElement>(`#${this.containerId}`);
    container!.innerHTML = this.searchInput();
    const hits = document.querySelector<HTMLDivElement>(`#${this.hitsId}`);
    hits!.innerHTML = this.searchHits();
    const pagination = document.querySelector<HTMLDivElement>(`#${this.paginationId}`);
    pagination!.innerHTML = this.searchPagination();
  }

  async createPagination(currentPage: number = 1) {
    const paginationEvent = document.querySelector<HTMLSelectElement>(`#${this.selectId}`);
    paginationEvent!.addEventListener("change", async (e) => {
      // @ts-ignore
      this.fromp = parseInt(e.target!.value);
      const query = document.querySelector<HTMLInputElement>(`input#${this.searchInputId}`)!.value;
      const line = await getCorpus(query, {
        base: this.base,
        corpname: this.corpname,
        viewmode: this.viewmode,
        attrs: this.attrs,
        format: this.format,
        structs: this.structs,
        kwicrightctx: this.kwicrightctx,
        kwicleftctx: this.kwicleftctx,
        refs: this.refs,
        pagesize: this.pagesize,
        fromp: this.fromp,
        selectQueryId: this.selectQueryId
      });
      await this.transformResponse(line);
      // @ts-ignore
      await this.createPagination(e.target!.value);
    });
    paginationEvent!.value = currentPage.toString();
  }

  normalizeQuery(query: string) {
    return query.replace('q"', '').replace(/"/g, "").trim();
  }

  search(debug: boolean = false) {
    if (this.base === undefined || this.base === "") throw new Error("Base URL is not defined");
    OpenAPI.BASE = this.base;
    const queryType = document.querySelector<HTMLSelectElement>(`#${this.selectQueryId}`);
    const input = document.querySelector<HTMLInputElement>(`input#${this.searchInputId}`);
    input!.addEventListener("keyup", async (e) => {
      if (e.key !== "Enter") return;
      // @ts-ignore
      const query = e.target!.value;
      if (query.length > 3) {
        const line = await getCorpus(query, {
          base: this.base,
          corpname: this.corpname,
          viewmode: this.viewmode,
          attrs: this.attrs,
          format: this.format,
          structs: this.structs,
          kwicrightctx: this.kwicrightctx,
          kwicleftctx: this.kwicleftctx,
          refs: this.refs,
          pagesize: this.pagesize,
          fromp: this.fromp,
          selectQueryId: this.selectQueryId
        });
        if (debug && line !== null) console.log(line);
        await this.transformResponse(line);
        await this.createPagination();
      }
    });
    input!.addEventListener("change", async (e) => {
      // @ts-ignore
      const query = e.target!.value;
      if (query.length > 3) {
        const line = await getCorpus(query, {
          base: this.base,
          corpname: this.corpname,
          viewmode: this.viewmode,
          attrs: this.attrs,
          format: this.format,
          structs: this.structs,
          kwicrightctx: this.kwicrightctx,
          kwicleftctx: this.kwicleftctx,
          refs: this.refs,
          pagesize: this.pagesize,
          fromp: this.fromp,
          selectQueryId: this.selectQueryId
        });
        if (debug && line !== null) console.log(line);
        await this.transformResponse(line);
        await this.createPagination();
      }
    });
    (async() => { 
      const url = new URL(window.location.href);
      const query = url.searchParams.get("q");
      if (query) {
        debug ? queryType!.value = "simple" : queryType!.value = "cql";
        const input = document.querySelector<HTMLInputElement>(`input#${this.searchInputId}`);
        // const query = url.searchParams.get("selectQueryValue")! === "word" ? this.normalizeQuery(oldQuery)
        //   : url.searchParams.get("selectQueryValue")! === "phrase" ? this.normalizeQuery(oldQuery)
        //   : oldQuery.replace('q', '');
        input!.value = query?.startsWith("q") ? query.slice(1) : query;
        const line = await getCorpus(query, {
          base: this.base,
          corpname: url.searchParams.get("corpname")!,
          viewmode: url.searchParams.get("viewmode") as "kwic" | "sen",
          attrs: url.searchParams.get("attrs")!,
          format: url.searchParams.get("format") as "json" | "xml" | "csv" | "tsv" | "txt" | "xls",
          structs: url.searchParams.get("structs")!,
          kwicrightctx: url.searchParams.get("kwicrightctx")!,
          kwicleftctx: url.searchParams.get("kwicleftctx")!,
          refs: url.searchParams.get("refs")!,
          pagesize: parseInt(url.searchParams.get("pagesize")!),
          fromp: parseInt(url.searchParams.get("fromp")!),
          selectQueryId: this.selectQueryId,
          urlparam: true
        });
        if (debug && line !== null) console.log(line);
        await this.transformResponse(line);
        await this.createPagination();
      }
    })();
  }

  async transformResponse(line: any) {
    const hits = document.querySelector<HTMLDivElement>(`#${this.hitsId}`);
    hits!.innerHTML = "";
    if (line === "No results found") {
      hits!.innerHTML = this.results;
    } else if (line.error) {
      hits!.innerHTML = line.error;
    } else {
      const lines = getLines(line);
      const stats = getStats(line);
      const pages = Math.ceil(stats! / this.pagesize);
      const pagination = document.querySelector<HTMLDivElement>(`#${this.paginationId}`);
      pagination!.innerHTML = `<select id="${this.selectId}" class="${this.selectcss}">
       ${Array.from({ length: pages }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("")}
       </select>`;
      responseToHTML(lines, this.hitsId, stats!, this.customUrl, this.urlparam);
    }
  }

  clearResults() {
    const input = document.querySelector<HTMLInputElement>(`input#${this.searchInputId}`);
    input!.addEventListener("input", async (e) => {
      // @ts-ignore
      const query = e.target!.value;
      if (query.length === 0) {
        const hits = document.querySelector<HTMLDivElement>(`#${this.hitsId}`);
        hits!.innerHTML = "";
        const pagination = document.querySelector<HTMLDivElement>(`#${this.paginationId}`);
        pagination!.innerHTML = "";
        window.history.pushState({}, "", `${window.location.pathname}`);
      }
    });
  }
}
