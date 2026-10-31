export type OhmsLawResult = {
  voltage: number;
  resistance: number;
  current: number;
  power: number;
};

export function calculateOhmsLaw(voltage: number, resistance: number): OhmsLawResult {
  if (!Number.isFinite(voltage) || voltage < 0) throw new RangeError("המתח חייב להיות מספר חיובי או אפס");
  if (!Number.isFinite(resistance) || resistance <= 0) throw new RangeError("ההתנגדות חייבת להיות גדולה מאפס");
  const current = voltage / resistance;
  return { voltage, resistance, current, power: voltage * current };
}

export type DcCircuitResult = {
  equivalentResistance: number;
  totalCurrent: number;
  branchCurrents: [number, number];
  totalPower: number;
};

export function calculateTwoResistorCircuit(
  voltage: number,
  resistance1: number,
  resistance2: number,
  mode: "series" | "parallel",
): DcCircuitResult {
  if (!Number.isFinite(voltage) || voltage < 0) throw new RangeError("המתח חייב להיות מספר חיובי או אפס");
  if (![resistance1, resistance2].every((value) => Number.isFinite(value) && value > 0)) {
    throw new RangeError("כל התנגדות חייבת להיות גדולה מאפס");
  }

  const equivalentResistance = mode === "series"
    ? resistance1 + resistance2
    : (resistance1 * resistance2) / (resistance1 + resistance2);
  const totalCurrent = voltage / equivalentResistance;
  const branchCurrents: [number, number] = mode === "series"
    ? [totalCurrent, totalCurrent]
    : [voltage / resistance1, voltage / resistance2];

  return {
    equivalentResistance,
    totalCurrent,
    branchCurrents,
    totalPower: voltage * totalCurrent,
  };
}
