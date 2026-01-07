// src/data/actions.ts
// Lightweight localStorage-backed "actions / control" system.

export type ActionType =
  | "PARENT_CONTACT"
  | "TALK_STUDENT"
  | "ASSIGN_CLASS_TEACHER"
  | "ASSIGN_SUBJECT_TEACHER"
  | "REFERRAL_PSYCHOLOGIST"

export type ActionStatus = "NEW" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export type StudentAction = {
  id: string;
  studentId: string;
  type: ActionType;
  title: string;
  assignee: string;
  status: ActionStatus;
  dueDate: string | null; // ISO date or datetime
  note: string;
  result: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

const LS_KEY = "student_actions_v1";

export const actionTypeLabel: Record<ActionType, string> = {
  PARENT_CONTACT: "Связаться с родителями",
  TALK_STUDENT: "Разговор с учеником",
  ASSIGN_CLASS_TEACHER: "Поручение классруку",
  ASSIGN_SUBJECT_TEACHER: "Поручение предметнику",
  REFERRAL_PSYCHOLOGIST: "Направить к психологу",
};

// Convenience list for <select> UIs
export const ACTION_TYPES: ActionType[] = [
  "PARENT_CONTACT",
  "TALK_STUDENT",
  "ASSIGN_CLASS_TEACHER",
  "ASSIGN_SUBJECT_TEACHER",
  "REFERRAL_PSYCHOLOGIST",
];

export const actionStatusLabel: Record<ActionStatus, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  DONE: "Выполнено",
  CANCELLED: "Отменено",
};

export const isActionActive = (a: StudentAction) =>
  a.status === "NEW" || a.status === "IN_PROGRESS";

export function loadActions(): StudentAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveActions(actions: StudentAction[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(actions));
}

export function createAction(input: {
  studentId: string;
  type: ActionType;
  assignee: string;
  dueDate?: string | null;
  note?: string;
}): StudentAction {
  const now = new Date().toISOString();
  const a: StudentAction = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    studentId: input.studentId,
    type: input.type,
    title: actionTypeLabel[input.type] ?? "Действие",
    assignee: (input.assignee || "").trim() || "—",
    status: "NEW",
    dueDate: input.dueDate ?? null,
    note: (input.note || "").trim(),
    result: "",
    createdAt: now,
    updatedAt: now,
  };

  const all = loadActions();
  const next = [a, ...all];
  saveActions(next);
  return a;
}

export function updateAction(
  actionId: string,
  patch: Partial<Pick<StudentAction, "status" | "dueDate" | "note" | "result" | "assignee">>
): StudentAction | null {
  const all = loadActions();
  const idx = all.findIndex((x) => x.id === actionId);
  if (idx === -1) return null;

  const updated: StudentAction = {
    ...all[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  const next = [...all];
  next[idx] = updated;
  saveActions(next);
  return updated;
}

export function getActionsForStudent(studentId: string): StudentAction[] {
  return loadActions().filter((a) => a.studentId === studentId);
}

export function getActiveActionsForStudent(studentId: string): StudentAction[] {
  return loadActions().filter((a) => a.studentId === studentId && isActionActive(a));
}

export function countActiveActionsByStudent(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const a of loadActions()) {
    if (!isActionActive(a)) continue;
    map[a.studentId] = (map[a.studentId] ?? 0) + 1;
  }
  return map;
}

export function getOverdueActions(now = new Date()): StudentAction[] {
  const n = now.getTime();
  return loadActions().filter((a) => {
    if (!isActionActive(a)) return false;
    if (!a.dueDate) return false;
    const t = new Date(a.dueDate).getTime();
    return Number.isFinite(t) && t < n;
  });
}
