import { ChatOpenAI } from "@langchain/openai";
import { SYSTEM_PROMPT } from "./prompts.js";

export async function answerQuestion(vectorStore, question, history = []) {
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.3
  });

  const retriever = vectorStore.asRetriever({
    k: 4
  });

  const docs = await retriever.getRelevantDocuments(question);

  const context = docs.map(d => d.pageContent).join("\n\n");

  const response = await model.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    {
      role: "user",
      content: `
Website content:
${context}

Question:
${question}
`
    }
  ]);

  return response.content;
}
