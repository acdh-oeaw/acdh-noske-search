import "./style.css";
import { NoskeSearch } from "../index";

const search = new NoskeSearch({
  container: "noske-search",
  autocomplete: true,
  wordlistattr: ["word", "lemma", "id", "persName", "placeName"],
});

search.minQueryLength = 2;

search.search({
  debug: true,
  client: {
    base: "http://localhost:8080",
    corpname: "abacus",
    attrs: "word,id,title",
    structs: "doc",
    refs: "doc.id,doc.title",
  },
  hits: {
    id: "hitsbox-test",
    css: {
      table: "table-auto",
    },
  },
  pagination: {
    id: "noske-pagination-test",
  },
  searchInput: {
    id: "noske-input",
    placeholder: "Suche nach Wörter, Phrase oder CQL-Query (Regex erlaubt)",
    button: "Suchen",
    css: {
      div: "p-2",
      input: "p-2 border border-gray-500",
      select: "p-2 border border-gray-500",
      button: "p-2 border border-gray-500",
    },
  },
  // config: {
  //   customUrl: "https://wiener-diarium.github.io/curved-conjunction/edition",
  //   urlparam: "&img=on",
  // },
  stats: {
    id: "noske-stats",
  },
});
