// embeddings.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function createEmbeddings(chunks) {
  return Promise.all(
    chunks.map(chunk =>
      openai.embeddings.create({
        model: "text-embedding-3-large",
        input: chunk
      })
    )
  );
}
