import { getCorpus, getLines, getStats, responseToHTML } from './src/noske-search'
import { OpenAPI } from './src/client';

type Config = {
  results?: string;
  customUrl?: string;
  urlparam?: string | boolean;
};

type Options = {
  container?: string;
}

type Client = {
  base: string;
  corpname: string;
  viewmode?: "kwic" | "sen" | undefined;
  attrs?: string;
  format?: "json" | "xml" | "csv" | "tsv" | "txt" | "xls" | undefined;
  structs?: string;
  kwicrightctx?: string;
  kwicleftctx?: string;
  refs?: string;
  pagesize?: number;
  fromp?: number;
};

type SearchInput = {
  id: string;
  placeholder?: string;
  css?: {
    div?: string;
    select?: string;
    input?: string;
  }
}

type Pagination = {
  id: string;
  css?: {
    div?: string;
    select?: string;
  };
}

export type Hits = {
  id: string;
  css?: {
    div?: string;
    table?: string;
    thead?: string;
    trHead?: string;
    th?: string;
    tbody?: string;
    trBody?: string;
    td?: string;
    tfoot?: string;
    trFoot?: string;
    tdFoot?: string;
    kwic?: string;
    left?: string;
    right?: string;
  };
}

/**
  * @param container - html div element id to initialize search
  */
export class NoskeSearch {
  viewmode: "kwic" | "sen" | undefined = "kwic";
  attrs = "word,id";
  format: "json" | "xml" | "csv" | "tsv" | "txt" | "xls" | undefined = "json";
  structs = "doc";
  kwicrightctx = "100#";
  kwicleftctx = "100#";
  refs = "doc.id";
  pagesize = 20;
  fromp = 1;
  container = "noske-search";
  inputPlaceholder = "Suche nach Wörtern oder Phrasen";
  hitsCss = "p-2";
  // buttonId = "search-button";
  results = "Keine Treffer gefunden";
  paginationcss = "p-2";
  selectcss = "basis-2/12 p-2";
  inputcss = "basis-10/12 rounded border p-2";
  div1css = "flex flex-row p-2";
  div2css = "text-center p-2";
  div3css = "text-center p-2";
  selectQueryCss = "basis-2/12 p-2";
  customUrl = "";
  urlparam = false;

  constructor(options?: Options) {
    if (!options?.container) console.log("No container defined. Default container id set to 'noske-search'.")
    this.container = options?.container || this.container;
  }

  private searchHits({id, css}: Hits) {
    if (!id) throw new Error("search hits id is not defined");
    const hits = document.querySelector<HTMLDivElement>(`#${id}`);
    hits!.innerHTML = `<div id="${id}-init" class="${css?.div || this.hitsCss}"></div>`;
  }

  private searchPagination ({id, css}: Pagination) {
    if (!id) throw new Error("search pagination id is not defined");
    const pagination = document.querySelector<HTMLDivElement>(`#${id}`);
    pagination!.innerHTML = `<div id="${id}-init"
                              class="${css?.div || this.paginationcss}"></div>`
  }

  private searchInput({
    id, 
    placeholder, 
    css
  }: SearchInput) {
    if (!this.container) throw new Error("main search div container is not defined");
    if (!id) throw new Error("search input id is not defined");
    const container = document.querySelector<HTMLDivElement>(`#${this.container}`);
    container!.innerHTML = 
      `<div id="${id}" class="${css?.div || this.div1css}">
        <select id="${`${id}-select`}"
          class="${css?.select || this.selectQueryCss}">
          <option value="simple">simple</option>
          <option value="cql">cql</option>
        </select>
        <input
          type="search"
          id="${`${id}-input`}"
          class="${css?.input || this.inputcss}"
          placeholder="${placeholder || this.inputPlaceholder}"
        />
      </div>
    `;
  }
 
  // private normalizeQuery(query: string) {
  //   return query.replace('q"', '').replace(/"/g, "").trim();
  // }

