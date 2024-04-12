const express = require("express");
require("dotenv").config();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const translate = require("node-google-translate-skidz");
const fs = require("fs");

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
    }
    const translatedText = translatedSentences.join(" ");
    const outputPath = `translated_${req.file.originalname}`;
    fs.writeFileSync(outputPath, translatedText, { encoding: "binary" });
    res.json({ message: `Translated PDF saved as ${outputPath}` });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});