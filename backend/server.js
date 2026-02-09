import express from "express";
import cors from "cors";
import { scrapeWebsite } from "./scraper.js";
import { chunkText } from "./chunker.js";
import { storeVectors } from "./vectorStore.js";
import { answerQuestion } from "./qa.js";

const app = express();
app.use(cors());
app.use(express.json());

let vectorStore;
let chatHistory = [];

app.post("/init", async (req, res) => {
  try {
    const { url } = req.body;

    const site = await scrapeWebsite(url);
    const chunks = chunkText(site.text);

    vectorStore = await storeVectors(chunks, {
      source: site.url,
      title: site.title
    });

    chatHistory = [];

    res.json({
      status: "indexed",
      pages: chunks.length,
      title: site.title
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to index website" });
  }
});

app.post("/chat", async (req, res) => {
  if (!vectorStore) {
    return res.status(400).json({
      error: "Website not indexed yet"
    });
  }

  const { message } = req.body;

  const answer = await answerQuestion(
    vectorStore,
    message,
    chatHistory
  );

  chatHistory.push({ role: "user", content: message });
  chatHistory.push({ role: "assistant", content: answer });

  res.json({ answer });
});

app.listen(3000, () => {
  console.log("Website AI Chat running on port 3000");
});
