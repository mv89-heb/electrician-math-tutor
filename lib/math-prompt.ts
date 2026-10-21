export type MathPromptPart = { type: "text" | "math"; value: string };

/**
 * Splits Hebrew exercise instructions from mathematical expressions so the UI
 * can render Hebrew RTL and numbers/formulas LTR without bidirectional mixing.
 */
export function splitMathPrompt(prompt: string): MathPromptPart[] {
  const normalizedPrompt = prompt.replace(/\\n/g, "\n").trim();
  const atom = String.raw\`(?:[A-Za-z]\\w*|\\d+(?:[.,]\\d+)?(?:\\s*(?:V|A|W|Hz|Ω|%))?|π)\`;
  const expressionPattern = new RegExp(
    \`\${atom}(?:\\\\s*(?:=|\\\\+|[-−]|×|÷|\\\\*|\\\\/|≤|≥|≈)\\\\s*\${atom})+|\\\\d+[.,]\\\\d+(?:\\\\s*(?:V|A|W|Hz|Ω|%))?|\\\\d+(?:V|A|W|Hz|Ω|%)|\\\\d+[²³]\`,
    "g",
  );
  const parts: MathPromptPart[] = [];
  let lastIndex = 0;

  for (const match of normalizedPrompt.matchAll(expressionPattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push({ type: "text", value: normalizedPrompt.slice(lastIndex, index) });
    parts.push({ type: "math", value: match[0].trim() });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < normalizedPrompt.length) parts.push({ type: "text", value: normalizedPrompt.slice(lastIndex) });
  return parts;
}
