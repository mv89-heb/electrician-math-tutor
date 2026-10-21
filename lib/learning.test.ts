import { describe, expect, it } from "vitest";
import { curriculum } from "./curriculum";
import { checkpointPasses } from "./checkpoints";
import { generateExercise, generateReinforcement } from "./exercise-generator";
import { buildTopicMasteryTest } from "./mastery";
import { fractionGuidanceForExercise } from "./fraction-guidance";
import { formulaSubjectGuidance } from "./formula-subject-guidance";
import { geometryGuidanceForExercise } from "./geometry-guidance";
import { buildFinalExam, finalExamPasses } from "./final-exam";
import { stageGateSatisfied } from "./stages";
import { chooseNextExercise, emptyLearningState, recordAttempt, topicMastery, dueReviewIds, classifyError, resolveExercise, canStartMasteryTest } from "./learning";
import { areaLabDefaultsForExercise, areaLabUnitsForExercise, decimalVisualForExercise, electricalLabDefaultsForExercise, electricalMiniSimulatorConfigForExercise, equationLabModelForExercise, fractionLabDefaultsForExercise, fractionVisualForExercise, formulaVisualForExercise, isElectricalLesson, isElectricalPowerLesson, isExponentLesson, percentageVisualForExercise, reduceFractionForLab, unitConversionVisualForExercise } from "./lesson-visual";

describe("active exercise resolution", () => {
  it("keeps a resolved exercise as a stable snapshot after learning state changes", () => {
    const initial = { ...emptyLearningState, currentIndex: 0 };
    const active = resolveExercise(curriculum, initial, 0);
    const updated = recordAttempt(initial, curriculum[0], true, false);
    expect(active.id).toBe("zero-1");
    expect(resolveExercise(curriculum, updated, 0).id).toBe("zero-1");
    expect(active.prompt).toBe(curriculum[0].prompt);
  });

  it("resolves the new exercise only when navigation changes the index", () => {
    const state = { ...emptyLearningState, currentIndex: 0 };
    const current = resolveExercise(curriculum, state, 0);
    const next = resolveExercise(curriculum, { ...state, currentIndex: 1 }, 1);
    expect(current.id).toBe("zero-1");
    expect(next.id).toBe("zero-2");
  });
});



describe("learning engine", () => {
  it("records correct answers and prevents duplicate completion", () => {
    const first = recordAttempt(emptyLearningState, curriculum[0], true, false);
    const second = recordAttempt(first, curriculum[0], true, true);

    expect(second.version).toBe(7);
    expect(second.completed).toEqual([curriculum[0].id]);
    expect(second.stats[curriculum[0].topic].correct).toBe(2);
    expect(second.stats[curriculum[0].topic].hints).toBe(1);
    expect(second.stats[curriculum[0].topic].unassistedCorrect).toBe(1);
  });

  it("does not count generated reinforcement as curriculum completion", () => {
    const generated = {
      ...curriculum[0],
      id: "generated-מהו נעלם?-7",
    };
    const state = recordAttempt(emptyLearningState, generated, true, false);

    expect(state.completed).toEqual([]);
    expect(state.stats[generated.topic].correct).toBe(1);
  });

  it("moves on after one independent correct answer", async () => {
    const { topicMasteryGate } = await import("./learning");
    const state = recordAttempt(emptyLearningState, curriculum[0], true, false);
    expect(topicMasteryGate(state.stats[curriculum[0].topic])).toBe(true);
  });

  it("does not count a hinted correct answer as unassisted mastery", () => {
    const state = recordAttempt(emptyLearningState, curriculum[0], true, true);
    expect(state.stats[curriculum[0].topic].correct).toBe(1);
    expect(state.stats[curriculum[0].topic].unassistedCorrect).toBe(0);
  });

  it("records mistakes and gives zero mastery after a first failed attempt", () => {
    const failed = recordAttempt(emptyLearningState, curriculum[0], false, true);
    expect(failed.mistakes).toContain(curriculum[0].id);
    expect(topicMastery(failed.stats[curriculum[0].topic])).toBe(0);
  });

  it("continues with the first unfinished lesson when there is no weak topic", () => {
    let state = emptyLearningState;
    state = recordAttempt(state, curriculum[0], true, false);

    expect(chooseNextExercise(curriculum, state)).toBe(1);
  });

  it("keeps the student in the current topic until the mastery gate is passed", () => {
    let state = emptyLearningState;
    state = recordAttempt(state, curriculum[0], true, false);
    expect(chooseNextExercise(curriculum, state)).toBe(1);
    state = { ...state, currentIndex: 0 };
    state = recordAttempt(state, curriculum[0], true, false);
    state = { ...state, currentIndex: 0 };
    state = recordAttempt(state, curriculum[0], true, false);
    expect(chooseNextExercise(curriculum, state)).toBe(1);
  });

  it("does not let a wrong answer unlock the next topic", () => {
    let state = emptyLearningState;
    state = recordAttempt(state, curriculum[0], false, false, "arithmetic", "9");
    expect(chooseNextExercise(curriculum, state)).toBe(0);
  });
  it("schedules spaced review after correct answers and quick review after mistakes", async () => {
    const { scheduleReview } = await import("./learning");
    const first = scheduleReview(undefined, true, false);
    expect(first.intervalDays).toBe(1);
    expect(first.repetitions).toBe(1);
    const failed = scheduleReview(first, false, false);
    expect(failed.intervalDays).toBe(0);
    expect(failed.dueAt).toBeLessThan(Date.now() + 11 * 60 * 1000);
    const state = recordAttempt(emptyLearningState, curriculum[0], true, false);
    expect(dueReviewIds(state, Date.now())).toEqual([]);
  });

});


describe("diagnostic placement", () => {
  it("starts at the relevant foundation when a diagnostic skill is weak", async () => {
    const { recommendedStartingIndex } = await import("./learning");
    const index = recommendedStartingIndex([
      { skill: "חילוק", correct: false },
      { skill: "חילוק", correct: false },
      { skill: "חיבור", correct: true },
    ], curriculum);
    expect(curriculum[index].topic).toBe("חילוק במשוואות");
  });

  it("keeps the absolute beginner start when the diagnostic is strong", async () => {
    const { recommendedStartingIndex } = await import("./learning");
    const results = [
      { skill: "חיבור", correct: true }, { skill: "חיסור", correct: true },
      { skill: "כפל", correct: true }, { skill: "חילוק", correct: true },
      { skill: "נעלם", correct: true }, { skill: "נוסחה", correct: true },
    ];
    expect(recommendedStartingIndex(results, curriculum)).toBe(0);
  });
});


