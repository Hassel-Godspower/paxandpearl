export function buildChatHistory(messages = []) {
  return messages.slice(-6).map(m => ({
    role: m.role,
    content: m.content
  }));
}

export function chunkText(text, size = 400) {
  const words = text.split(" ");
  const chunks = [];

  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }

  return chunks;
}
