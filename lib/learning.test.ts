import { describe, expect, it } from "vitest";
import { curriculum } from "./curriculum";
import { chooseNextExercise, emptyLearningState, recordAttempt, topicMastery, dueReviewIds, classifyError } from "./learning";

describe("learning engine", () => {
  it("records correct answers and prevents duplicate completion", () => {
    const first = recordAttempt(emptyLearningState, curriculum[0], true, false);
    const second = recordAttempt(first, curriculum[0], true, true);

    expect(second.version).toBe(6);
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

  it("requires repeated independent success for a mastery gate", async () => {
    const { topicMasteryGate } = await import("./learning");
    let state = emptyLearningState;
    state = recordAttempt(state, curriculum[0], true, false);
    state = recordAttempt(state, curriculum[0], true, false);
    expect(topicMasteryGate(state.stats[curriculum[0].topic])).toBe(false);
    state = recordAttempt(state, curriculum[0], true, false);
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
  it("requires a mastered topic before opening its mastery test", async () => {
    const { canStartMasteryTest } = await import("./learning");
    let state = emptyLearningState;
    expect(canStartMasteryTest(curriculum[0].topic, state)).toBe(false);
    state = recordAttempt(state, curriculum[0], true, false);
    state = recordAttempt(state, curriculum[0], true, false);
    state = recordAttempt(state, curriculum[0], true, false);
    expect(canStartMasteryTest(curriculum[0].topic, state)).toBe(true);
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
    expect(division.prompt).toBe("X + 5 = 10. איזה מספר הוא X?");
    expect(division.accepted).toEqual(["5"]);
  });
});
