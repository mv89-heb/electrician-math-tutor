import { describe, expect, it } from "vitest";
import { lessonForUnit } from "./subject-lessons";
import { subjectCatalog } from "./subject-catalog";
import { emptySubjectProgress, parseSubjectProgress, setUnitCompleted } from "./subject-progress";

describe("subject lessons", () => {
  it("provides a lesson entry for every catalog unit", () => {
    for (const subject of subjectCatalog) {
      for (const unit of subject.units) {
        const lesson = lessonForUnit(subject.id, unit.id);
        expect(lesson).toBeDefined();
        expect(lesson?.title.length).toBeGreaterThan(0);
        expect(lesson?.choices.length).toBeGreaterThanOrEqual(2);
        expect(lesson?.correctChoice).toBeGreaterThanOrEqual(0);
        expect(lesson?.correctChoice).toBeLessThan(lesson?.choices.length ?? 0);
      }
    }
  });

  it("provides authored, non-placeholder lessons for the expanded foundations", () => {
    const authoredKeys = [
      ["mathematics", "arithmetic-units"],
      ["mathematics", "algebra-equations"],
      ["mathematics", "powers-roots"],
      ["mathematics", "percent-ratio"],
      ["mathematics", "graphs-geometry"],
      ["mathematics", "trigonometry"],
      ["physics", "physical-measurement"],
      ["physics", "matter-charge"],
      ["physics", "energy-power"],
      ["physics", "magnetism-induction"],
      ["technical-english", "technical-vocabulary"],
      ["technical-english", "datasheets"],
      ["electrical-theory", "three-phase"],
      ["industrial-electronics", "passive-components"],
      ["industrial-electronics", "semiconductors"],
      ["industrial-electronics", "power-conversion"],
      ["electrical-machines", "generators"],
      ["electrical-machines", "machine-protection"],
    ] as const;

    for (const [subjectId, unitId] of authoredKeys) {
      const lesson = lessonForUnit(subjectId, unitId);
      expect(lesson?.title).toBeTruthy();
      expect(lesson?.title.startsWith("מבוא:")).toBe(false);
      expect(lesson?.explanation.length ?? 0).toBeGreaterThan(100);
      expect(lesson?.example.length ?? 0).toBeGreaterThan(20);
      expect(lesson?.checkQuestion.length ?? 0).toBeGreaterThan(10);
      expect(lesson?.choices.length).toBe(3);
    }
  });

  it("provides authored, safety-aware lessons for installation, control, lab, and reporting units", () => {
    const authoredKeys = [
      ["electrical-installations", "installation-structure"],
      ["electrical-installations", "loads-circuits"],
      ["electrical-installations", "inspection-maintenance"],
      ["installation-design", "plans-symbols"],
      ["installation-design", "load-schedule"],
      ["installation-design", "design-calculations"],
      ["installation-design", "design-documentation"],
      ["practical-electrical-work", "tools-components"],
      ["practical-electrical-work", "safe-wiring-lab"],
      ["practical-electrical-work", "fault-scenarios"],
      ["control-switching", "control-components"],
      ["control-switching", "control-diagrams"],
      ["plc", "plc-architecture"],
      ["plc", "plc-functions"],
      ["plc", "plc-simulation"],
      ["electrical-measurements", "measurement-tools"],
      ["electrical-measurements", "measurement-circuits"],
      ["technical-reporting", "technical-records"],
      ["technical-reporting", "technical-reports"],
      ["safety", "safe-work-principles"],
      ["safety", "lab-safety"],
    ] as const;

    for (const [subjectId, unitId] of authoredKeys) {
      const lesson = lessonForUnit(subjectId, unitId);
      expect(lesson?.title).toBeTruthy();
      expect(lesson?.title.startsWith("מבוא:")).toBe(false);
      expect(lesson?.explanation.length ?? 0).toBeGreaterThan(100);
      expect(lesson?.example.length ?? 0).toBeGreaterThan(20);
      expect(lesson?.checkQuestion.length ?? 0).toBeGreaterThan(10);
      expect(lesson?.choices.length).toBe(3);
    }
    expect(lessonForUnit("practical-electrical-work", "safe-wiring-lab")?.safetyNote).toBeTruthy();
    expect(lessonForUnit("safety", "lab-safety")?.safetyNote).toBeTruthy();
  });

  it("requires substantive authored content for every catalog unit", () => {
    for (const subject of subjectCatalog) {
      for (const unit of subject.units) {
        const lesson = lessonForUnit(subject.id, unit.id);
        expect(lesson?.title.startsWith("מבוא:")).toBe(false);
        expect(lesson?.explanation.length ?? 0).toBeGreaterThan(100);
        expect(lesson?.example.length ?? 0).toBeGreaterThan(20);
        expect(lesson?.checkQuestion.length ?? 0).toBeGreaterThan(10);
      }
    }
  });

  it("keeps explicit authored lesson coverage for major professional topics", () => {
    expect(lessonForUnit("electrical-theory", "electrical-quantities")?.mathWalkthrough?.length ?? 0).toBeGreaterThan(0);
    expect(lessonForUnit("plc", "plc-logic")?.title).toContain("לוגיקה");
    expect(lessonForUnit("safety", "electrical-hazards")?.safetyNote).toBeTruthy();
  });
});

describe("subject progress", () => {
  it("loads empty and malformed storage safely", () => {
    expect(parseSubjectProgress(null)).toEqual(emptySubjectProgress);
    expect(parseSubjectProgress("{broken")).toEqual(emptySubjectProgress);
  });

  it("deduplicates saved unit ids", () => {
    expect(parseSubjectProgress(JSON.stringify({ version: 1, completedUnitIds: ["a", "a"], updatedAt: 1 })).completedUnitIds).toEqual(["a"]);
  });

  it("adds and removes completed units without changing the math curriculum state", () => {
    const completed = setUnitCompleted(emptySubjectProgress, "theory:ohm", true, 100);
    expect(completed.completedUnitIds).toEqual(["theory:ohm"]);
    expect(setUnitCompleted(completed, "theory:ohm", false, 200).completedUnitIds).toEqual([]);
  });
});