describe("adaptive diagnostic scoring", () => {
  it("uses the latest retry rather than averaging failed first attempts", async () => {
    const { diagnosticScore } = await import("./learning");
    expect(diagnosticScore([
      { skill: "חילוק", correct: false },
      { skill: "חילוק", correct: true },
    ], "חילוק")).toBe(100);
  });
});


describe("topic mastery tests", () => {
  it("does not open a long mastery test unless the topic has repeated errors", async () => {
    const { canStartMasteryTest } = await import("./learning");
    let state = emptyLearningState;
    for (let i = 0; i < 4; i++) state = recordAttempt(state, curriculum[0], true, false);
    expect(canStartMasteryTest(curriculum[0].topic, state, curriculum)).toBe(false);
    for (let i = 0; i < 3; i++) state = recordAttempt(state, curriculum[0], false, false, "arithmetic", "9");
    expect(canStartMasteryTest(curriculum[0].topic, state, curriculum)).toBe(true);
  });

  it("requires 3 out of 3 for foundational topic mastery", async () => {
    const { masteryPasses, buildTopicMasteryTest } = await import("./mastery");
    const questions = buildTopicMasteryTest(curriculum, "חיבור וחיסור במשוואות", 1);
    expect(questions).toHaveLength(3);
    expect(masteryPasses(2)).toBe(false);
    expect(masteryPasses(3)).toBe(true);
  });

  it("stores the latest mastery test result without erasing the best score", async () => {
    const { recordMasteryTest } = await import("./learning");
    let state = recordMasteryTest(emptyLearningState, "שברים", 3);
    state = recordMasteryTest(state, "שברים", 2);
    expect(state.masteryTests["שברים"].passed).toBe(false);
    expect(state.masteryTests["שברים"].bestScore).toBe(3);
    expect(state.masteryTests["שברים"].attempts).toBe(2);
  });
});


describe("strict answer validation", () => {
  it("does not turn decimal punctuation into a different number", async () => {
    const { answerMatches } = await import("./answer-checker");
    expect(answerMatches("0.5", ["0.5"])).toBe(true);
    expect(answerMatches("05", ["0.5"])).toBe(false);
    expect(answerMatches("1.0", ["1"])).toBe(true);
    expect(answerMatches("10", ["1.0"])).toBe(false);
  });

  it("rejects unrelated units on plain numeric exercises", async () => {
    const { answerMatches } = await import("./answer-checker");
    expect(answerMatches("4", ["4"])).toBe(true);
    expect(answerMatches("4A", ["4"])).toBe(false);
    expect(answerMatches("4V", ["4"])).toBe(false);
  });

  it("accepts equivalent numeric and fraction forms only when mathematically equal", async () => {
    const { answerMatches } = await import("./answer-checker");
    expect(answerMatches("0.5", ["1/2"])).toBe(true);
    expect(answerMatches("2/4", ["1/2"])).toBe(true);
    expect(answerMatches("3/4", ["1/2"])).toBe(false);
  });

  it("keeps text answers exact after case normalization", async () => {
    const { answerMatches } = await import("./answer-checker");
    expect(answerMatches("R", ["r"])).toBe(true);
    expect(answerMatches("division", ["divide"])).toBe(false);
    expect(answerMatches("x", ["R"])).toBe(false);
  });
});


describe("generated exercise correctness", () => {
  it("keeps every generated algebra answer consistent with its prompt", async () => {
    const { generateExercise, generateReinforcement } = await import("./exercise-generator");
    const x = generateExercise("מהו נעלם?", 7)!;
    expect(x.prompt).toBe("X + 2 = 4. איזה מספר נמצא במקום X?");
    expect(x.accepted).toEqual(["2"]);

    const multiplication = generateReinforcement("כפל במשוואות", 9, "operation")!;
    expect(multiplication.prompt).toBe("5 × X = 20. איזה מספר הוא X?");
    expect(multiplication.accepted).toEqual(["4"]);

    const division = generateReinforcement("חילוק במשוואות", 9, "unknown")!;
    expect(division.prompt).toBe("X ÷ 3 = 7. איזה מספר הוא X?");
    expect(division.accepted).toEqual(["21"]);
    expect(division.hint2).toContain("7 × 3 = 21");
    expect(division.explanation).toContain("X = 7 × 3 = 21");
  });
});

