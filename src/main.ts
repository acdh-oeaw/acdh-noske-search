import "./style.css";
import "../dist/index.d.ts";
import { NoskeSearch } from "../index";
import { loadContent } from "./lib.ts";

function checkRefs(
  refs: Array<string>,
  doc: boolean = false
): Array<string> | null {
  if (doc) {
    for (let ref of refs) {
      if (ref.startsWith("doc.id")) {
        return [ref.split("=")[1]];
      }
    }
  } else {
    var refIds = [];
    for (let ref of refs) {
      if (
        ref === "" ||
        ref === undefined ||
        ref === null ||
        ref.startsWith("doc")
      ) {
        continue;
      } else {
        refIds.push(ref);
      }
    }
    return refIds;
  }
  return null;
}

const search = new NoskeSearch({
  container: "noske-search",
  autocomplete: true,
  wordlistattr: ["word", "lemma", "pos", "id", "placeName", "persName", "pbId"],
});

search.minQueryLength = 2;

search.search({
  debug: true,
  client: {
    base: "https://abacus-noske.acdh-dev.oeaw.ac.at",
    corpname: "abacus",
    attrs: "word,lemma,pos,id,placeName,persName,pbId",
    structs: "doc",
    refs: "doc.id,doc.title",
  },
  hits: {
    id: "hitsbox-test",
    css: {
      div: "grid grid-cols-5 gap-4",
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
    tableView: false,
    // customUrl: "https://abacus.acdh-ch-dev.oeaw.ac.at/edition/",
    // urlparam: { img: "on" },
    customUrlTransform: (lines) => {
      let kwic_attr = lines.kwic_attr?.split("/")[1];
      let pageId = lines.kwic_attr?.split("/")[6];
      // let refs = lines.refs;
      // let docID = refs[0].split("=")[1];
      let url = new URL(
        "https://abacus.acdh-ch-dev.oeaw.ac.at/edition/" + pageId
      );
      url.hash = kwic_attr!;
      url.searchParams.set("img", "on");
      url.searchParams.set("place", "on");
      return url;
    },
    // customSynopticView: (resultLineId) => {
    //   console.log(resultLineId);
    //   // const synopticView = document.getElementById("noske-synoptic-view");
    //   Object.entries(resultLineId).forEach(([key, value]) => {
    //     document.getElementById(key)?.addEventListener("click", () => {
    //       let id = key.split("__")[1];
    //       let hash = key.split("__")[2];
    //       loadContent(id, "noske-synoptic-view", hash);
    //     });
    //   });
    // },
    // customResponseHtml: (lines, containerId, hits, client_attr) => {
    //   console.log(lines, containerId, hits, client_attr);
    //   const hitsContainer = document.querySelector<HTMLDivElement>(
    //     `#${containerId}`
    //   );
    //   const results = lines
    //     .map((line) => {
    //       let left = line.left;
    //       let right = line.right;
    //       let kwic = line.kwic;
    //       let kwic_attr = line.kwic_attr?.split("/");
    //       let refs = line.refs;
    //       let docId = checkRefs(refs, true);
    //       let refsNorm = checkRefs(refs, false);
    //       var id: string | boolean = false;
    //       let hashId = refsNorm!
    //         .filter((ref) => !ref.startsWith("doc") && ref.length > 0)
    //         .map((ref) => `#${ref.split("=")[1]}`)
    //         .join("");
    //       if (client_attr) {
    //         var id_idx = client_attr.indexOf("id");
    //         id = kwic_attr![id_idx];
    //       }
    //       if (!id) {
    //         console.log("id attribute is not present in the client attributes");
    //         id = "";
    //       }
    //       var url = new URL(window.location.origin + "/" + docId);
    //       if (id) {
    //         url.hash = id;
    //       } else {
    //         url.hash = hashId;
    //       }
    //       return `
    //       <div class="p-4 border rounded-md">
    //       <a href="${url}">
    //         <span>${left}</span><span class="text-red-500">${kwic}</span><span>${right}</span>
    //       </a>
    //       </div>
    //       `;
    //     })
    //     .join("");
    //   hitsContainer!.innerHTML = results;
    // },
  },
  stats: {
    id: "noske-stats",
  },
  autocompleteOptions: {
    id: "noske-autocomplete",
    css: {
      div: "bg-white border border-gray-300 absolute ml-10 mt-10 text-left min-w-[250px] min-h-[50px]",
      ul: "p-0",
      li: "p-2 cursor-pointer",
      loader:
        "m-2 border-4 border-gray-300 border-t-4 border-t-black rounded-full relative text-center w-[40px] h-[40px]",
    },
  },
});

const wordList = await search.getWordsList({
  corpname: "abacus",
  wlattr: "lemma",
  wlmaxitems: 50,
  // wlpat: `a.*`,
  wltype: "simple",
  includeNonwords: 0,
  wlicase: 1,
  wlminfreq: 1,
  wlsort: "frq",
});

Object.entries(wordList).forEach(([key, value]) => {
  console.log(key, value);
});

console.log(wordList);
