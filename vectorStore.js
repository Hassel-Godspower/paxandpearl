// vectorStore.js
import { Chroma } from "langchain/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";

export async function storeVectors(chunks) {
  const vectorStore = await Chroma.fromTexts(
    chunks,
    {},
    new OpenAIEmbeddings()
  );
  return vectorStore;
}