describe("reinforcement topic alignment", () => {
  it("keeps arithmetic reinforcement aligned with order of operations", () => {
    const exercise = generateReinforcement("סדר פעולות", 9, "arithmetic");
    expect(exercise?.prompt).toBe("5 × 2 + 3 = ?");
    expect(exercise?.accepted).toEqual(["13"]);
    expect(exercise?.explanation).toContain("5 × 2 = 10");
    expect(exercise?.explanation).toContain("10 + 3 = 13");
  });

  it("keeps arithmetic reinforcement aligned with addition and subtraction equations", () => {
    const exercise = generateReinforcement("חיבור וחיסור במשוואות", 9, "arithmetic");
    expect(exercise?.prompt).toBe("X − 5 = 7. איזה מספר הוא X?");
    expect(exercise?.accepted).toEqual(["12"]);
    expect(exercise?.explanation).toContain("X = 7 + 5 = 12");
  });

  it("keeps sign reinforcement aligned with two-step equations", () => {
    const exercise = generateReinforcement("משוואות פשוטות", 9, "sign");
    expect(exercise?.prompt).toBe("2 × X − 2 = 6. מה הערך של X?");
    expect(exercise?.accepted).toEqual(["4"]);
    expect(exercise?.hint2).toContain("8 ÷ 2 = 4");
    expect(exercise?.explanation).toContain("X = 4");
  });

  it("keeps unknown reinforcement aligned with two-step equations", () => {
    const exercise = generateReinforcement("משוואות פשוטות", 9, "unknown");
    expect(exercise?.prompt).toBe("2 × X + 1 = 9. מה הערך של X?");
    expect(exercise?.accepted).toEqual(["4"]);
    expect(exercise?.hint2).toContain("8 ÷ 2 = 4");
    expect(exercise?.explanation).toContain("X = 4");
  });

  it("keeps arithmetic reinforcement aligned with two-step equations", () => {
    const exercise = generateReinforcement("משוואות פשוטות", 9, "arithmetic");
    expect(exercise?.prompt).toBe("2 × X + 1 = 9. מה הערך של X?");
    expect(exercise?.accepted).toEqual(["4"]);
    expect(exercise?.explanation).toContain("8 ÷ 2 = 4");
  });

  it("does not inject an unrelated operation exercise into a fractions topic", () => {
    const exercise = generateReinforcement("שברים", 9, "operation");
    expect(exercise?.topic).toBe("שברים");
    expect(exercise?.prompt).toContain("חלק אחד מתוך 4 חלקים");
    expect(exercise?.accepted).toEqual(["1/4"]);
  });

  it("uses division when reinforcing division equations", () => {
    const exercise = generateReinforcement("חילוק במשוואות", 9, "operation");
    expect(exercise?.prompt).toContain("X ÷");
    expect(exercise?.accepted).toEqual(["20"]);
  });

  it("uses multiplication when reinforcing an unknown in multiplication equations", () => {
    const exercise = generateReinforcement("כפל במשוואות", 9, "unknown");
    expect(exercise?.topic).toBe("כפל במשוואות");
    expect(exercise?.prompt).toContain("× X");
    expect(exercise?.accepted).toEqual(["4"]);
    expect(exercise?.hint1).toContain("חלק");
    expect(exercise?.explanation).toContain("20 ÷ 5 = 4");
  });

  it("keeps sign reinforcement aligned with multiplication equations", () => {
    const exercise = generateReinforcement("כפל במשוואות", 9, "sign");
    expect(exercise?.prompt).toBe("-5 × X = -20. איזה מספר הוא X?");
    expect(exercise?.accepted).toEqual(["4"]);
    expect(exercise?.explanation).toContain("(-20) ÷ (-5) = 4");
  });

  it("keeps sign reinforcement aligned with division equations", () => {
    const exercise = generateReinforcement("חילוק במשוואות", 9, "sign");
    expect(exercise?.prompt).toBe("X ÷ (-5) = -4. איזה מספר הוא X?");
    expect(exercise?.accepted).toEqual(["20"]);
    expect(exercise?.explanation).toContain("(-4) × (-5) = 20");
  });

  it("keeps arithmetic reinforcement aligned with multiplication equations", () => {
    const exercise = generateReinforcement("כפל במשוואות", 9, "arithmetic");
    expect(exercise?.prompt).toContain("× X");
    expect(exercise?.accepted).toEqual(["4"]);
    expect(exercise?.explanation).toContain("5 × 4 = 20");
  });

  it("keeps arithmetic reinforcement aligned with division equations", () => {
    const exercise = generateReinforcement("חילוק במשוואות", 9, "arithmetic");
    expect(exercise?.prompt).toContain("X ÷ 5 = 4");
    expect(exercise?.accepted).toEqual(["20"]);
    expect(exercise?.explanation).toContain("X = 4 × 5 = 20");
  });

  it("does not inject a unit exercise into a non-electrical topic", () => {
    const exercise = generateReinforcement("חזקות", 9, "unit");
    expect(exercise?.topic).toBe("חזקות");
    expect(exercise?.prompt).toContain("²");
  });
});


describe("checkpoint integrity", () => {
  it("requires at least two correct answers to pass a checkpoint", () => {
    expect(checkpointPasses(0)).toBe(false);
    expect(checkpointPasses(1)).toBe(false);
    expect(checkpointPasses(2)).toBe(true);
    expect(checkpointPasses(3)).toBe(true);
  });

  it("runs checkpoints only when a learner has made several mistakes", async () => {
    const { shouldRunCheckpoint } = await import("./checkpoints");
    expect(shouldRunCheckpoint(10, [])).toBe(false);
    expect(shouldRunCheckpoint(10, [], 2)).toBe(false);
    expect(shouldRunCheckpoint(10, [], 3)).toBe(true);
    expect(shouldRunCheckpoint(15, [], 4)).toBe(false);
  });
});

describe("learning flow integrity", () => {
  it("does not start a three-question mastery test for topics with fewer than three source exercises", () => {
    const state = { ...emptyLearningState, stats: { "נוסחאות בסיסיות": { attempts: 3, correct: 3, hints: 0, streak: 3, unassistedCorrect: 3 } } };
    expect(canStartMasteryTest("נוסחאות בסיסיות", state, curriculum)).toBe(false);
  });

  it("builds mastery tests without duplicate source questions", () => {
    const questions = buildTopicMasteryTest(curriculum, "מהו נעלם?", 0);
    expect(new Set(questions.map((question) => question.prompt)).size).toBe(questions.length);
  });
});


describe("eight-stage progression", () => {
  it("does not unlock stage 2 before stage 1 mastery is genuinely established", () => {
    let state = emptyLearningState;
    const stageOneExercises = curriculum.filter((item) =>
      ["מהו נעלם?", "חיבור וחיסור במשוואות"].includes(item.topic),
    );

    // Correct answers with hints complete the source exercises, but must not
    // establish unassisted mastery or unlock the next stage.
    for (const exercise of stageOneExercises) {
      state = recordAttempt(state, exercise, true, true);
    }
    expect(stageGateSatisfied(2, state, curriculum)).toBe(false);

    // Independent, unassisted practice establishes the required mastery.
    const topics = ["מהו נעלם?", "חיבור וחיסור במשוואות"] as const;
    // Add independent correct practice until the real gate is met; the amount
    // needed depends on how many source exercises were completed with hints.
    for (let i = 0; i < 100 && !stageGateSatisfied(2, state, curriculum); i++) {
      for (const topic of topics) {
        const topicExercise = curriculum.find((item) => item.topic === topic)!;
        state = recordAttempt(state, topicExercise, true, false);
      }
    }
    expect(stageGateSatisfied(2, state, curriculum)).toBe(true);
  });

  it("keeps stage 3 locked until stage 2 topics are complete and mastered", () => {
    expect(stageGateSatisfied(3, emptyLearningState, curriculum)).toBe(false);
  });
});


describe("stage assignment integrity", () => {
  it("assigns every curriculum topic to a real learning stage", async () => {
    const { stageForExercise } = await import("./stages");
    for (const exercise of curriculum) {
      expect(stageForExercise(exercise).number).toBeGreaterThanOrEqual(1);
      expect(stageForExercise(exercise).number).toBeLessThanOrEqual(7);
    }
  });
});


describe("final 100 exam", () => {
  it("builds twelve unique questions across the learning path", () => {
    const questions = buildFinalExam(curriculum, 0);
    expect(questions).toHaveLength(12);
    expect(new Set(questions.map((question) => question.id)).size).toBe(12);
  });

  it("requires at least 10 of 12 correct answers", () => {
    expect(finalExamPasses(9)).toBe(false);
    expect(finalExamPasses(10)).toBe(true);
    expect(finalExamPasses(12)).toBe(true);
  });

  it("persists final exam completion without allowing it to be undone", async () => {
    const { recordFinalExam, emptyLearningState } = await import("./learning");
    const passed = recordFinalExam(emptyLearningState, true);
    expect(passed.finalExamPassed).toBe(true);
    expect(recordFinalExam(passed, false).finalExamPassed).toBe(true);
  });
});


