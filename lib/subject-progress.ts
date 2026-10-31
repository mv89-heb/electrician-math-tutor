export type SubjectProgress = {
  version: 1;
  completedUnitIds: string[];
  updatedAt: number;
};

export const SUBJECT_PROGRESS_STORAGE_KEY = "electrician-subject-progress-v1";

export const emptySubjectProgress: SubjectProgress = {
  version: 1,
  completedUnitIds: [],
  updatedAt: 0,
};

export function parseSubjectProgress(raw: string | null): SubjectProgress {
  if (!raw) return { ...emptySubjectProgress };
  try {
    const parsed = JSON.parse(raw) as Partial<SubjectProgress>;
    if (
      parsed.version !== 1 ||
      !Array.isArray(parsed.completedUnitIds) ||
      !parsed.completedUnitIds.every((id) => typeof id === "string")
    ) return { ...emptySubjectProgress };

    return {
      version: 1,
      completedUnitIds: [...new Set(parsed.completedUnitIds)],
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
    };
  } catch {
    return { ...emptySubjectProgress };
  }
}

export function setUnitCompleted(
  progress: SubjectProgress,
  unitId: string,
  completed: boolean,
  now = Date.now(),
): SubjectProgress {
  const ids = new Set(progress.completedUnitIds);
  if (completed) ids.add(unitId);
  else ids.delete(unitId);
  return { version: 1, completedUnitIds: [...ids], updatedAt: now };
}
