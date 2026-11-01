export const PLC_INPUT_IDS = ["I0.0", "I0.1", "I0.2", "I0.3"] as const;
export const PLC_OUTPUT_IDS = ["Q0.0", "Q0.1"] as const;

export type PlcInputId = (typeof PLC_INPUT_IDS)[number];
export type PlcOutputId = (typeof PLC_OUTPUT_IDS)[number];
export type PlcOperator = "AND" | "OR" | "NOT";
export type PlcInputs = Record<PlcInputId, boolean>;

export type PlcRule = {
  operator: PlcOperator;
  inputA: PlcInputId;
  inputB: PlcInputId;
};

export type PlcTraceStep = {
  id: string;
  label: string;
  value: boolean;
};

export type PlcEvaluation = {
  output: boolean;
  trace: PlcTraceStep[];
};

export type PlcPracticeScenario = {
  id: string;
  title: string;
  instruction: string;
  outputId: PlcOutputId;
  rule: PlcRule;
  inputs: Partial<PlcInputs>;
  expectedOutput: boolean;
};

export type PlcPracticeResult = {
  passed: boolean;
  message: string;
};

export const DEFAULT_PLC_INPUTS: PlcInputs = {
  "I0.0": true,
  "I0.1": true,
  "I0.2": false,
  "I0.3": false,
};

export const PLC_PRACTICE_SCENARIOS: PlcPracticeScenario[] = [
  {
    id: "and-both-active",
    title: "AND · שתי כניסות פעילות",
    instruction: "הגדר AND בין I0.0 ל־I0.1 והשאר את שתי הכניסות פעילות. היציאה Q0.0 אמורה להיות 1.",
    outputId: "Q0.0",
    rule: { operator: "AND", inputA: "I0.0", inputB: "I0.1" },
    inputs: { "I0.0": true, "I0.1": true },
    expectedOutput: true,
  },
  {
    id: "and-one-inactive",
    title: "AND · כניסה אחת כבויה",
    instruction: "השאר את I0.0 פעילה וכבה את I0.1. תנאי AND חייב להחזיר 0.",
    outputId: "Q0.0",
    rule: { operator: "AND", inputA: "I0.0", inputB: "I0.1" },
    inputs: { "I0.0": true, "I0.1": false },
    expectedOutput: false,
  },
  {
    id: "or-one-active",
    title: "OR · לפחות כניסה אחת פעילה",
    instruction: "הגדר OR בין I0.1 ל־I0.2. השאר את I0.1 פעילה ואת I0.2 כבויה; התוצאה צריכה להיות 1.",
    outputId: "Q0.0",
    rule: { operator: "OR", inputA: "I0.1", inputB: "I0.2" },
    inputs: { "I0.1": true, "I0.2": false },
    expectedOutput: true,
  },
  {
    id: "not-inactive",
    title: "NOT · היפוך כניסה",
    instruction: "הגדר NOT עבור I0.3 והשאר אותה כבויה. היפוך של 0 צריך להחזיר 1.",
    outputId: "Q0.0",
    rule: { operator: "NOT", inputA: "I0.3", inputB: "I0.0" },
    inputs: { "I0.3": false },
    expectedOutput: true,
  },
];

export const DEFAULT_PLC_RULES: Record<PlcOutputId, PlcRule> = {
  "Q0.0": { operator: "AND", inputA: "I0.0", inputB: "I0.1" },
  "Q0.1": { operator: "NOT", inputA: "I0.2", inputB: "I0.3" },
};

function isPlcInputId(value: unknown): value is PlcInputId {
  return PLC_INPUT_IDS.some((inputId) => inputId === value);
}

function readInput(inputs: PlcInputs, inputId: unknown): boolean {
  if (!isPlcInputId(inputId)) {
    throw new RangeError("נבחרה כניסת PLC שאינה קיימת במודל");
  }
  if (!inputs || typeof inputs !== "object" || typeof inputs[inputId] !== "boolean") {
    throw new TypeError(`מצב הכניסה ${inputId} חייב להיות true או false`);
  }
  return inputs[inputId];
}

export function evaluatePlcRule(rule: PlcRule, inputs: PlcInputs): PlcEvaluation {
  if (!rule || typeof rule !== "object") {
    throw new TypeError("נדרש תנאי לוגי תקין");
  }
  if (!["AND", "OR", "NOT"].includes(rule.operator)) {
    throw new RangeError("פעולת PLC אינה נתמכת במודל");
  }

  const valueA = readInput(inputs, rule.inputA);
  const trace: PlcTraceStep[] = [
    { id: "input-a", label: `קריאת כניסה ${rule.inputA}`, value: valueA },
  ];

  let output: boolean;
  if (rule.operator === "NOT") {
    output = !valueA;
    trace.push({
      id: "logic",
      label: `NOT ${rule.inputA} — היפוך הערך`,
      value: output,
    });
  } else {
    const valueB = readInput(inputs, rule.inputB);
    trace.push({
      id: "input-b",
      label: `קריאת כניסה ${rule.inputB}`,
      value: valueB,
    });
    output = rule.operator === "AND" ? valueA && valueB : valueA || valueB;
    trace.push({
      id: "logic",
      label: `${rule.operator}: ${rule.inputA} ו־${rule.inputB}`,
      value: output,
    });
  }

  trace.push({ id: "output", label: "תוצאת היציאה הווירטואלית", value: output });
  return { output, trace };
}

function rulesAreEquivalent(candidate: PlcRule, expected: PlcRule): boolean {
  if (candidate.operator !== expected.operator) return false;
  if (candidate.operator === "NOT") return candidate.inputA === expected.inputA;
  return (
    (candidate.inputA === expected.inputA && candidate.inputB === expected.inputB) ||
    (candidate.inputA === expected.inputB && candidate.inputB === expected.inputA)
  );
}

export function checkPlcPractice(
  rule: PlcRule,
  inputs: PlcInputs,
  scenario: PlcPracticeScenario,
): PlcPracticeResult {
  if (!rulesAreEquivalent(rule, scenario.rule)) {
    return {
      passed: false,
      message: "בדוק את סוג הפעולה ואת בחירת הכניסות. הם עדיין אינם תואמים לתרחיש.",
    };
  }

  const requiredInputs = Object.entries(scenario.inputs) as [PlcInputId, boolean][];
  const inputsMatch = requiredInputs.every(([inputId, expectedValue]) => readInput(inputs, inputId) === expectedValue);
  if (!inputsMatch) {
    return {
      passed: false,
      message: "התנאי הלוגי מתאים. שנה את מצבי הכניסות לפי ההנחיה של התרחיש.",
    };
  }

  const result = evaluatePlcRule(rule, inputs);
  if (result.output !== scenario.expectedOutput) {
    return {
      passed: false,
      message: "בדוק שוב את טבלת האמת ואת תוצאת התנאי הלוגי.",
    };
  }

  return {
    passed: true,
    message: "מצוין! בנית את התנאי והגדרת את מצבי הכניסות בהתאם לתרחיש.",
  };
}
