const express = require("express");
require("dotenv").config();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const translate = require("node-google-translate-skidz");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");


const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: "uploads/" });

// API endpoint to translate PDF
app.post("/translate", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }
    const pdfBuffer = fs.readFileSync(req.file.path);
    const { text } = await pdfParse(pdfBuffer);
    const sentences = text.split(/[.!?]/);
    const translatedSentences = [];
    for (const sentence of sentences) {
      if (!sentence.trim()) continue;

      const translation = await translate(sentence, "ko", "en");
      translatedSentences.push(translation.translation);
    }``
    const translatedText = await translatedSentences.join(" ");
    // const outputPath = `translated_${req.file.originalname}`;
    // Remove the line that writes the file to disk
    // fs.writeFileSync(outputPath, translatedText, { encoding: "binary" });

    // Generate PDF
    const pdfBufferr = await generatePDF(translatedText);

    // Send the PDF buffer as a response
    res.set({
        "Content-Disposition": `attachment; filename=translated.pdf`,
        "Content-Type": "application/pdf"
    });
    res.send(pdfBufferr);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Function to generate PDF using pdfkit
async function generatePDF(text) {
  return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks = [];

      // Buffer output chunks into an array
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => {
          const resultBuffer = Buffer.concat(chunks);
          resolve(resultBuffer);
      });

      // Stream PDF to buffer
      doc.text(text);
      doc.end();

      doc.on("error", error => reject(error));
  });
}


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
