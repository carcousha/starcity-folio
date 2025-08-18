// WhatsApp library utilities
export const extractPlaceholders = (text: string): string[] => {
  const regex = /\{([^}]+)\}/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return matches;
};

export const whatsappLib = {
  extractPlaceholders
};