export type AcceptedAnswers = string[];

type ParsedQuantity = {
  number: number;
  unit: string | null;
};

function normalizeUnit(unit: string): string {
  const value = unit.trim().toLowerCase();
  if (["a", "amp", "אמפר"].includes(value)) return "a";
  if (["v", "volt", "וולט"].includes(value)) return "v";
  if (["w", "וואט"].includes(value)) return "w";
  return value;
}

function parseQuantity(value: string): ParsedQuantity | null {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/,/g, ".");

  const match = cleaned.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(a|amp|אמפר|v|volt|וולט|w|וואט)?$/i);
  if (!match) return null;

  const number = Number(match[1]);
  if (!Number.isFinite(number)) return null;

  return {
    number,
    unit: match[2] ? normalizeUnit(match[2]) : null,
  };
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

  const answerQuantity = parseQuantity(answer);
  const answerFraction = parseFraction(answer);

  return accepted.some((expected) => {
    const expectedQuantity = parseQuantity(expected);

    if (answerQuantity && expectedQuantity) {
      if (answerQuantity.unit && expectedQuantity.unit && answerQuantity.unit !== expectedQuantity.unit) return false;
      if (!expectedQuantity.unit && answerQuantity.unit) return false;
      return Math.abs(answerQuantity.number - expectedQuantity.number) < 1e-12;
    }

    const expectedFraction = parseFraction(expected);
    if (answerQuantity && expectedFraction !== null) {
      return Math.abs(answerQuantity.number - expectedFraction) < 1e-12;
    }
    if (answerFraction !== null && expectedQuantity) {
      return Math.abs(answerFraction - expectedQuantity.number) < 1e-12;
    }
    if (answerFraction !== null && expectedFraction !== null) {
      return Math.abs(answerFraction - expectedFraction) < 1e-12;
    }

    return normalizeText(answer) === normalizeText(expected);
  });
}

export function answerIsOneOf(answer: string, accepted: AcceptedAnswers): boolean {
  return answerMatches(answer, accepted);
}
