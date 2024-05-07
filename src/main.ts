import './style.css'
import { NoskeSearch } from '../index';

const search = new NoskeSearch({
  base: "https://diarium-noske.acdh-dev.oeaw.ac.at",
  corpname: "diarium",
  viewmode: "kwic",
  attrs: "word,id",
  format: "json",
  structs: "doc,head,p,imprimatur",
  kwicrightctx: "100#",
  kwicleftctx: "100#",
  refs: "doc.id,p.id,head.id,imprimatur.id",
  pagesize: 20,
  fromp: 1,
  results: "Suche nach Wörtern, Phrase oder CQL-Query (Regex erlaubt)",
});

search.search();