// chunker.js
export function chunkText(text, chunkSize = 1000) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));export function chunkText(text, maxLength = 800) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += " " + sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

    start += chunkSize;
  }

  return chunks;
}
