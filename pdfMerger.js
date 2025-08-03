const fs = require("fs");
const { PDFDocument } = require("pdf-lib");

async function mergePDFs() {
  // Input files (without .pdf extension)
  const fileNames = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10"];
  
  // Add .pdf suffix to each filename
  const files = fileNames.map(name => `${name}.pdf`);
  
  // Create output filename based on input files
  const outputName = `merged_${fileNames[0]}_to_${fileNames[fileNames.length - 1]}.pdf`;
  
  const pdfDocs = [];

  // Load all PDFs
  for (const file of files) {
    try {
      const bytes = fs.readFileSync(file);
      const pdf = await PDFDocument.load(bytes);
      pdfDocs.push(pdf);
    } catch (err) {
      console.error(`Error loading ${file}:`, err.message);
      throw err;
    }
  }

  const mergedPdf = await PDFDocument.create();
  
  // Process files in batches of 4
  for (let i = 0; i < pdfDocs.length; i += 4) {
    // Create one large page (A2 size = 1190 x 1684 points)
    const page = mergedPdf.addPage([1190, 1684]);
    
    // Positions for 4 PDFs: top-left, top-right, bottom-left, bottom-right
    const positions = [
      [0, 842],     // top-left
      [595, 842],   // top-right
      [0, 0],       // bottom-left
      [595, 0]      // bottom-right
    ];
    
    // Get current batch (up to 4 PDFs)
    const batch = pdfDocs.slice(i, i + 4);
    
    // Embed and place each PDF in the batch
    for (let j = 0; j < batch.length; j++) {
      try {
        const [embeddedPage] = await mergedPdf.embedPages([batch[j].getPage(0)]);
        page.drawPage(embeddedPage, {
          x: positions[j][0],
          y: positions[j][1],
          width: 595,
          height: 842
        });
      } catch (err) {
        console.error(`Error processing ${files[i + j]}:`, err.message);
        throw err;
      }
    }
  }

  // Save the merged PDF
  const pdfBytes = await mergedPdf.save();
  fs.writeFileSync(outputName, pdfBytes);
  console.log(`Merged PDF saved as ${outputName}`);
}

mergePDFs().catch(err => console.error("Error in merging PDFs:", err));