  /**
    * @param debug - set to true to show debug information
    * @param hits - define id and css classes for the hits div element as string
    * @param pagination - define id and css classes for the hits div element as string
    * @param client - define the client object with the search parameters
    *  @param client.base - API base URL
    *  @param client.coprname - corpus name of the created Noske verticals
    *  @param client.attr - vertical attributes
    *  @param client.structs - structure elements of verticals
    *  @param clientkwicleftctx - number of left kwic e.g. #100 as string
    *  @param client.kwicrightctx - number of right kwic e.g. #100 as string
    *  @param client.refs - structure attributes e.g. doc.id
    *  @param client.pagesize - number of results lines e.g. 20
    *  @param client.fromp - page number to fetch
    * @param config - define the config for html elements that include css classes
    *  @param config.results - define the results message
    *  @param config.customUrl - define the custom URL for the results
    *  @param config.urlparam - define the URL parameters for the custom URL
    */
  public search({
    debug = false,
    client,
    hits,
    pagination,
    searchInput,
    config
  }: {
    debug?: boolean;
    hits: Hits;
    pagination: Pagination;
    searchInput: SearchInput;
    client: Client;
    config?: Config;
  }
  ) {
    this.searchInput(searchInput);
    this.clearResults(
      hits.id,
      pagination.id,
      searchInput.id
    );
    if (!hits.id) throw new Error("hits.id is not defined");
    this.searchHits(hits);
    if (!pagination.id) throw new Error("pagination.id is not defined");
    this.searchPagination(pagination);

    if (client.base === undefined || client.base === "") throw new Error("Base URL is not defined");
    OpenAPI.BASE = client.base;
    if (client.corpname === undefined || client.corpname === "") throw new Error("Corpus name is not defined");

    const queryType = document.querySelector<HTMLSelectElement>(
      `#${searchInput?.id}-select`);

    const input = document.querySelector<HTMLInputElement>(
      `input#${searchInput?.id}-input`);

    input!.addEventListener("keyup", async (e) => {
      if (e.key !== "Enter") return;
      // @ts-ignore
      const query = e.target!.value;
      if (query.length > 3) {
        const line = await getCorpus(query, {
          base: client.base,
          corpname: client.corpname,
          viewmode: client.viewmode || this.viewmode,
          attrs: client.attrs || this.attrs,
          format: client.format || this.format,
          structs: client.structs || this.structs,
          kwicrightctx: client.kwicrightctx || this.kwicrightctx,
          kwicleftctx: client.kwicleftctx || this.kwicleftctx,
          refs: client.refs || this.refs,
          pagesize: client.pagesize || this.pagesize,
          fromp: client.fromp || this.fromp,
          selectQueryId: `${searchInput?.id}-select`
        });
        if (debug && line !== null) console.log(line);
        await this.transformResponse(line, client, hits, pagination, config!);
        await this.createPagination(1, client, hits, pagination, searchInput.id, config!);
      }
    });

    input!.addEventListener("change", async (e) => {
      // @ts-ignore
      const query = e.target!.value;
      if (query.length > 3) {
        const line = await getCorpus(query, {
          base: client.base,
          corpname: client.corpname,
          viewmode: client.viewmode || this.viewmode,
          attrs: client.attrs || this.attrs,
          format: client.format || this.format,
          structs: client.structs || this.structs,
          kwicrightctx: client.kwicrightctx || this.kwicrightctx,
          kwicleftctx: client.kwicleftctx || this.kwicleftctx,
          refs: client.refs || this.refs,
          pagesize: client.pagesize || this.pagesize,
          fromp: client.fromp || this.fromp,
          selectQueryId: `${searchInput?.id}-select`
        });
        if (debug && line !== null) console.log(line);
        await this.transformResponse(line, client, hits, pagination, config!);
        await this.createPagination(1, client, hits, pagination, searchInput.id, config!);
      }
    });
    
    (async() => { 
      const url = new URL(window.location.href);
      const query = url.searchParams.get("q");
      if (query) {
        debug ? queryType!.value = "simple" : queryType!.value = "cql";
        const input = document.querySelector<HTMLInputElement>(
          `input#${searchInput?.id}-input`);
        // const query = url.searchParams.get("selectQueryValue")! === "word" ? this.normalizeQuery(oldQuery)
        //   : url.searchParams.get("selectQueryValue")! === "phrase" ? this.normalizeQuery(oldQuery)
        //   : oldQuery.replace('q', '');
        input!.value = query?.startsWith("q") ? query.slice(1) : query;
        const line = await getCorpus(query, {
          base: client.base,
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
          selectQueryId: `${searchInput?.id}-select`,
          urlparam: true
        });
        if (debug && line !== null) console.log(line);
        await this.transformResponse(line, client, hits, pagination, config!);
        await this.createPagination(1, client, hits, pagination, searchInput.id, config!);
      }
    })();
  }

