import { describe, expect, it } from "vitest";
import { curriculum } from "./curriculum";
import { checkpointPasses } from "./checkpoints";
import { generateExercise, generateReinforcement } from "./exercise-generator";
import { buildTopicMasteryTest } from "./mastery";
import { buildFinalExam, finalExamPasses } from "./final-exam";
import { stageGateSatisfied } from "./stages";
import { chooseNextExercise, emptyLearningState, recordAttempt, topicMastery, dueReviewIds, classifyError, resolveExercise, canStartMasteryTest } from "./learning";

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
