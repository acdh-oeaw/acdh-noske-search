import { getCorpus, getLines, getStats, responseToHTML } from './src/noske-search'

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

export class NoskeSearch {
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
  pagination: string;
  status: string;

  constructor(options: Options) {
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
    this.searchInputId = "search-input";
    this.hitsId = "hitsbox";
    this.inputPlaceholder = "Suche nach Wörtern oder Phrasen";
    this.containerId = "noske-search";
    this.buttonId = "search-button";
    this.results = "Keine Treffer gefunden";
    this.pagination = "noske-pagination";
    this.status = "idle";
    (() => this.createHTMLSearchInput())();
    (() => this.clearResults())();
  }

  searchInput() {
    return `<div id="searchbox" class="p-2">
              <input
                type="search"
                id="${this.searchInputId}"
                class="w-full rounded border p-2"
                placeholder="${this.inputPlaceholder}"
              />
            </div>
            <div id="${this.hitsId}" class="text-center p-2">
            </div>
            <div id="${this.pagination}" class="text-center p-2">
            </div>
          `;
  }

  createHTMLSearchInput() {
    const container = document.querySelector<HTMLDivElement>(`#${this.containerId}`);
    container!.innerHTML = this.searchInput();
  }

  async createPagination(currentPage: number = 1) {
    const paginationEvent = document.querySelector<HTMLSelectElement>("#noske-pagination-select");
    paginationEvent!.addEventListener("change", async (e) => {
      // @ts-ignore
      this.fromp = parseInt(e.target!.value);
      const query = document.querySelector<HTMLInputElement>(`input#${this.searchInputId}`)!.value;
      const line = await getCorpus(query, {
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
      });
      await this.transformResponse(line);
      // @ts-ignore
      await this.createPagination(e.target!.value);
    });
    paginationEvent!.value = currentPage.toString();
  }

  search() {
    const input = document.querySelector<HTMLInputElement>(`input#${this.searchInputId}`);
    input!.addEventListener("keyup", async (e) => {
      if (e.key !== "Enter") return;
      // @ts-ignore
      const query = e.target!.value;
      if (query.length > 3) {
        const line = await getCorpus(query, {
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
        });
        await this.transformResponse(line);
        await this.createPagination();
      }
    });
  }

  async transformResponse(line: any) {
    const hits = document.querySelector<HTMLDivElement>(`#${this.hitsId}`);
    hits!.innerHTML = "";
    if (line === "No results found") {
      hits!.innerHTML = this.results;
    } else {
      const lines = getLines(line);
      const stats = getStats(line);
      const pages = Math.ceil(stats! / this.pagesize);
      const pagination = document.querySelector<HTMLDivElement>(`#${this.pagination}`);
      pagination!.innerHTML = `<select id="noske-pagination-select" class="p-2">
       ${Array.from({ length: pages }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("")}
       </select>`;
      responseToHTML(lines, this.hitsId, stats!);
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
      }
    });
  }
}