describe("expanded beginner curriculum coverage", () => {
  it("has unique exercise IDs and covers fraction reduction, geometry, units and formula rearrangement", () => {
    const idsList = curriculum.map((exercise) => exercise.id);
    expect(new Set(idsList).size).toBe(idsList.length);
    const ids = new Set(idsList);
    for (const id of [
      "fraction-reduce-1", "fraction-reduce-2", "fraction-add-same-1",
      "fraction-sub-same-1", "fraction-common-1", "fraction-multiply-1",
      "fraction-divide-1", "geometry-area-rectangle-1", "geometry-diameter-1",
      "geometry-radius-1", "geometry-area-circle-1", "formula-subject-1",
      "formula-subject-2", "units-mm-cm-1", "units-cm-m-1",
      "electrical-ohm-sub-1", "electrical-power-sub-1", "electrical-units-1"
    ]) expect(ids.has(id), `missing curriculum exercise: ${id}`).toBe(true);
  });

  it("includes geometry in the learning stage gates", async () => {
    const { learningStages } = await import("./stages");
    expect(learningStages.some((stage) => stage.topics.includes("גאומטריה ומידות"))).toBe(true);
    expect(learningStages.some((stage) => stage.topics.includes("שברים"))).toBe(true);
  });
});


describe("adaptive short learning path", () => {
  it("marks redundant examples complete after an independent correct answer", () => {
    const core = curriculum.find((exercise) => exercise.id === "zero-2")!;
    const state = recordAttempt(emptyLearningState, core, true, false);
    expect(state.completed).toContain("zero-2");
    expect(state.completed).toContain("zero-2b");
    expect(state.completed).toContain("zero-2c");
  });

  it("does not skip optional practice when the answer needed a hint", () => {
    const core = curriculum.find((exercise) => exercise.id === "zero-2")!;
    const state = recordAttempt(emptyLearningState, core, true, true);
    expect(state.completed).toEqual(["zero-2"]);
    expect(state.completed).not.toContain("zero-2b");
  });

  it("does not schedule a quick repeat after a single mistake", async () => {
    const { dueReviewIds } = await import("./learning");
    const failed = recordAttempt(emptyLearningState, curriculum[0], false, false, "arithmetic", "9");
    expect(dueReviewIds(failed, Date.now() + 60 * 60 * 1000)).toEqual([]);
  });

  it("prioritizes a coherent beginner-to-electrical sequence", () => {
    let state = recordAttempt(emptyLearningState, curriculum.find((item) => item.id === "zero-1")!, true, false);
    expect(curriculum[chooseNextExercise(curriculum, state)].id).toBe("zero-2");
    state = { ...state, currentIndex: curriculum.findIndex((item) => item.id === "zero-2") };
    state = recordAttempt(state, curriculum.find((item) => item.id === "zero-2")!, true, false);
    expect(curriculum[chooseNextExercise(curriculum, state)].id).toBe("zero-3");
  });
});


describe("persisted learning state validation", () => {
  it("normalizes malformed counters and does not treat the string false as an exam pass", async () => {
    const { loadLearningState } = await import("./learning");
    const storage = {
      getItem: () => JSON.stringify({
        ...emptyLearningState,
        version: 7,
        currentIndex: "not-a-number",
        attempts: "Infinity",
        finalExamPassed: "false",
        stats: {
          "מהו נעלם?": {
            attempts: -4,
            correct: "Infinity",
            hints: "bad",
            streak: 2.8,
            unassistedCorrect: 1,
          },
        },
      }),
      setItem: () => undefined,
    } as unknown as Storage;

    const state = loadLearningState(storage);
    expect(state.currentIndex).toBe(0);
    expect(state.attempts).toBe(0);
    expect(state.finalExamPassed).toBe(false);
    expect(state.stats["מהו נעלם?"]).toEqual({
      attempts: 0,
      correct: 0,
      hints: 0,
      streak: 2,
      unassistedCorrect: 1,
    });
  });

  it("preserves a genuine boolean exam pass and valid progress", async () => {
    const { loadLearningState } = await import("./learning");
    const storage = {
      getItem: () => JSON.stringify({
        ...emptyLearningState,
        version: 7,
        currentIndex: 4,
        attempts: 12,
        finalExamPassed: true,
      }),
      setItem: () => undefined,
    } as unknown as Storage;

    const state = loadLearningState(storage);
    expect(state.currentIndex).toBe(4);
    expect(state.attempts).toBe(12);
    expect(state.finalExamPassed).toBe(true);
  });
});


describe("generated question feedback consistency", () => {
  it("matches each generated percent prompt with its answer and explanation", () => {
    const expected = [
      ["10% מתוך 100", "10"],
      ["20% מתוך 100", "20"],
      ["10% מתוך 200", "20"],
      ["25% מתוך 200", "50"],
      ["50% מתוך 80", "40"],
    ];
    expected.forEach(([prompt, answer], seed) => {
      const exercise = generateExercise("אחוזים", seed);
      expect(exercise?.prompt).toContain(prompt);
      expect(exercise?.accepted).toContain(answer);
      expect(exercise?.explanation).toContain(answer);
    });
  });

  it("matches decimal explanations to the actual expression", () => {
    const expected = [
      ["0.5 + 0.5", "1"],
      ["0.2 + 0.3", "0.5"],
      ["1.2 + 0.3", "1.5"],
      ["2.5 - 0.5", "2"],
      ["0.8 + 0.2", "1"],
    ];
    expected.forEach(([prompt, answer], seed) => {
      const exercise = generateExercise("מספרים עשרוניים", seed);
      expect(exercise?.prompt).toContain(prompt);
      expect(exercise?.accepted).toContain(answer);
      expect(exercise?.explanation).toContain(answer);
    });
  });

  it("uses the actual divisor in generated division explanations", () => {
    for (let seed = 0; seed < 5; seed += 1) {
      const exercise = generateExercise("חילוק במשוואות", seed);
      const divisor = exercise?.prompt.split("÷")[1]?.match(/[0-9]+/)?.[0];
      expect(exercise?.explanation).toContain(exercise?.accepted[0] ?? "");
      expect(exercise?.explanation).toContain(divisor ?? "no-divisor");
    }
  });
});

