const express = require("express");
require("dotenv").config();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const translate = require("node-google-translate-skidz");
const { PDFDocument, rgb} = require("pdf-lib");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: "uploads/" });

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
    }

    const translatedText = translatedSentences.join(" ");

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    const helveticaFont = await pdfDoc.embedFont("Helvetica");

    for (const [pageIndex, page] of pages.entries()) {
      const { width, height } = page.getSize();

      // Filter out unsupported characters and replace them with a placeholder
      const filteredText = translatedText.replace(/[^\x00-\x7F]/g, "");

      // Get the height of the text
      const textHeight = helveticaFont.heightAtSize(12);

      // Calculate the position to draw the text
      const textX = 50;
      const textY = height - 50 - textHeight;

      // Draw a white background rectangle behind the text
      const backgroundWidth = width - 100;
      const backgroundHeight = textHeight + 10;
      const backgroundX = 50;
      const backgroundY = textY - textHeight;
      page.drawRectangle({
        x: backgroundX,
        y: backgroundY,
        width: backgroundWidth,
        height: backgroundHeight,
        color: rgb(1, 1, 1),
      });

      // Draw the text
      page.drawText(filteredText, {
        x: textX,
        y: textY,
        size: 12,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
    }

    const outputPath = `translated_${req.file.originalname}`;
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, modifiedPdfBytes);

    res.setHeader("Content-Type", "application/pdf");
    res.sendFile(outputPath, { root: __dirname });

    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
