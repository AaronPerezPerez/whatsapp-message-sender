export const codeToEmoji = {
  "[location]": "📍",
  "[calendar]": "📅",
  "[clock]": "🕒",
  "[greet]": "👋🏻",
  "[phone]": "📞",
};
export const parseEmojis = (text: string): string => {
  for (const [code, emoji] of Object.entries(codeToEmoji)) {
    text = text.replaceAll(code, emoji);
  }
  return text;
};