describe("error guidance matches the current exercise", () => {
  it("uses the actual divisor instead of always referring to 2", async () => {
    const { errorGuidance } = await import("./error-guidance");
    const exercise = generateReinforcement("חילוק במשוואות", 9, "sign")!;
    expect(exercise.prompt).toContain("X ÷ (-5)");
    expect(errorGuidance(exercise, "19")).toContain("X מחולק ב־-5");
  });

  it("uses the actual positive divisor in a regular division equation", async () => {
    const { errorGuidance } = await import("./error-guidance");
    const exercise = generateReinforcement("חילוק במשוואות", 9, "unknown")!;
    expect(exercise.prompt).toContain("X ÷ 3");
    expect(errorGuidance(exercise, "20")).toContain("X מחולק ב־3");
  });
});

describe("lesson visuals match the learning topic", () => {
  it("shows exponent visuals for powers instead of the electrical power formula", () => {
    const exponentLessons = curriculum.filter((exercise) => exercise.topic === "חזקות");
    const electricalPowerLessons = curriculum.filter((exercise) => exercise.topic === "חשמל — הספק");
    expect(exponentLessons.length).toBeGreaterThan(0);
    expect(exponentLessons.every(isExponentLesson)).toBe(true);
    expect(electricalPowerLessons.length).toBeGreaterThan(0);
    expect(electricalPowerLessons.some(isExponentLesson)).toBe(false);
  });
});


describe("fraction visuals match their exercise", () => {
  it("uses the exact fraction operation and result for every advanced fraction lesson", () => {
    const expected: Record<string, string> = {
      "fraction-2": "1/2 + 1/2 = 1",
      "fraction-reduce-1": "4/8 = 1/2",
      "fraction-reduce-2": "6/9 = 2/3",
      "fraction-add-same-1": "2/7 + 3/7 = 5/7",
      "fraction-sub-same-1": "5/8 − 2/8 = 3/8",
      "fraction-common-1": "1/2 + 1/4 = 2/4 + 1/4 = 3/4",
      "fraction-multiply-1": "1/2 × 2/3 = 2/6 = 1/3",
      "fraction-divide-1": "1/2 ÷ 1/4 = 1/2 × 4/1 = 2",
    };
    for (const [id, label] of Object.entries(expected)) {
      const exercise = curriculum.find((item) => item.id === id)!;
      expect(fractionVisualForExercise(exercise).label).toBe(label);
    }
  });

  it("uses bars only for part-of-whole and reduction visuals", () => {
    expect(fractionVisualForExercise({ id: "fraction-1" }).kind).toBe("bar");
    expect(fractionVisualForExercise({ id: "fraction-3" }).kind).toBe("bar");
    expect(fractionVisualForExercise({ id: "fraction-sub-same-1" }).kind).toBe("equation");
  });
});


describe("formula visuals match the lesson topic", () => {
  it("uses the electrical power formula for power lessons", () => {
    for (const id of ["power-1", "power-2"]) {
      const exercise = curriculum.find((item) => item.id === id);
      expect(exercise).toBeDefined();
      expect(formulaVisualForExercise(exercise!).lhs).toBe("P");
      expect(formulaVisualForExercise(exercise!).rhs).toBe("V × I");
    }
  });

  it("uses the actual algebraic formula in formula-subject lessons", () => {
    const generic = curriculum.find((item) => item.id === "formula-subject-1")!;
    const area = curriculum.find((item) => item.id === "formula-subject-2")!;
    expect(formulaVisualForExercise(generic).lhs).toBe("C");
    expect(formulaVisualForExercise(generic).rhs).toBe("A ÷ B");
    expect(formulaVisualForExercise(area).lhs).toBe("W");
    expect(formulaVisualForExercise(area).rhs).toBe("A ÷ L");
  });

  it("shows the rearranged formula for the quantity the exercise asks to find", () => {
    for (const id of ["formula-1", "formula-2", "ohm-2"]) {
      const visual = formulaVisualForExercise(curriculum.find((item) => item.id === id)!);
      expect(visual.lhs).toBe("R");
      expect(visual.rhs).toBe("V ÷ I");
    }
    for (const id of ["formula-3", "ohm-1", "electrical-ohm-sub-1"]) {
      const visual = formulaVisualForExercise(curriculum.find((item) => item.id === id)!);
      expect(visual.lhs).toBe("I");
      expect(visual.rhs).toBe("V ÷ R");
    }
    const powerSub = formulaVisualForExercise(curriculum.find((item) => item.id === "electrical-power-sub-1")!);
    expect(powerSub.lhs).toBe("I");
    expect(powerSub.rhs).toBe("P ÷ V");
    expect(powerSub.caption).toContain("ההספק במתח");
  });
});


describe("geometry and unit visuals match the exercise", () => {
  it("shows the correct conversion expression for each length conversion lesson", () => {
    const mmToCm = curriculum.find((item) => item.id === "units-mm-cm-1")!;
    const cmToM = curriculum.find((item) => item.id === "units-cm-m-1")!;
    expect(unitConversionVisualForExercise(mmToCm).expression).toBe("35 מ״מ ÷ 10 = 3.5 ס״מ");
    expect(unitConversionVisualForExercise(cmToM).expression).toBe("250 ס״מ ÷ 100 = 2.5 מטר");
    expect(unitConversionVisualForExercise(mmToCm).caption).toContain("מחלקים ב־10");
    expect(unitConversionVisualForExercise(cmToM).caption).toContain("מחלקים ב־100");
  });

  it("uses the actual dimensions and formula for rectangle and square lessons", () => {
    const rectangle = curriculum.find((item) => item.id === "geometry-area-rectangle-1")!;
    const square = curriculum.find((item) => item.id === "geometry-area-square-1")!;
    expect(rectangle.prompt).toContain("6 ס״מ");
    expect(rectangle.prompt).toContain("3 ס״מ");
    expect(square.prompt).toContain("5 מטרים");
  });
});

describe("electrical guided formula selection", () => {
  it("prioritizes the requested current formula over the background power formula", async () => {
    const { electricalGuidedFormula } = await import("./electrical-guided-formula");
    const exercise = curriculum.find((item) => item.id === "electrical-power-sub-1")!;
    expect(electricalGuidedFormula(exercise)).toBe("I = P ÷ V");
  });

  it("selects the formula matching the requested electrical quantity", async () => {
    const { electricalGuidedFormula } = await import("./electrical-guided-formula");
    expect(electricalGuidedFormula(curriculum.find((item) => item.id === "power-1")!)).toBe("P = V × I");
    expect(electricalGuidedFormula(curriculum.find((item) => item.id === "ohm-2")!)).toBe("R = V ÷ I");
    expect(electricalGuidedFormula(curriculum.find((item) => item.id === "ohm-1")!)).toBe("I = V ÷ R");
  });
});