  private async transformResponse(
    line: any,
    client: Client,
    hits: Hits,
    pagination: Pagination,
    config: Config
  ) {
    const hitsContainer = document.querySelector<HTMLDivElement>(`#${hits.id}-init`);
    hitsContainer!.innerHTML = "";
    if (line === "No results found") {
      hitsContainer!.innerHTML = config?.results || this.results;
    } else if (line.error) {
      hitsContainer!.innerHTML = line.error;
    } else {
      const lines = getLines(line);
      const stats = getStats(line);
      const pages = Math.ceil(stats! / (client?.pagesize || this.pagesize));
      const pag = document.querySelector<HTMLDivElement>(`#${pagination.id}-init`);
      pag!.innerHTML = 
        `<select id="${`${pagination.id}-select`}"
          class="${pagination.css?.select || this.selectcss}">
          ${Array.from({ length: pages }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("")}
        </select>`;
      responseToHTML(lines, `${hits.id}-init`, stats!, config?.customUrl || this.customUrl, 
        config?.urlparam || this.urlparam, hits!);
    }
  }

  private async createPagination(
    currentPage: number = 1,
    client: Client,
    hits: Hits,
    pagination: Pagination,
    searchInputId: string,
    config: Config
  ) {
    const paginationEvent = document.querySelector<HTMLSelectElement>(
      `#${pagination.id}-select`);
    paginationEvent!.addEventListener("change", async (e) => {
      // @ts-ignore
      client.fromp = parseInt(e.target!.value);
      const query = document.querySelector<HTMLInputElement>(
        `input#${searchInputId}-input`)!.value;
      const line = await getCorpus(query, {
        base: client.base,
        corpname: client.corpname,
        viewmode: client.viewmode || this.viewmode,
        attrs: client.attrs || this.attrs,
        format: client.format || this.format,
        structs: client.structs || this.structs,
        kwicrightctx: client.kwicrightctx || this.kwicrightctx,
        kwicleftctx: client.kwicleftctx || this.kwicleftctx,
        refs: client.refs || this.refs,
        pagesize: client.pagesize || this.pagesize,
        fromp: client.fromp || this.fromp,
        selectQueryId: `${searchInputId}-select`
      });
      await this.transformResponse(line, client, hits, pagination, config);
      // @ts-ignore
      await this.createPagination(e.target!.value, client, hits, pagination.id, searchInputId, config);
    });
    paginationEvent!.value = currentPage.toString();
  }

  private clearResults(hitsId: string, paginationId: string, searchInputId: string) {
    const input = document.querySelector<HTMLInputElement>(
      `input#${searchInputId}-input`);
    input!.addEventListener("input", async (e) => {
      // @ts-ignore
      const query = e.target!.value;
      if (query.length === 0) {
        const hits = document.querySelector<HTMLDivElement>(`#${hitsId}-init`);
        hits!.innerHTML = "";
        const pagination = document.querySelector<HTMLDivElement>(`#${paginationId}-init`);
        pagination!.innerHTML = "";
        window.history.pushState({}, "", `${window.location.pathname}`);
      }
    });
  }
}
