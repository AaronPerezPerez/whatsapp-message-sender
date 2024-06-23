export const codeToEmoji = {
  "[location]": "📍",
  "[calendar]": "📅",
  "[clock]": "🕒",
  "[greet]": "👋🏻",
  "[phone]": "📞",
};
export const parseEmojis = (text: string): string => {
  for (const [code, emoji] of Object.entries(codeToEmoji)) {
    text = text.replace(code, emoji);
  }
  return text;
};