describe("electrical unit reinforcement matches its topic", () => {
  it("asks about watts for electrical power", () => {
    const exercise = generateReinforcement("חשמל — הספק", 0, "unit")!;
    expect(exercise.prompt).toContain("הספק");
    expect(exercise.accepted).toContain("W");
    expect(exercise.hint2).toContain("וואט");
    expect(exercise.explanation).toContain("וואט");
  });

  it("rotates through voltage, current, and resistance units for Ohm's law", () => {
    const expected = [
      { name: "מתח", symbol: "V", unit: "וולט" },
      { name: "זרם", symbol: "A", unit: "אמפר" },
      { name: "התנגדות", symbol: "Ω", unit: "אוהם" },
    ];
    expected.forEach(({ name, symbol, unit }, seed) => {
      const exercise = generateReinforcement("חשמל — חוק אוהם", seed, "unit")!;
      expect(exercise.prompt).toContain(name);
      expect(exercise.accepted).toContain(symbol);
      expect(exercise.hint2).toContain(unit);
      expect(exercise.explanation).toContain(unit);
    });
  });

  it("keeps the requested quantity, accepted unit, hint, and explanation aligned", () => {
    for (const topic of ["נוסחאות בסיסיות", "שינוי נושא נוסחה"]) {
      for (let seed = 0; seed < 4; seed += 1) {
        const exercise = generateReinforcement(topic, seed, "unit")!;
        const symbol = exercise.accepted[0];
        expect(exercise.prompt).toContain(symbol);
        expect(exercise.hint2).toContain(exercise.explanation.match(/נמדד(?:ת)? ב(.+?),/)?.[1] ?? "unmatched-unit");
      }
    }
  });
});


describe("guided method follows the correct order for two-step equations", () => {
  it("removes addition before dividing", async () => {
    const { twoStepEquationGuidance } = await import("./two-step-guidance");
    const guidance = twoStepEquationGuidance("2 × X + 1 = 7. מה הערך של X?");
    expect(guidance?.correct).toContain("לחסר 1");
    expect(guidance?.correct).toContain("לפני שמחלקים");
    expect(guidance?.options[1]).toContain("לחלק מיד");
    expect(guidance?.explanation).toContain("מחסרים 1");
    expect(guidance?.explanation).toContain("ואז מחלקים ב־2");
  });

  it("adds back the subtracted amount before dividing", async () => {
    const { twoStepEquationGuidance } = await import("./two-step-guidance");
    const guidance = twoStepEquationGuidance("3 × X − 2 = 10. מה הערך של X?");
    expect(guidance?.correct).toContain("להוסיף 2");
    expect(guidance?.correct).toContain("לפני שמחלקים");
    expect(guidance?.explanation).toContain("ואז מחלקים ב־3");
  });

  it("does not capture one-step multiplication equations", async () => {
    const { twoStepEquationGuidance } = await import("./two-step-guidance");
    expect(twoStepEquationGuidance("3 × X = 12. מה הערך של X?")).toBeNull();
  });
});


describe("interactive lab matches the lesson domain", () => {
  it("does not classify exponent lessons with power in their IDs as electrical", () => {
    const exponentLessons = curriculum.filter((exercise) => exercise.topic === "חזקות");
    expect(exponentLessons.length).toBeGreaterThan(0);
    expect(exponentLessons.every((exercise) => !isElectricalLesson(exercise))).toBe(true);
  });

  it("keeps actual electrical power and Ohm's law lessons in the electrical lab", () => {
    for (const id of ["power-1", "power-2", "electrical-power-sub-1", "ohm-1", "ohm-2"]) {
      expect(isElectricalLesson(curriculum.find((exercise) => exercise.id === id)!)).toBe(true);
    }
  });
});


describe("electrical lab matches the quantity being taught", () => {
  it("uses the power lab for electrical power lessons only", () => {
    for (const id of ["power-1", "power-2", "electrical-power-sub-1"]) {
      expect(isElectricalPowerLesson(curriculum.find((exercise) => exercise.id === id)!)).toBe(true);
    }
    for (const id of ["ohm-1", "ohm-2", "power-0", "power-1b", "power-square-4"]) {
      expect(isElectricalPowerLesson(curriculum.find((exercise) => exercise.id === id)!)).toBe(false);
    }
  });
});


describe("basic formula guided steps match the requested task", () => {
  it("identifies voltage with the correct symbol and unit", async () => {
    const { basicFormulaGuidance } = await import("./basic-formula-guidance");
    const guidance = basicFormulaGuidance("formula-1b");
    expect(guidance?.question).toContain("מתח");
    expect(guidance?.correct).toBe("V — מתח");
    expect(guidance?.options).toContain("I — זרם");
    expect(guidance?.explanation).toContain("וולט");
  });

  it("asks for resistance when voltage and current are known", async () => {
    const { basicFormulaGuidance } = await import("./basic-formula-guidance");
    const guidance = basicFormulaGuidance("formula-1");
    expect(guidance?.question).toContain("התנגדות");
    expect(guidance?.correct).toBe("R — התנגדות");
    expect(guidance?.explanation).toContain("R = V ÷ I");
  });

  it("uses division by I to isolate resistance", async () => {
    const { basicFormulaGuidance } = await import("./basic-formula-guidance");
    const guidance = basicFormulaGuidance("formula-2");
    expect(guidance?.question).toContain("תבודד את R");
    expect(guidance?.correct).toContain("לחלק");
    expect(guidance?.explanation).toContain("R = V ÷ I");
  });

  it("uses division by R to isolate current", async () => {
    const { basicFormulaGuidance } = await import("./basic-formula-guidance");
    const guidance = basicFormulaGuidance("formula-3");
    expect(guidance?.question).toContain("תבודד את I");
    expect(guidance?.correct).toContain("לחלק");
    expect(guidance?.explanation).toContain("I = V ÷ R");
  });

  it("does not override unrelated lesson IDs", async () => {
    const { basicFormulaGuidance } = await import("./basic-formula-guidance");
    expect(basicFormulaGuidance("formula-subject-1")).toBeNull();
    expect(basicFormulaGuidance("ohm-1")).toBeNull();
  });
});


describe("percentage visuals match the actual question", () => {
  it("shows the exact calculation for 25% of 200", () => {
    const exercise = generateExercise("אחוזים", 3)!;
    const visual = percentageVisualForExercise(exercise);
    expect(exercise.prompt).toBe("כמה זה 25% מתוך 200?");
    expect(exercise.accepted).toEqual(["50"]);
    expect(visual.expression).toBe("25% × 200 ÷ 100 = 50");
    expect(visual.caption).toContain("התוצאה היא 50");
  });

  it("updates the visual for different generated percentage questions", () => {
    const exercise = generateExercise("אחוזים", 2)!;
    const visual = percentageVisualForExercise(exercise);
    expect(exercise.prompt).toBe("כמה זה 10% מתוך 200?");
    expect(visual.expression).toBe("10% × 200 ÷ 100 = 20");
    expect(visual.caption).toContain("התוצאה היא 20");
  });
});


