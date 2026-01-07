import React, { useMemo, useState } from "react";
import type { RiskTicket } from "../../data/riskTickets";
import { ticketStageLabel, ticketTitle } from "../../data/riskTickets";
import type { Student } from "../../data/riskUtils";
import { STUDENTS } from "../../data/students";

type Props = {
  title: string;
  tickets: RiskTicket[];
  onOpenTicket: (ticket: RiskTicket) => void;
  onOpenStudent?: (studentId: string) => void;
};

export const RiskTicketsTable: React.FC<Props> = ({
  title,
  tickets,
  onOpenTicket,
  onOpenStudent,
}) => {
  const [q, setQ] = useState<string>("");

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    const byId = new Map<string, Student>(STUDENTS.map((s) => [s.id, s as any]));
    const merged = tickets
      .map((t) => ({
        ticket: t,
        student: byId.get(t.studentId) ?? null,
      }))
      .filter(({ ticket, student }) => {
        if (!query) return true;
        const name = (student?.fullName ?? "").toLowerCase();
        const cls = (student?.className ?? "").toLowerCase();
        return (
          name.includes(query) ||
          cls.includes(query) ||
          ticket.studentId.toLowerCase().includes(query) ||
          ticket.assigneeName.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => (a.ticket.updatedAt < b.ticket.updatedAt ? 1 : -1));

    return merged;
  }, [tickets, q]);

  return (
    <div className="ui-panel overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/70">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
            <p className="text-xs text-slate-400">Всего: {tickets.length}</p>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск: ФИО, класс, ID, поручено…"
            className="ui-input w-full md:w-80"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="ui-table">
          <thead>
            <tr className="border-b border-slate-800/70">
              <th className="ui-th">Ученик</th>
              <th className="ui-th">Класс</th>
              <th className="ui-th">Тип</th>
              <th className="ui-th">Статус</th>
              <th className="ui-th">Поручено</th>
              <th className="ui-th">Обновлено</th>
              <th className="ui-th">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="ui-td text-slate-400 text-center py-6">
                  Нет тикетов.
                </td>
              </tr>
            )}

            {rows.map(({ ticket, student }) => (
              <tr key={ticket.id} className="hover:bg-slate-900/50 transition">
                <td className="ui-td">
                  <div className="space-y-0.5">
                    <div className="text-slate-50 font-medium">
                      {student?.fullName ?? `ID: ${ticket.studentId}`}
                    </div>
                    <div className="text-xs text-slate-500">#{ticket.id.slice(-6)}</div>
                  </div>
                </td>
                <td className="ui-td text-slate-200">{student?.className ?? "—"}</td>
                <td className="ui-td text-slate-200">{ticketTitle(ticket.type)}</td>
                <td className="ui-td">
                  <span className="ui-chip border-slate-700/70 bg-slate-900/60 text-slate-200">
                    {ticketStageLabel[ticket.stage]}
                  </span>
                </td>
                <td className="ui-td text-slate-200">{ticket.assigneeName || "—"}</td>
                <td className="ui-td text-slate-400 text-xs">
                  {new Date(ticket.updatedAt).toLocaleString()}
                </td>
                <td className="ui-td">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onOpenTicket(ticket)} className="ui-btn-secondary px-3 py-1.5 text-xs">
                      Открыть
                    </button>
                    {onOpenStudent && student && (
                      <button
                        onClick={() => onOpenStudent(student.id)}
                        className="ui-btn-ghost px-3 py-1.5 text-xs"
                      >
                        Профиль
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
