import { scrapeWebsite } from "./scraper.js";
import { chunkText } from "./chunker.js";
import { storeVectors } from "./vectorStore.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;

    const site = await scrapeWebsite(url);
    const chunks = chunkText(site.text);

    const vectorStore = await storeVectors(chunks, {
      source: site.url,
      title: site.title
    });

    global.vectorStore = vectorStore;

    res.status(200).json({
      status: "indexed",
      chunks: chunks.length,
      title: site.title
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Indexing failed" });
  }
}
