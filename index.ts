import {
  getWordsList,
  getItems,
  itemsToHTML,
  getCorpus,
  getLines,
  getStats,
  responseToHTML,
} from "./src/noske-search";
import { OpenAPI } from "./src/client";
import type { Lines } from "./src/noske-search";

type Config = {
  results?: string;
  customUrl?: string;
  urlparam?: URLParams;
  customUrlTransform?: URLCallback;
  customSynopticView?: CustomSynopticView;
};

export type LineIds = {
  [key: string]: Lines;
};

export type CustomSynopticView = (lineIds: LineIds) => void;

export type URLParams = { [key: string]: string } | boolean;

export type URLCallback = (lines: Lines) => URL;

type Items = {
  frq: number;
  relfreq: number;
  str: string;
  attr: string;
};

type AutocompleteOptions = {
  id: string;
  css: {
    div: string;
    ul: string;
    li: string;
  };
};

type Options = {
  container?: string;
  autocomplete?: boolean;
  wordlistattr?: Array<string>;
};

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
  button?: string;
  css?: {
    div?: string;
    select?: string;
    input?: string;
    button?: string;
  };
};

type Pagination = {
  id: string;
  css?: {
    div?: string;
    select?: string;
  };
};

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
    kwic?: string;
    left?: string;
    right?: string;
  };
};

type Stats = {
  id: string;
  label?: string;
  css?: {
    div?: string;
    label?: string;
  };
};

/**
 * @param container - html div element id to initialize search
 */
export class NoskeSearch {
  private viewmode: "kwic" | "sen" | undefined = "kwic";
  private attrs = "word,id";
  private format: "json" | "xml" | "csv" | "tsv" | "txt" | "xls" | undefined =
    "json";
  private structs = "doc";
  private kwicrightctx = "100#";
  private kwicleftctx = "100#";
  private refs = "doc.id";
  private pagesize = 20;
  private fromp = 1;
  private container = "noske-search";
  private inputPlaceholder =
    "Search for words, phrases or CQL queries (Regex allowed)";
  private hitsCss = "p-2";
  // buttonId = "search-button";
  private results = "No Hits found. Please try another search query.";
  private paginationcss = "p-2";
  private selectcss = "basis-2/12 p-2";
  private inputcss = "basis-10/12 rounded border p-2";
  private div1css = "flex flex-row p-2";
  private button = "search";
  private buttoncss = "p-2";
  // private div2css = "text-center p-2";
  // private div3css = "text-center p-2";
  private selectQueryCss = "basis-2/12 p-2";
  private customUrl = "";
  private urlparam = false;
  private statsDiv = "flex flex-row m-2";
  private statsLabel = "p-2";
  private statsLabelValue = "Hits:";
  private wordlistattr = ["word", "lemma", "type", "id"];
  private autocompleteOptions = {
    id: "noske-autocomplete",
    css: {
      div: "bg-white border border-gray-300 absolute ml-40 mt-10 text-left",
      ul: "p-0",
      li: "p-2 hover:bg-gray-100 text-sm text-gray-500 hover:cursor-pointer",
    },
  };
  public minQueryLength = 2;
  public autocomplete = false;

