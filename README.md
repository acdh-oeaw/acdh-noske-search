# ACDH Noske Search UI

This is a simple search UI for the ACDH Noske project. The search client is build with [Hey-Api](https://heyapi.vercel.app/openapi-ts/get-started.html) OpenAPI client generator and using [acdh-oeaw/noske-ubi9@yaml](https://raw.githubusercontent.com/acdh-oeaw/noske-ubi9/main/openapi/openapi.yaml).

## Installation

```bash
npm i acdh-noske-search
```

You can also include the Package via CDN:

```html
<script type="module">
  import { NoskeSearch } from "https://cdn.jsdelivr.net/npm/acdh-noske-search@0.0.7/dist/index.js";
  const search = new NoskeSearch({container: "noske-search"});

  search.stats({...});
</script>
```

## Usage

```typescript
import { NoskeSearch } from 'acdh-noske-search';
const search = new NoskeSearch({container: "noske-search"}: Options);

search.search({
  client: {
    base: "https://<your-api-endpoint>",
    corpname: "your coprus name",
    attrs: "word,id",
    structs: "doc,docTitle,head,p,imprimatur,list",
    refs: "doc.id,doc.corpus,docTitle.id,p.id,head.id,imprimatur.id,list.id",
  },
  hits: {
    id: "hitsbox",
    css: {
      table: "table-auto",
    }
  },
  pagination: {
    id: "noske-pagination",
  },
  searchInput: {
    id: "noske-input",
  },
  stats: {
    id: "noske-stats",
  },
}: Search);
```

Add the following HTML to your page:

- the `noske-search` div is the container for the search interface. The Container ID is passed to the `NoskeSearch` constructor and defaults to `noske-search`.
- the `hitsbox` div is the container for the search results. The Container ID is passed to the `search` method. The ID is required and has not default value.
- the `noske-pagination` div is the container for the pagination. The Container ID is passed to the `search` method. The ID is required and has not default value.
- the `noske-stats` div is the container for the search statistics. The Container ID is passed to the `search` method. The ID is required and has not default value.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>NoSke Search Interface</title>
  </head>
  <body>
    <div id="noske-search"></div>
    <div id="hitsbox"></div>
    <div>
      <div id="noske-pagination-test"></div>
      <div id="noske-stats"></div>
    </div>
  </body>
</html>
```

## Types

The `NoskeSearch` class is a generic class and can be used with custom types. The following types are available: `/dist/index.d.ts`

```typescript
type Options = {
  container?: string;
};
type Search = {
  client: Client;
  hits: Hits;
  pagination: Pagination;
  searchInput: SearchInput;
  stats: Stats;
  config: Config;
};
type Config = {
  results?: string;
  customUrl?: string;
  urlparam?: string | boolean;
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
  css?: {
    div?: string;
    select?: string;
    input?: string;
  };
};
type Pagination = {
  id: string;
  css?: {
    div?: string;
    select?: string;
  };
};
type Hits = {
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
```
