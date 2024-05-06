import './style.css'
import { NoskeSearch } from '../index'

const search = new NoskeSearch({
  corpname: "diarium",
  viewmode: "kwic",
  attrs: "word",
  format: "json",
  structs: "doc,head,p,imprimatur",
  kwicrightctx: "100#",
  kwicleftctx: "100#",
  refs: "doc.id,p.id,head.id,imprimatur.id",
  pagesize: 20,
  fromp: 1,
});

search.search();