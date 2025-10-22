export function loadContent(
  documentId: string,
  synopticViewId: string,
  hash: string
) {
  // choose html class for node to be removed
  console.log(documentId, synopticViewId);
  removeColumnContent(synopticViewId);

  // options for saxonTransform
  var dir = "../data/html/";

  // column one result
  transform({
    fileDir: dir,
    fileName: documentId,
    htmlID: synopticViewId,
    hash: hash,
  });
}

function transform(options: {
  fileDir: string;
  fileName: string;
  htmlID: string;
  hash: string;
}) {
  console.log(options.fileDir + options.fileName + ".html");
  fetch(options.fileDir + options.fileName + ".html")
    .then((res) => {
      console.log(res);
      return res.text();
    })
    .then((html) => {
      document.getElementById(options.htmlID)!.innerHTML = html;
      console.log(options.hash);
      document.getElementById(options.hash)!.scrollIntoView();
    });
}

function removeColumnContent(id: string) {
  var result = document.getElementById(id);
  if (result) {
    result.innerHTML = "";
  }
}
