import { describe, expect, it } from "vitest";
import { curriculum } from "./curriculum";
import { chooseNextExercise, emptyLearningState, recordAttempt, topicMastery } from "./learning";

describe("learning engine", () => {
  it("records correct answers and prevents duplicate completion", () => {
    const first = recordAttempt(emptyLearningState, curriculum[0], true, false);
    const second = recordAttempt(first, curriculum[0], true, true);

    expect(second.completed).toEqual([curriculum[0].id]);
    expect(second.stats[curriculum[0].topic].correct).toBe(2);
    expect(second.stats[curriculum[0].topic].hints).toBe(1);
  });

  it("records mistakes and calculates mastery", () => {
    const failed = recordAttempt(emptyLearningState, curriculum[0], false, true);
    expect(failed.mistakes).toContain(curriculum[0].id);
    expect(topicMastery(failed.stats[curriculum[0].topic])).toBe(25);
  });

  it("prioritizes the weakest known topic", () => {
    let state = emptyLearningState;
    state = recordAttempt(state, curriculum[0], true, false);
    state = recordAttempt(state, curriculum[1], false, false);

    expect(chooseNextExercise(curriculum, state)).toBe(1);
  });
});
