import React, { useMemo, useState } from "react";
import type { RiskTicket, TicketStage } from "../../data/riskTickets";
import {
  addTicketReport,
  deleteRiskTicket,
  ticketStageLabel,
  ticketTitle,
  updateRiskTicket,
} from "../../data/riskTickets";
import type { ActionType } from "../../data/actions";
import { ACTION_TYPES, actionTypeLabel } from "../../data/actions";
import { ALL_DEMO_ACCOUNTS, findHomeroomTeacherForClass } from "../../data/accounts";
import type { Student } from "../../data/riskUtils";

type CurrentUser = {
  accountId: string | null;
  displayName: string;
  role: string | null;
};

type Props = {
  ticket: RiskTicket;
  student: Student | null;
  currentUser: CurrentUser;
  canEdit: boolean;
  onClose: () => void;
  onChanged: () => void; // refresh parent
};

const requiresHomeroomAssignee = (type: ActionType) =>
  type === "PARENT_CONTACT" || type === "ASSIGN_CLASS_TEACHER";

const requiresTeacherPick = (type: ActionType) => type === "ASSIGN_SUBJECT_TEACHER";

const autoPsychologist = (type: ActionType) => type === "REFERRAL_PSYCHOLOGIST";

export const RiskTicketModal: React.FC<Props> = ({
  ticket,
  student,
  currentUser,
  canEdit,
  onClose,
  onChanged,
}) => {
  const [localType, setLocalType] = useState<ActionType>(ticket.type);
  const [localStage, setLocalStage] = useState<TicketStage>(ticket.stage);
  const [localDue, setLocalDue] = useState<string>(ticket.dueDate ?? "");
  const [localDesc, setLocalDesc] = useState<string>(ticket.description ?? "");

  const homeroom = useMemo(() => {
    return findHomeroomTeacherForClass(student?.className);
  }, [student?.className]);

  const teacherOptions = useMemo(() => {
    // list of all demo teachers (including class teachers) with an email
    return ALL_DEMO_ACCOUNTS
      .filter((a) => a.role === "teacher" || a.role === "class_teacher")
      .map((a) => ({ id: a.id, label: `${a.fullName}${a.role === "class_teacher" ? " · классрук" : ""}` }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const [pickedTeacherId, setPickedTeacherId] = useState<string>(
    typeof ticket.assigneeAccountId === "string" ? ticket.assigneeAccountId : ""
  );

  const effectiveAssignee = useMemo(() => {
    if (autoPsychologist(localType)) {
      return { id: "psychologist", name: "Психолог" };
    }
    if (requiresHomeroomAssignee(localType)) {
      if (homeroom) return { id: homeroom.id, name: homeroom.fullName };
      return { id: null, name: "Классрук не найден" };
    }
    if (requiresTeacherPick(localType)) {
      const found = teacherOptions.find((t) => t.id === pickedTeacherId);
      return { id: found?.id ?? null, name: found?.label ?? "Выберите учителя" };
    }
    // Default: keep current assignment
    return {
      id: ticket.assigneeAccountId,
      name: ticket.assigneeName || "—",
    };
  }, [homeroom, localType, pickedTeacherId, teacherOptions, ticket.assigneeAccountId, ticket.assigneeName]);

  const canPickTeacher = canEdit && requiresTeacherPick(localType);

  const handleSave = () => {
    if (!canEdit) return;

    // if teacher pick is required, must be selected
    if (requiresTeacherPick(localType) && !effectiveAssignee.id) {
      alert("Выберите учителя-предметника");
      return;
    }

    updateRiskTicket(ticket.id, {
      type: localType,
      stage: localStage,
      dueDate: localDue ? localDue : null,
      description: localDesc,
      assigneeAccountId: effectiveAssignee.id,
      assigneeName: effectiveAssignee.name,
    });

    onChanged();
    onClose();
  };

  const [reportText, setReportText] = useState<string>("");
  const handleAddReport = () => {
    if (!reportText.trim()) return;
    addTicketReport(ticket.id, {
      authorAccountId: currentUser.accountId,
      authorName: currentUser.displayName || "—",
      text: reportText,
    });
    setReportText("");
    onChanged();
  };

  const handleDelete = () => {
    if (!canEdit) return;
    if (!confirm("Удалить тикет?")) return;
    deleteRiskTicket(ticket.id);
    onChanged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="ui-panel w-full max-w-2xl p-5 md:p-6 space-y-5 animate-fade-in-up">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">{ticketTitle(ticket.type)}</h2>
            <p className="text-sm text-slate-400">
              {student ? (
                <>
                  <span className="text-slate-200 font-medium">{student.fullName}</span> · {student.className} · ID: {student.id}
                </>
              ) : (
                <>Ученик: {ticket.studentId}</>
              )}
            </p>
          </div>
          <button onClick={onClose} className="ui-btn-ghost rounded-full px-3 py-1.5 text-sm">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="ui-panel p-4">
            <p className="text-xs text-slate-400 mb-2">Статус</p>
            <select
              disabled={!canEdit}
              className="ui-select w-full"
              value={localStage}
              onChange={(e) => setLocalStage(e.target.value as TicketStage)}
            >
              {Object.entries(ticketStageLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="ui-panel p-4">
            <p className="text-xs text-slate-400 mb-2">Тип контроля</p>
            <select
              disabled={!canEdit}
              className="ui-select w-full"
              value={localType}
              onChange={(e) => {
                const next = e.target.value as ActionType;
                setLocalType(next);
                // reset teacher pick when switching type
                if (!requiresTeacherPick(next)) setPickedTeacherId("");
              }}
            >
              {ACTION_TYPES.map((k) => (
                <option key={k} value={k}>
                  {actionTypeLabel[k]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="ui-panel p-4">
            <p className="text-xs text-slate-400 mb-2">Поручено</p>
            {requiresTeacherPick(localType) ? (
              <select
                disabled={!canPickTeacher}
                className="ui-select w-full"
                value={pickedTeacherId}
                onChange={(e) => setPickedTeacherId(e.target.value)}
              >
                <option value="">— выбрать учителя —</option>
                {teacherOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-slate-200">{effectiveAssignee.name}</div>
            )}
            {requiresHomeroomAssignee(localType) && (
              <p className="text-[11px] text-slate-500 mt-2">
                Авто-привязка к классному руководителю класса.
              </p>
            )}
            {autoPsychologist(localType) && (
              <p className="text-[11px] text-slate-500 mt-2">Авто-направление психологу.</p>
            )}
          </div>

          <div className="ui-panel p-4">
            <p className="text-xs text-slate-400 mb-2">Дедлайн (необязательно)</p>
            <input
              disabled={!canEdit}
              className="ui-input w-full"
              type="datetime-local"
              value={localDue}
              onChange={(e) => setLocalDue(e.target.value)}
            />
          </div>
        </div>

        <div className="ui-panel p-4">
          <p className="text-xs text-slate-400 mb-2">Описание / цель</p>
          <textarea
            disabled={!canEdit}
            className="ui-textarea w-full"
            value={localDesc}
            onChange={(e) => setLocalDesc(e.target.value)}
            placeholder="Коротко: что не так и какой ожидаемый результат…"
          />
        </div>

        <div className="ui-panel p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-50">Мини-отчёты</p>
            <span className="text-xs text-slate-500">{ticket.reports?.length ?? 0}</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto custom-scroll-thin pr-1">
            {(ticket.reports ?? []).length === 0 ? (
              <div className="text-sm text-slate-400">Пока нет отчётов.</div>
            ) : (
              ticket.reports
                .slice()
                .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
                .map((r) => (
                  <div key={r.id} className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3">
                    <p className="text-xs text-slate-400">
                      <span className="text-slate-200">{r.authorName}</span> · {new Date(r.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-200 mt-1 whitespace-pre-wrap">{r.text}</p>
                  </div>
                ))
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <input
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Добавить мини-отчёт за неделю…"
              className="ui-input flex-1"
            />
            <button onClick={handleAddReport} className="ui-btn-secondary">
              Добавить
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-500">
            Создано: {new Date(ticket.createdAt).toLocaleString()} · Обновлено: {new Date(ticket.updatedAt).toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button onClick={handleDelete} className="ui-btn-secondary">
                Удалить
              </button>
            )}
            {canEdit ? (
              <button onClick={handleSave} className="ui-btn-primary">
                Сохранить
              </button>
            ) : (
              <button onClick={onClose} className="ui-btn-primary">
                Ок
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
