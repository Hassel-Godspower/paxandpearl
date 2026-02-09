import { Chroma } from "langchain/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";

export async function storeVectors(chunks, metadata) {
  return await Chroma.fromTexts(
    chunks,
    chunks.map(() => metadata),
    new OpenAIEmbeddings({
      model: "text-embedding-3-large"
    })
  );
}
