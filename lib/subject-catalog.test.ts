import { describe, expect, it } from "vitest";
import { getCategoryIdFromHash, subjectCatalog, subjectCategories } from "./subject-catalog";

describe("subject catalog", () => {
  it("contains unique subject and unit identifiers", () => {
    const subjectIds = subjectCatalog.map((subject) => subject.id);
    const unitIds = subjectCatalog.flatMap((subject) => subject.units.map((unit) => unit.id));

    expect(new Set(subjectIds).size).toBe(subjectIds.length);
    expect(new Set(unitIds).size).toBe(unitIds.length);
  });

  it("preserves the complete learning-unit set and stable identifiers", () => {
    const unitIds = subjectCatalog.flatMap((subject) => subject.units.map((unit) => `${subject.id}:${unit.id}`));
    expect(unitIds).toHaveLength(54);
    expect(unitIds).toEqual(expect.arrayContaining([
      "electrical-theory:electrical-quantities",
      "electrical-theory:dc-circuits",
      "plc:plc-architecture",
      "plc:plc-logic",
      "plc:plc-functions",
      "plc:plc-simulation",
    ]));
  });

  it("references only declared categories", () => {
    const categoryIds = new Set(subjectCategories.map((category) => category.id));
    expect(subjectCatalog.every((subject) => categoryIds.has(subject.categoryId))).toBe(true);
  });

  it("keeps core curriculum separate from supplementary topics", () => {
    expect(subjectCatalog.some((subject) => subject.id === "mathematics" && subject.status === "core")).toBe(true);
    expect(subjectCatalog.some((subject) => subject.id === "electrical-theory" && subject.status === "core")).toBe(true);
    expect(subjectCatalog.some((subject) => subject.id === "safety" && subject.status === "core")).toBe(true);
    expect(subjectCatalog.some((subject) => subject.id === "smart-home" && subject.status === "supplementary")).toBe(true);
  });

  it("provides math connections for the technical subjects", () => {
    const linkedSubjects = subjectCatalog.filter((subject) =>
      !["technical-english", "first-aid-height-work"].includes(subject.id),
    );
    expect(linkedSubjects.every((subject) =>
      subject.units.some((unit) => unit.mathConnections.length > 0),
    )).toBe(true);
  });


  it("resolves only known category anchors from lesson links", () => {
    expect(getCategoryIdFromHash("#foundations")).toBe("foundations");
    expect(getCategoryIdFromHash("#electrical-theory")).toBe("electrical-theory");
    expect(getCategoryIdFromHash("installations")).toBe("installations");
    expect(getCategoryIdFromHash("#unknown-category")).toBeUndefined();
    expect(getCategoryIdFromHash("")).toBeUndefined();
  });

  it("does not contain empty subjects or units", () => {
    expect(subjectCatalog.length).toBeGreaterThan(0);
    expect(subjectCatalog.every((subject) =>
      subject.title.trim().length > 0 &&
      subject.units.length > 0 &&
      subject.units.every((unit) => unit.title.trim().length > 0),
    )).toBe(true);
  });
});
