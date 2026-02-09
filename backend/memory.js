export function buildChatHistory(messages = []) {
  return messages.slice(-6).map(m => ({
    role: m.role,
    content: m.content
  }));
}