describe("generated fraction visuals match the current denominator", () => {
  it("builds a one-part bar for the generated fraction", () => {
    const exercise = generateExercise("שברים", 3)!;
    const visual = fractionVisualForExercise(exercise);
    expect(exercise.prompt).toContain("חלק אחד מתוך 5 חלקים");
    expect(visual).toMatchObject({ kind: "bar", count: 5, filled: 1, label: "1/5" });
  });

  it("updates the bar when the generated denominator changes", () => {
    const exercise = generateExercise("שברים", 5)!;
    const visual = fractionVisualForExercise(exercise);
    expect(exercise.prompt).toContain("חלק אחד מתוך 7 חלקים");
    expect(visual).toMatchObject({ kind: "bar", count: 7, filled: 1, label: "1/7" });
  });
});


describe("decimal visuals match the current operation", () => {
  it("shows the exact addition for a generated decimal exercise", () => {
    const exercise = generateExercise("מספרים עשרוניים", 1)!;
    const visual = decimalVisualForExercise(exercise);
    expect(exercise.prompt).toBe("מה הערך של 0.2 + 0.3?");
    expect(exercise.accepted).toEqual(["0.5"]);
    expect(visual.expression).toBe("0.2 + 0.3 = 0.5");
  });

  it("shows the exact subtraction and result for a generated decimal exercise", () => {
    const exercise = generateExercise("מספרים עשרוניים", 3)!;
    const visual = decimalVisualForExercise(exercise);
    expect(exercise.prompt).toBe("מה הערך של 2.5 - 0.5?");
    expect(exercise.accepted).toEqual(["2"]);
    expect(visual.expression).toBe("2.5 − 0.5 = 2");
  });
});


describe("interactive equation lab matches the active beginner exercise", () => {
  it("models one-step addition, subtraction, multiplication, and division correctly", () => {
    const cases = [
      ["zero-2", "X + 1", 4, 3],
      ["zero-4b", "X − 2", 6, 8],
      ["zero-5b", "3 × X", 12, 4],
      ["zero-6", "X ÷ 2", 4, 8],
    ] as const;
    for (const [id, expression, rhs, answer] of cases) {
      const model = equationLabModelForExercise(curriculum.find((exercise) => exercise.id === id)!);
      expect(model).toMatchObject({ expression, rhs, answer });
    }
  });

  it("matches both steps in equations with addition or subtraction outside the multiplication", () => {
    const additionModel = equationLabModelForExercise(curriculum.find((exercise) => exercise.id === "zero-7")!);
    expect(additionModel).toMatchObject({ expression: "2 × X + 1", rhs: 7, answer: 3, coefficient: 2, offset: 1 });

    const subtractionModel = equationLabModelForExercise(curriculum.find((exercise) => exercise.id === "zero-7b")!);
    expect(subtractionModel).toMatchObject({ expression: "3 × X − 2", rhs: 10, answer: 4, coefficient: 3, offset: -2 });
  });

  it("does not show the equation lab for non-equation beginner exercises", () => {
    expect(equationLabModelForExercise(curriculum.find((exercise) => exercise.id === "zero-1")!)).toBeNull();
    expect(equationLabModelForExercise(curriculum.find((exercise) => exercise.id === "zero-8")!)).toBeNull();
  });
});


describe("fraction lab starts with the active exercise values", () => {
  it("starts reduction of 4/8 with numerator 4 and denominator 8", () => {
    expect(fractionLabDefaultsForExercise({ id: "fraction-reduce-1" })).toEqual({ numerator: 4, denominator: 8 });
  });

  it("starts reduction of 6/9 with numerator 6 and denominator 9", () => {
    expect(fractionLabDefaultsForExercise({ id: "fraction-reduce-2" })).toEqual({ numerator: 6, denominator: 9 });
  });

  it("keeps the standard defaults for non-reduction labs", () => {
    expect(fractionLabDefaultsForExercise({ id: "ohm-1" })).toEqual({ numerator: 12, denominator: 6 });
  });
});


describe("area lab defaults match the geometry exercise", () => {
  it("starts the rectangle lab at the dimensions in the lesson", () => {
    expect(areaLabDefaultsForExercise({ id: "geometry-area-rectangle-1" })).toEqual({ length: 6, width: 3 });
  });

  it("starts the square lab with equal sides from the lesson", () => {
    expect(areaLabDefaultsForExercise({ id: "geometry-area-square-1" })).toEqual({ length: 5, width: 5 });
  });
});


describe("fraction lab shows an equivalent reduced value", () => {
  it("reduces 4/8 to 1/2", () => {
    expect(reduceFractionForLab(4, 8)).toEqual({ numerator: 1, denominator: 2 });
  });

  it("reduces 6/9 to 2/3", () => {
    expect(reduceFractionForLab(6, 9)).toEqual({ numerator: 2, denominator: 3 });
  });

  it("handles an already reduced fraction", () => {
    expect(reduceFractionForLab(3, 7)).toEqual({ numerator: 3, denominator: 7 });
  });
});


describe("electrical lab defaults match the requested quantity", () => {
  it("starts the power-to-current lab with 60 watts and 12 volts", () => {
    expect(electricalLabDefaultsForExercise({ id: "electrical-power-sub-1" })).toEqual({ first: 60, second: 12 });
  });

  it("starts each electrical lab with the data given in its exercise", () => {
    expect(electricalLabDefaultsForExercise({ id: "ohm-1" })).toEqual({ first: 20, second: 10 });
    expect(electricalLabDefaultsForExercise({ id: "ohm-2" })).toEqual({ first: 12, second: 3 });
    expect(electricalLabDefaultsForExercise({ id: "electrical-ohm-sub-1" })).toEqual({ first: 12, second: 4 });
    expect(electricalLabDefaultsForExercise({ id: "power-1" })).toEqual({ first: 10, second: 2 });
    expect(electricalLabDefaultsForExercise({ id: "power-2" })).toEqual({ first: 12, second: 3 });
  });
});


