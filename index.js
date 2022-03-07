import { jsPDF } from "https://cdn.skypack.dev/jspdf@2.5.1";

// the random data generation is done in a worker so the browser does not freeze
const dataWorker = new Worker(new URL("./worker.js", import.meta.url));

const doc = new jsPDF({
  format: "a0",
  unit: "px",
  hotfixes: ["px_scaling"],
});

// Page dimensions are in pixels
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();

// desired DPI / pixels per inch
const DPI = 300;
const PIXELS_PER_INCH = 96;
const scale = DPI / PIXELS_PER_INCH;

// dimensions of generated imageData
// in manager this will be MapView dimensions
const viewWidth = 1024;
const viewHeight = 1024;

// how many tiles are required to cover page at requested DPI
// Use floor for this demo so we do not have to crop any tiles and we are sure that the process is working
const tilesX = Math.floor((pageWidth * scale) / viewWidth);
const tilesY = Math.floor((pageHeight * scale) / viewHeight);

// This should be the size of each tile on the PDF
const tileWidth = viewWidth / scale;
const tileHeight = viewHeight / scale;

let eventsHandled = 0;

async function getImageData(width, height) {
  return new Promise((resolve) => {
    // redefine the event handler for each tile so we do not have excessive callbacks
    dataWorker.onmessage = (event) => {
      eventsHandled += 1;
      resolve(new ImageData(event.data, width));
    };

    dataWorker.postMessage([width, height]);
  });
}

for (let y = 0; y < tilesY; y += 1) {
  for (let x = 0; x < tilesX; x += 1) {
    const imageData = await getImageData(viewWidth, viewHeight);

    // Calculate where on the PDF page this tile goes
    const xOffset = x * tileWidth;
    const yOffset = y * tileHeight;

    // add the tile to the document
    doc.addImage(imageData, xOffset, yOffset, tileWidth, tileHeight);

    // Log progress toward generating all tiles.
    console.log(y * tilesX + (x + 1), tilesX * tilesY);
  }
}

// This should be the same as the tile count
console.log("Events handled", eventsHandled);

// Some numbers for verification
console.log({
  pageWidth,
  pageHeight,
  viewWidth,
  viewHeight,
  tileWidth,
  tileHeight,
  DPI,
});

// kill the worker... just because
dataWorker.terminate();

// Preview the PDF
const url = doc.output("bloburl");
document.querySelector("object").setAttribute("data", url);
