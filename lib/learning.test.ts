import { describe, expect, it } from "vitest";
import { curriculum } from "./curriculum";
import { chooseNextExercise, emptyLearningState, recordAttempt, topicMastery } from "./learning";

describe("learning engine", () => {
  it("records correct answers and prevents duplicate completion", () => {
    const first = recordAttempt(emptyLearningState, curriculum[0], true, false);
    const second = recordAttempt(first, curriculum[0], true, true);

    expect(second.version).toBe(2);
    expect(second.completed).toEqual([curriculum[0].id]);
    expect(second.stats[curriculum[0].topic].correct).toBe(2);
    expect(second.stats[curriculum[0].topic].hints).toBe(1);
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

  it("reinforces a weak topic before moving on when an unfinished exercise exists", () => {
    let state = emptyLearningState;
    state = recordAttempt(state, curriculum[0], false, false);
    state = recordAttempt(state, curriculum[0], false, true);

    expect(chooseNextExercise(curriculum, state)).toBe(1);
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
