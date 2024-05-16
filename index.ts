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
            <div id="${this.hitsId}" class="${this.div2css}">
            </div>
            <div id="${this.paginationId}" class="${this.div3css}">
            </div>
          `;
  }

  createHTMLSearchInput() {
    const container = document.querySelector<HTMLDivElement>(`#${this.containerId}`);
    container!.innerHTML = this.searchInput();
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

  search() {
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
        await this.transformResponse(line);
        await this.createPagination();
      }
    });
    (async() => { 
      const url = new URL(window.location.href);
      const query = url.searchParams.get("q");
      if (query) {
        queryType!.value = "cql";
        const input = document.querySelector<HTMLInputElement>(`input#${this.searchInputId}`);
        // const query = url.searchParams.get("selectQueryValue")! === "word" ? this.normalizeQuery(oldQuery)
        //   : url.searchParams.get("selectQueryValue")! === "phrase" ? this.normalizeQuery(oldQuery)
        //   : oldQuery.replace('q', '');
        input!.value = query.startsWith("q") ? query.slice(1) : query;
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
