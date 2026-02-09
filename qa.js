// qa.js
import { ChatOpenAI } from "@langchain/openai";
import { RetrievalQAChain } from "langchain/chains";

export async function answerQuestion(vectorStore, question) {
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.2
  });

  const chain = RetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever()
  );

  const response = await chain.call({ query: question });
  return response.text;
}

