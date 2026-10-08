export type AcceptedAnswers = string[];

function stripUnit(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/^(?:\+)?(\d+(?:[.,]\d+)?)\s*(?:אמפר|amp|a|וולט|volt|v|וואט|w)$/i, "$1");
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/−/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/²/g, "^2")
    .replace(/[!?]+$/g, "");
}

function parseNumber(value: string): number | null {
  const cleaned = stripUnit(value).replace(",", ".");
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(cleaned)) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function parseFraction(value: string): number | null {
  const cleaned = normalizeText(value);
  const match = cleaned.match(/^(-?\d+)\/(\d+)$/);
  if (!match || Number(match[2]) === 0) return null;
  return Number(match[1]) / Number(match[2]);
}

export function normalizeAnswer(value: string): string {
  return normalizeText(value);
}

export function answerMatches(answer: string, accepted: AcceptedAnswers): boolean {
  if (!answer.trim()) return false;

  const answerNumber = parseNumber(answer);
  const answerFraction = parseFraction(answer);

  return accepted.some((expected) => {
    const expectedNumber = parseNumber(expected);
    if (answerNumber !== null && expectedNumber !== null) {
      return Object.is(answerNumber, expectedNumber) || Math.abs(answerNumber - expectedNumber) < 1e-12;
    }

    const expectedFraction = parseFraction(expected);
    if (answerFraction !== null && expectedFraction !== null) {
      return Math.abs(answerFraction - expectedFraction) < 1e-12;
    }

    return normalizeText(answer) === normalizeText(expected);
  });
}

export function answerIsOneOf(answer: string, accepted: AcceptedAnswers): boolean {
  return answerMatches(answer, accepted);
}
