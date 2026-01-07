// src/data/riskTickets.ts
// LocalStorage-backed Kanban "risk tickets" (no backend).

import type { ActionType } from "./actions";
import { actionTypeLabel } from "./actions";

export type TicketStage = "PROBLEM" | "DISCUSSION" | "READY" | "IN_PROGRESS" | "DONE";

export const ticketStageLabel: Record<TicketStage, string> = {
  PROBLEM: "Проблема",
  DISCUSSION: "Обсуждение",
  READY: "Готовы к работе",
  IN_PROGRESS: "В работе",
  DONE: "Готово",
};

export type TicketReport = {
  id: string;
  createdAt: string; // ISO
  // Week key (Monday) for weekly reporting, e.g. "2026-01-05"
  weekKey: string;
  authorAccountId: string | null;
  authorName: string;
  text: string;
};

export type RiskTicket = {
  id: string;
  studentId: string;

  // Control type: "поручение" / "связаться с родителями" etc.
  type: ActionType;

  // Assignment
  assigneeAccountId: string | null;
  assigneeName: string;

  // Kanban stage
  stage: TicketStage;

  // Optional planning
  dueDate: string | null; // ISO date or datetime

  // Notes
  description: string;

  // Weekly updates
  reports: TicketReport[];

  // Audit
  createdAt: string;
  updatedAt: string;
  createdByAccountId: string | null;
  createdByName: string;
};

const LS_KEY = "risk_tickets_v1";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Returns Monday of the week as YYYY-MM-DD in local time. */
export function getWeekKey(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : new Date(isoOrDate);
  if (!Number.isFinite(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + diff);
  return `${monday.getFullYear()}-${pad2(monday.getMonth() + 1)}-${pad2(monday.getDate())}`;
}

/**
 * Ticket needs weekly report if it's not DONE and there is no report for the current week.
 */
export function ticketNeedsWeeklyReport(ticket: RiskTicket, now = new Date()): boolean {
  if (!ticket || ticket.stage === "DONE") return false;
  const wk = getWeekKey(now);
  const reps = Array.isArray(ticket.reports) ? ticket.reports : [];
  return !reps.some((r) => (r as any)?.weekKey === wk);
}

function safeParseArray(raw: string | null): any[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadRiskTickets(): RiskTicket[] {
  if (typeof window === "undefined") return [];
  const arr = safeParseArray(localStorage.getItem(LS_KEY));
  // soft validation
  return arr
    .filter((x) => x && typeof x === "object")
    .map((x) => {
      const now = new Date().toISOString();
      const type: ActionType = (x.type as ActionType) ?? "TALK_STUDENT";
      return {
        id: String(x.id ?? ""),
        studentId: String(x.studentId ?? ""),
        type,
        assigneeAccountId:
          typeof x.assigneeAccountId === "string" ? x.assigneeAccountId : null,
        assigneeName: String(x.assigneeName ?? "—"),
        stage: (x.stage as TicketStage) ?? "PROBLEM",
        dueDate: typeof x.dueDate === "string" ? x.dueDate : null,
        description: String(x.description ?? ""),
        reports: Array.isArray(x.reports)
          ? (x.reports
              .filter((r: any) => r && typeof r === "object")
              .map((r: any) => ({
                id: String(r.id ?? ""),
                createdAt: typeof r.createdAt === "string" ? r.createdAt : now,
                weekKey:
                  typeof r.weekKey === "string" && r.weekKey
                    ? r.weekKey
                    : getWeekKey(typeof r.createdAt === "string" ? r.createdAt : now),
                authorAccountId:
                  typeof r.authorAccountId === "string" ? r.authorAccountId : null,
                authorName: String(r.authorName ?? "—"),
                text: String(r.text ?? ""),
              })) as TicketReport[])
          : [],
        createdAt: typeof x.createdAt === "string" ? x.createdAt : now,
        updatedAt: typeof x.updatedAt === "string" ? x.updatedAt : now,
        createdByAccountId:
          typeof x.createdByAccountId === "string" ? x.createdByAccountId : null,
        createdByName: String(x.createdByName ?? "—"),
      } satisfies RiskTicket;
    })
    .filter((t) => t.id && t.studentId);
}

export function saveRiskTickets(tickets: RiskTicket[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(tickets));
}

function genId(prefix = "t") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function createRiskTicket(input: {
  studentId: string;
  type: ActionType;
  stage?: TicketStage;
  assigneeAccountId: string | null;
  assigneeName: string;
  dueDate?: string | null;
  description?: string;
  createdByAccountId: string | null;
  createdByName: string;
}): RiskTicket {
  const now = new Date().toISOString();
  const ticket: RiskTicket = {
    id: genId("risk"),
    studentId: input.studentId,
    type: input.type,
    assigneeAccountId: input.assigneeAccountId,
    assigneeName: (input.assigneeName || "").trim() || "—",
    stage: input.stage ?? "PROBLEM",
    dueDate: input.dueDate ?? null,
    description: (input.description || "").trim(),
    reports: [],
    createdAt: now,
    updatedAt: now,
    createdByAccountId: input.createdByAccountId,
    createdByName: (input.createdByName || "").trim() || "—",
  };

  const all = loadRiskTickets();
  const next = [ticket, ...all];
  saveRiskTickets(next);
  return ticket;
}

export function updateRiskTicket(
  ticketId: string,
  patch: Partial<
    Pick<
      RiskTicket,
      "stage" | "type" | "assigneeAccountId" | "assigneeName" | "dueDate" | "description"
    >
  >
): RiskTicket | null {
  const all = loadRiskTickets();
  const idx = all.findIndex((x) => x.id === ticketId);
  if (idx === -1) return null;

  const updated: RiskTicket = {
    ...all[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  const next = [...all];
  next[idx] = updated;
  saveRiskTickets(next);
  return updated;
}

export function addTicketReport(
  ticketId: string,
  report: { authorAccountId: string | null; authorName: string; text: string }
): RiskTicket | null {
  const all = loadRiskTickets();
  const idx = all.findIndex((x) => x.id === ticketId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const newReport: TicketReport = {
    id: genId("rep"),
    createdAt: now,
    weekKey: getWeekKey(now),
    authorAccountId: report.authorAccountId,
    authorName: (report.authorName || "").trim() || "—",
    text: (report.text || "").trim(),
  };

  const updated: RiskTicket = {
    ...all[idx],
    reports: [newReport, ...(all[idx].reports ?? [])],
    updatedAt: now,
  };

  const next = [...all];
  next[idx] = updated;
  saveRiskTickets(next);
  return updated;
}

export function deleteRiskTicket(ticketId: string) {
  const all = loadRiskTickets();
  const next = all.filter((x) => x.id !== ticketId);
  saveRiskTickets(next);
}

export function ticketTitle(type: ActionType) {
  return actionTypeLabel[type] ?? "Тикет";
}
