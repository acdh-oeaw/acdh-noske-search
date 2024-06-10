import './style.css'
import { NoskeSearch } from '../index';

const search = new NoskeSearch({container: "noske-search"});

search.search({
  debug: true,
  client: {
    base: "https://diarium-noske.acdh-dev.oeaw.ac.at",
    corpname: "diarium",
    attrs: "word,id",
    structs: "doc,docTitle,head,p,imprimatur,list",
    refs: "doc.id,doc.corpus,docTitle.id,p.id,head.id,imprimatur.id,list.id",
  },
  hits: {
    id: "hitsbox-test",
    css: {
      table: "table-auto",
    }
  },
  pagination: {
    id: "noske-pagination-test",
  },
  searchInput: {
    id: "noske-input",
    // placeholder: "Suche nach Wörter, Phrase oder CQL-Query (Regex erlaubt)",
    // css: {
    //   div: "p-2",
    //   input: "p-2 border border-gray-500",
    //   select: "p-2 border border-gray-500",
    // }
  },
  config:{
    customUrl: "https://wiener-diarium.github.io/curved-conjunction/edition",
    urlparam: "&img=on",
  },
  stats: {
    id: "noske-stats",
  },
});