describe("electrical mini simulator appears only when it matches the exercise", () => {
  it("uses the matching voltage and resistance for current exercises", () => {
    expect(electricalMiniSimulatorConfigForExercise({ id: "ohm-1", topic: "חשמל — חוק אוהם" })).toEqual({ voltage: 20, resistance: 10 });
    expect(electricalMiniSimulatorConfigForExercise({ id: "electrical-ohm-sub-1", topic: "חשמל — חוק אוהם" })).toEqual({ voltage: 12, resistance: 4 });
  });

  it("does not show the generic current simulator for resistance or power exercises", () => {
    expect(electricalMiniSimulatorConfigForExercise({ id: "ohm-2", topic: "חשמל — חוק אוהם" })).toBeNull();
    expect(electricalMiniSimulatorConfigForExercise({ id: "power-1", topic: "חשמל — הספק" })).toBeNull();
    expect(electricalMiniSimulatorConfigForExercise({ id: "electrical-power-sub-1", topic: "חשמל — הספק" })).toBeNull();
  });
});


describe("area lab units match the exercise", () => {
  it("uses square centimeters for the rectangle lesson", () => {
    expect(areaLabUnitsForExercise({ id: "geometry-area-rectangle-1" })).toEqual({ lengthUnit: "ס״מ", areaUnit: "סמ״ר" });
  });

  it("uses meters and square meters for the square lesson", () => {
    expect(areaLabUnitsForExercise({ id: "geometry-area-square-1" })).toEqual({ lengthUnit: "מ׳", areaUnit: "מ״ר" });
  });
});


describe("fraction guided steps match the operation in the exercise", () => {
  it("guides same-denominator addition and subtraction differently", () => {
    const addition = fractionGuidanceForExercise(curriculum.find((exercise) => exercise.id === "fraction-add-same-1")!);
    expect(addition?.correct).toContain("לחבר את המונים");
    expect(addition?.explanation).toContain("המכנה המשותף");

    const subtraction = fractionGuidanceForExercise(curriculum.find((exercise) => exercise.id === "fraction-sub-same-1")!);
    expect(subtraction?.correct).toContain("לחסר את המונים");
    expect(subtraction?.explanation).toContain("המכנה המשותף");
  });

  it("guides common denominators, multiplication, division, and reduction with the matching method", () => {
    expect(fractionGuidanceForExercise(curriculum.find((exercise) => exercise.id === "fraction-common-1")!)?.correct).toContain("מכנה משותף");
    expect(fractionGuidanceForExercise(curriculum.find((exercise) => exercise.id === "fraction-multiply-1")!)?.correct).toContain("מונה במונה");
    expect(fractionGuidanceForExercise(curriculum.find((exercise) => exercise.id === "fraction-divide-1")!)?.correct).toContain("להפוך את השבר השני");
    expect(fractionGuidanceForExercise(curriculum.find((exercise) => exercise.id === "fraction-reduce-1")!)?.correct).toContain("המכנה באותו מספר");
  });
});


describe("generated equation models support signed equations", () => {
  it("solves a negative coefficient equation correctly", () => {
    expect(equationLabModelForExercise({ prompt: "-5 × X = -20. איזה מספר הוא X?" })).toMatchObject({
      expression: "-5 × X",
      rhs: -20,
      answer: 4,
      coefficient: -5,
    });
  });

  it("solves division by a negative number correctly", () => {
    expect(equationLabModelForExercise({ prompt: "X ÷ (-5) = -4. איזה מספר הוא X?" })).toMatchObject({
      expression: "X ÷ (-5)",
      rhs: -4,
      answer: 20,
      coefficient: -0.2,
    });
  });
});


describe("division equation guidance includes the actual divisor", () => {
  it("explains division by a positive number", async () => {
    const { divisionEquationGuidance } = await import("./division-equation-guidance");
    const guidance = divisionEquationGuidance("X ÷ 4 = 6. מה הערך של X?");
    expect(guidance?.correct).toContain("ב־4");
    expect(guidance?.explanation).toContain("כפל ב־4");
  });

  it("explains division by a negative number with its sign", async () => {
    const { divisionEquationGuidance } = await import("./division-equation-guidance");
    const guidance = divisionEquationGuidance("X ÷ (-5) = -4. מה הערך של X?");
    expect(guidance?.correct).toContain("ב־(-5)");
    expect(guidance?.explanation).toContain("כפל ב־(-5)");
  });

  it("does not generate division guidance for zero or unrelated expressions", async () => {
    const { divisionEquationGuidance } = await import("./division-equation-guidance");
    expect(divisionEquationGuidance("X ÷ 0 = 4")).toBeNull();
    expect(divisionEquationGuidance("2 × X = 8")).toBeNull();
  });
});


describe("formula-subject guidance matches the variable being isolated", () => {
  it("guides isolation of C by dividing by B", () => {
    const guidance = formulaSubjectGuidance("formula-subject-1");
    expect(guidance?.correct).toBe("לחלק את שני האגפים ב־B");
    expect(guidance?.explanation).toContain("C = A ÷ B");
  });

  it("guides isolation of W by dividing by L", () => {
    const guidance = formulaSubjectGuidance("formula-subject-2");
    expect(guidance?.correct).toBe("לחלק את שני האגפים ב־L");
    expect(guidance?.explanation).toContain("W = A ÷ L");
  });
});


describe("geometry and unit conversion guidance matches the exercise", () => {
  it("uses the correct conversion factor for millimeters and centimeters", () => {
    expect(geometryGuidanceForExercise("units-mm-cm-1")?.correct).toContain("ב־10");
    expect(geometryGuidanceForExercise("units-cm-m-1")?.correct).toContain("ב־100");
  });

  it("uses the matching area formula for rectangles, squares, and circles", () => {
    expect(geometryGuidanceForExercise("geometry-area-rectangle-1")?.correct).toContain("אורך ברוחב");
    expect(geometryGuidanceForExercise("geometry-area-square-1")?.correct).toContain("הצלע בעצמה");
    expect(geometryGuidanceForExercise("geometry-area-circle-1")?.explanation).toContain("12.56 סמ״ר");
  });

  it("uses the correct operation for radius and diameter conversions", () => {
    expect(geometryGuidanceForExercise("geometry-diameter-1")?.correct).toContain("לחלק");
    expect(geometryGuidanceForExercise("geometry-radius-1")?.correct).toContain("לכפול");
  });
});


describe("formula isolation reinforcement stays on topic", () => {
  it("does not replace variable-isolation practice with a generic units quiz", () => {
    const exercise = generateReinforcement("שינוי נושא נוסחה", 4, "unit");
    expect(exercise?.prompt).toBe("A = B × C. כיצד נבודד את C כאשר B אינו אפס?");
    expect(exercise?.accepted).toContain("C=A/B");
    expect(exercise?.hint2).toContain("C = A ÷ B");
    expect(exercise?.explanation).toContain("מחלקים את שני האגפים");
  });
});