  constructor(options?: Options) {
    if (!options?.container)
      console.log(
        "No container defined. Default container id set to 'noske-search'."
      );
    this.autocomplete = options?.autocomplete || this.autocomplete;
    this.container = options?.container || this.container;
    this.wordlistattr = options?.wordlistattr || this.wordlistattr;
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
   *  @param client.kwicleftctx - number of left kwic e.g. #100 as string
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
    config,
    stats,
    autocompleteOptions,
  }: {
    debug?: boolean;
    hits: Hits;
    pagination: Pagination;
    searchInput: SearchInput;
    client: Client;
    config?: Config;
    stats: Stats;
    autocompleteOptions?: AutocompleteOptions;
  }): void {
    this.searchInput(searchInput);
    this.clearResults(hits.id, pagination.id, searchInput.id, stats.id);
    if (!hits.id) throw new Error("hits.id is not defined");
    this.searchHits(hits);
    if (!pagination.id) throw new Error("pagination.id is not defined");
    this.searchPagination(pagination);

    if (client.base === undefined || client.base === "")
      throw new Error("Base URL is not defined");
    OpenAPI.BASE = client.base;
    if (client.corpname === undefined || client.corpname === "")
      throw new Error("Corpus name is not defined");

    const queryType = document.querySelector<HTMLSelectElement>(
      `#${searchInput?.id}-select`
    );

    const input = document.querySelector<HTMLInputElement>(
      `input#${searchInput?.id}-input`
    );

    const searchButton = document.querySelector<HTMLButtonElement>(
      "button#noske-search-button"
    );

    input!.addEventListener("keyup", async (e) => {
      if (e.key !== "Enter") {
        if (
          this.autocomplete &&
          // @ts-ignore
          e.target!.value.length >= this.minQueryLength
        ) {
          var allItems: Array<Items> = [];
          for (let word of this.wordlistattr) {
            if (word.length === 0) return;
            const wordList = await getWordsList({
              corpname: client.corpname,
              wlattr: word,
              wlmaxitems: 100,
              // @ts-ignore
              wlpat: `.*${e.target!.value}.*`,
              wltype: "simple",
              includeNonwords: 1,
              wlicase: 1,
              wlminfreq: 0,
            });
            if (debug && wordList !== null) console.log(wordList);
            let items = getItems(wordList, word);
            allItems.push(...items);
          }
          setTimeout(() => {
            // @ts-ignore
            itemsToHTML(
              allItems,
              searchInput.id,
              autocompleteOptions || this.autocompleteOptions
            );
          }, 400);
        } else {
          return;
        }
      } else {
        // @ts-ignore
        const query = e.target!.value;
        if (query.length >= this.minQueryLength) {
          const line = await getCorpus(query, {
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
            selectQueryId: `${searchInput?.id}-select`,
          });
          if (debug && line !== null) console.log(line);
          await this.transformResponse(
            line,
            client,
            hits,
            pagination,
            config!,
            stats!
          );
          await this.createPagination(
            1,
            client,
            hits,
            pagination,
            searchInput.id,
            config!,
            stats!
          );
        }
      }
    });

    input!.addEventListener("focus", async () => {
      setTimeout(() => {
        document
          .getElementById(autocompleteOptions!.id || "noske-autocomplete")
          ?.remove();
      }, 200);
    });

    searchButton!.addEventListener("click", async () => {
      // @ts-ignore
      const query = input!.value;
      if (query.length >= this.minQueryLength) {
        const line = await getCorpus(query, {
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
          selectQueryId: `${searchInput?.id}-select`,
        });
        if (debug && line !== null) console.log(line);
        await this.transformResponse(
          line,
          client,
          hits,
          pagination,
          config!,
          stats!
        );
        await this.createPagination(
          1,
          client,
          hits,
          pagination,
          searchInput.id,
          config!,
          stats!
        );
      }
      setTimeout(() => {
        document
          .getElementById(autocompleteOptions!.id || "noske-autocomplete")
          ?.remove();
      }, 200);
    });

    (async () => {
      const url = new URL(window.location.href);
      const query = url.searchParams.get("q");
      if (query) {
        debug ? (queryType!.value = "simple") : (queryType!.value = "cql");
        const input = document.querySelector<HTMLInputElement>(
          `input#${searchInput?.id}-input`
        );
        // const query = url.searchParams.get("selectQueryValue")! === "word" ? this.normalizeQuery(oldQuery)
        //   : url.searchParams.get("selectQueryValue")! === "phrase" ? this.normalizeQuery(oldQuery)
        //   : oldQuery.replace('q', '');
        input!.value = query?.startsWith("q") ? query.slice(1) : query;
        const line = await getCorpus(query, {
          corpname: url.searchParams.get("corpname")!,
          viewmode: url.searchParams.get("viewmode") as "kwic" | "sen",
          attrs: url.searchParams.get("attrs")!,
          format: url.searchParams.get("format") as
            | "json"
            | "xml"
            | "csv"
            | "tsv"
            | "txt"
            | "xls",
          structs: url.searchParams.get("structs")!,
          kwicrightctx: url.searchParams.get("kwicrightctx")!,
          kwicleftctx: url.searchParams.get("kwicleftctx")!,
          refs: url.searchParams.get("refs")!,
          pagesize: parseInt(url.searchParams.get("pagesize")!),
          fromp: parseInt(url.searchParams.get("fromp")!),
          selectQueryId: `${searchInput?.id}-select`,
          urlparam: true,
        });
        if (debug && line !== null) console.log(line);
        await this.transformResponse(
          line,
          client,
          hits,
          pagination,
          config!,
          stats!
        );
        await this.createPagination(
          1,
          client,
          hits,
          pagination,
          searchInput.id,
          config!,
          stats!
        );
      }
    })();
  }

  private searchHits({ id, css }: Hits): void {
    if (!id) throw new Error("search hits id is not defined");
    const hits = document.querySelector<HTMLDivElement>(`#${id}`);
    hits!.innerHTML = `<div id="${id}-init" class="${css?.div || this.hitsCss}"></div>`;
  }

  private searchPagination({ id, css }: Pagination): void {
    if (!id) throw new Error("search pagination id is not defined");
    const pagination = document.querySelector<HTMLDivElement>(`#${id}`);
    pagination!.innerHTML = `<div id="${id}-init"
                              class="${css?.div || this.paginationcss}"></div>`;
  }

  private searchInput({ id, placeholder, button, css }: SearchInput): void {
    if (!this.container)
      throw new Error("main search div container is not defined");
    if (!id) throw new Error("search input id is not defined");
    const container = document.querySelector<HTMLDivElement>(
      `#${this.container}`
    );
    container!.innerHTML = `<div id="${id}" class="${css?.div || this.div1css}">
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
          autocomplete="off"
        />
        <button id="noske-search-button" class="${css?.button || this.buttoncss}">${button || this.button}</button>
      </div>
    `;
  }

  private transformStats(
    options: { id: string; css: { div: string; label: string } },
    stats: number,
    label: string
  ): void {
    const statsContainer = document.querySelector<HTMLDivElement>(
      `#${options.id}`
    );
    const html = `<div id="${options.id}-init" class="${options.css.div}">
                    <label class="${options.css.label}">${label} ${stats}</label>
                  </div>`;
    statsContainer!.innerHTML = html;
  }

  private async transformResponse(
    line: any,
    client: Client,
    hits: Hits,
    pagination: Pagination,
    config: Config,
    statistics: Stats
  ): Promise<void> {
    const hitsContainer = document.querySelector<HTMLDivElement>(
      `#${hits.id}-init`
    );
    hitsContainer!.innerHTML = "";
    if (line === "No results found") {
      hitsContainer!.innerHTML = config?.results || this.results;
    } else if (line.error) {
      hitsContainer!.innerHTML = line.error;
    } else {
      const lines = getLines(line);
      const stats = getStats(line);
      const client_attr = client.attrs?.split(",");
      const pages = Math.ceil(stats! / (client?.pagesize || this.pagesize));
      const pag = document.querySelector<HTMLDivElement>(
        `#${pagination.id}-init`
      );
      pag!.innerHTML = `<select id="${`${pagination.id}-select`}"
          class="${pagination.css?.select || this.selectcss}">
          ${Array.from({ length: pages }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("")}
        </select>`;
      responseToHTML(
        lines,
        client_attr!,
        `${hits.id}-init`,
        config?.customUrl || this.customUrl,
        config?.urlparam || this.urlparam,
        config?.customUrlTransform || false,
        config?.customSynopticView || false,
        hits!
      );
      if (stats) {
        this.transformStats(
          {
            id: statistics.id,
            css: {
              div: statistics.css?.div || this.statsDiv,
              label: statistics.css?.label || this.statsLabel,
            },
          },
          stats,
          statistics.label || this.statsLabelValue
        );
      }
    }
  }

  private async createPagination(
    currentPage: number = 1,
    client: Client,
    hits: Hits,
    pagination: Pagination,
    searchInputId: string,
    config: Config,
    statistics: Stats
  ): Promise<void> {
    const paginationEvent = document.querySelector<HTMLSelectElement>(
      `#${pagination.id}-select`
    );
    paginationEvent!.addEventListener("change", async (e) => {
      // @ts-ignore
      client.fromp = parseInt(e.target!.value);
      const query = document.querySelector<HTMLInputElement>(
        `input#${searchInputId}-input`
      )!.value;
      const line = await getCorpus(query, {
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
        selectQueryId: `${searchInputId}-select`,
      });
      await this.transformResponse(
        line,
        client,
        hits,
        pagination,
        config,
        statistics
      );
      await this.createPagination(
        // @ts-ignore
        e.target!.value,
        client,
        hits,
        pagination,
        searchInputId,
        config,
        statistics
      );
    });
    paginationEvent!.value = currentPage.toString();
  }

  private clearResults(
    hitsId: string,
    paginationId: string,
    searchInputId: string,
    statsId: string
  ): void {
    const input = document.querySelector<HTMLInputElement>(
      `input#${searchInputId}-input`
    );
    input!.addEventListener("input", async (e) => {
      // @ts-ignore
      const query = e.target!.value;
      if (query.length === 0) {
        const hits = document.querySelector<HTMLDivElement>(`#${hitsId}-init`);
        hits!.innerHTML = "";
        const pagination = document.querySelector<HTMLDivElement>(
          `#${paginationId}-init`
        );
        pagination!.innerHTML = "";
        document.querySelector<HTMLDivElement>(`#${statsId}-init`)?.remove();
        window.history.pushState({}, "", `${window.location.pathname}`);
        document.getElementById("nokse-autocomplete")?.remove();
      }
    });
  }
}
