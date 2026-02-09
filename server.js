// server.js
import express from "express";
import { scrapeWebsite } from "./scraper.js";
import { chunkText } from "./chunker.js";
import { storeVectors } from "./vectorStore.js";
import { answerQuestion } from "./qa.js";

const app = express();
app.use(express.json());

let vectorStore;

app.post("/init", async (req, res) => {
  const { url } = req.body;

  const text = await scrapeWebsite(url);
  const chunks = chunkText(text);
  vectorStore = await storeVectors(chunks);

  res.json({ status: "Website indexed successfully" });
});

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!vectorStore) {
    return res.status(400).json({ error: "Website not indexed yet" });
  }

  const answer = await answerQuestion(vectorStore, message);
  res.json({ answer });
});

app.listen(3000, () => {
  console.log("AI Website Chat running on port 3000");
});
