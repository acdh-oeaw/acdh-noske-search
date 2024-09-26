import "./style.css";
import "../dist/index.d.ts";
import { NoskeSearch } from "../index";

const search = new NoskeSearch({
  container: "noske-search",
  autocomplete: false,
  wordlistattr: ["word", "lemma", "id", "persName", "placeName"],
});

search.minQueryLength = 2;

search.search({
  debug: true,
  client: {
    base: "https://abacus-noske.acdh-dev.oeaw.ac.at",
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
  config: {
    // customUrl: "https://abacus.acdh-ch-dev.oeaw.ac.at/edition",
    // urlparam: { img: "on" },
    customUrlTransform: (lines) => {
      // let left = lines.left;
      // let right = lines.right;
      // let kwic = lines.kwic;
      let kwic_attr = lines.kwic_attr?.split("/")[1];
      let refs = lines.refs;
      let docID = refs[0].split("=")[1];
      let url = new URL(
        "https://abacus.acdh-ch-dev.oeaw.ac.at/edition" + docID
      );
      url.hash = kwic_attr!;
      url.searchParams.set("img", "on");
      url.searchParams.set("place", "on");
      return url;
    },
  },
  stats: {
    id: "noske-stats",
  },
});
