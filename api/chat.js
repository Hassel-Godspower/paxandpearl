import { answerQuestion } from "./qa.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!global.vectorStore) {
    return res.status(400).json({
      error: "Website not indexed yet"
    });
  }

  const { message } = req.body;

  try {
    const answer = await answerQuestion(
      global.vectorStore,
      message
    );

    res.status(200).json({ answer });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "AI failed to answer"
    });
  }
}
