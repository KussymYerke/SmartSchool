// src/pages/RiskStudentsPage.tsx
// Kanban board for "risk group" work (localStorage only, no backend)

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n/i18n";
import { ALL_DEMO_ACCOUNTS, findHomeroomTeacherForClass } from "../data/accounts";
import { STUDENTS } from "../data/students";
import { ACTION_TYPES, actionTypeLabel, type ActionType } from "../data/actions";
import {
  calculateRiskScore,
  getRiskLevel,
  type RiskLevel,
  calculateSubjectRiskScore,
  type Student,
} from "../data/riskUtils";
import { getSubjectByCode } from "../data/subjects";
import { useToast } from "../components/Toast";
import {
  createRiskTicket,
  loadRiskTickets,
  ticketNeedsWeeklyReport,
  ticketStageLabel,
  type RiskTicket,
  type TicketStage,
  updateRiskTicket,
} from "../data/riskTickets";
import { RiskTicketModal } from "../components/risk/RiskTicketModal";

type RiskStudentsPageProps = {
  onSelectStudent: (id: string) => void;
  forcedClassName?: string | null;
  initialMode?: "class" | "subject";
};

const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  none: "Нет риска",
  low: "Низкий риск",
  medium: "Орташа риск",
  high: "Жоғары риск",
};

const STAGES: { key: TicketStage; title: string; hint: string }[] = [
  { key: "PROBLEM", title: "Проблемы", hint: "Кого нужно взять в работу" },
  { key: "DISCUSSION", title: "Обсуждение", hint: "Обсудить на собрании" },
  { key: "READY", title: "Ready", hint: "Передано / готово к работе" },
  { key: "IN_PROGRESS", title: "In progress", hint: "Работа идёт" },
  { key: "DONE", title: "Done", hint: "Успешно закрыто" },
];

const requiresHomeroomAssignee = (type: ActionType) =>
  type === "PARENT_CONTACT" || type === "ASSIGN_CLASS_TEACHER";

const requiresTeacherPick = (type: ActionType) => type === "ASSIGN_SUBJECT_TEACHER";

const autoPsychologist = (type: ActionType) => type === "REFERRAL_PSYCHOLOGIST";

function canMoveTicket(
  role: string | null,
  accountId: string | null,
  ticket: RiskTicket,
  student: Student | null,
  homeroomClasses: string[]
) {
  if (role === "deputy") return true;
  if (!accountId) return false;
  if (ticket.assigneeAccountId === accountId) return true;
  // class teacher can move own class tickets (for coordination)
  if (role === "class_teacher" && student?.className && homeroomClasses.includes(student.className)) return true;
  return false;
}

export const RiskStudentsPage: React.FC<RiskStudentsPageProps> = ({
  onSelectStudent,
  forcedClassName = null,
  initialMode,
}) => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const notify = (
    message: string,
    kind: "success" | "error" | "info" = "info"
  ) => {
    // The app uses a single-variant toast. Use small prefixes for clarity.
    const prefix = kind === "success" ? "✅ " : kind === "error" ? "⛔ " : "ℹ️ ";
    showToast(prefix + message);
  };
  const {
    role,
    accountId,
    displayName,
    className: authClassName,
    homeroomClasses,
    selectedSubject,
    setSelectedSubject,
  } = useAuth();

  const myHomeroomClasses = useMemo(() => {
    if (forcedClassName) return [forcedClassName];
    if (role !== "class_teacher") return [];
    if (Array.isArray(homeroomClasses) && homeroomClasses.length) return homeroomClasses;
    if (authClassName) return [authClassName];
    return [];
  }, [authClassName, forcedClassName, homeroomClasses, role]);

  const [viewMode, setViewMode] = useState<"class" | "subject">(
    initialMode ?? (role === "teacher" ? "subject" : "class")
  );

  useEffect(() => {
    if (initialMode) setViewMode(initialMode);
  }, [initialMode]);

  const canCreateTickets = role === "deputy" || (role === "class_teacher" && viewMode === "class");

  const classes = useMemo(() => {
    const set = new Set<string>();
    STUDENTS.forEach((s) => set.add(s.className));
    const arr = Array.from(set).sort();
    return arr;
  }, []);

  const [selectedClass, setSelectedClass] = useState<string | "all" | "my">(
    forcedClassName ? forcedClassName : role === "class_teacher" ? "my" : "all"
  );
  const [query, setQuery] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");

  useEffect(() => {
    if (forcedClassName) setSelectedClass(forcedClassName);
  }, [forcedClassName]);

  // In subject mode we require a subject
  useEffect(() => {
    if (viewMode === "subject" && !selectedSubject) {
      setSelectedSubject("MATH");
    }
  }, [selectedSubject, setSelectedSubject, viewMode]);

  const studentsWithComputedRisk = useMemo(() => {
    const q = query.trim().toLowerCase();
    const subj = selectedSubject;

    return STUDENTS.map((s) => {
      const baseScore = calculateRiskScore(s);
      const baseLevel = getRiskLevel(baseScore);
      const subjScore = subj ? calculateSubjectRiskScore(s, subj as any) : null;
      return {
        ...s,
        _riskScore: baseScore,
        _riskLevel: baseLevel,
        _subjectRiskScore: subjScore,
      };
    })
      .filter((s) => {
        if (selectedClass === "my") {
          if (myHomeroomClasses.length && !myHomeroomClasses.includes(s.className)) return false;
        } else if (selectedClass !== "all" && s.className !== selectedClass) return false;
        if (riskFilter !== "all" && s._riskLevel !== riskFilter) return false;
        if (q) {
          const name = s.fullName.toLowerCase();
          const cls = s.className.toLowerCase();
          if (!name.includes(q) && !cls.includes(q) && !s.id.toLowerCase().includes(q)) return false;
        }
        // "Candidates" are those with medium/high risk in class mode OR a non-zero risk score in subject mode
        if (viewMode === "class") return s._riskLevel === "medium" || s._riskLevel === "high";
        if (viewMode === "subject") return (s._subjectRiskScore ?? 0) >= 2;
        return false;
      })
      .sort((a, b) => {
        if (viewMode === "class") return b._riskScore - a._riskScore;
        return (b._subjectRiskScore ?? 0) - (a._subjectRiskScore ?? 0);
      });
  }, [query, riskFilter, selectedClass, selectedSubject, viewMode, myHomeroomClasses]);

  // ---------------- tickets ----------------
  const [ticketsTick, setTicketsTick] = useState(0);
  const allTickets = useMemo(() => loadRiskTickets(), [ticketsTick]);

  const studentById = useMemo(() => {
    const m = new Map<string, Student>();
    STUDENTS.forEach((s) => m.set(s.id, s as any));
    return m;
  }, []);

  const visibleTickets = useMemo(() => {
    if (role === "deputy") return allTickets;
    if (role === "teacher") {
      return allTickets.filter((t) => !!accountId && t.assigneeAccountId === accountId);
    }
    if (role === "class_teacher") {
      return allTickets.filter((t) => {
        if (!!accountId && t.assigneeAccountId === accountId) return true;
        const st = studentById.get(t.studentId) ?? null;
        return !!st?.className && myHomeroomClasses.includes(st.className);
      });
    }
    if (role === "psychologist") {
      return allTickets.filter((t) => t.assigneeAccountId === "psychologist");
    }
    return [];
  }, [accountId, allTickets, myHomeroomClasses, role, studentById]);

  // ticket filters
  const [ticketQuery, setTicketQuery] = useState<string>("");
  const [ticketType, setTicketType] = useState<ActionType | "all">("all");
  const [onlyMine, setOnlyMine] = useState<boolean>(role === "teacher" || role === "psychologist");
  const [needsWeekly, setNeedsWeekly] = useState<boolean>(false);

  useEffect(() => {
    // teachers/psychologist always see only their own tickets
    if (role === "teacher" || role === "psychologist") setOnlyMine(true);
  }, [role]);

  const filteredTickets = useMemo(() => {
    const q = ticketQuery.trim().toLowerCase();
    const base = visibleTickets
      .filter((t) => (ticketType === "all" ? true : t.type === ticketType))
      .filter((t) => {
        if (!onlyMine) return true;
        if (!accountId) return false;
        return t.assigneeAccountId === accountId;
      })
      .filter((t) => (needsWeekly ? ticketNeedsWeeklyReport(t) : true));

    if (!q) return base;
    return base.filter((t) => {
      const st = studentById.get(t.studentId) ?? null;
      const hay = `${t.id} ${t.description} ${t.assigneeName} ${t.type} ${st?.fullName ?? ""} ${st?.className ?? ""} ${st?.id ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [accountId, needsWeekly, onlyMine, studentById, ticketQuery, ticketType, visibleTickets]);

  const ticketsByStage = useMemo(() => {
    const map = new Map<TicketStage, RiskTicket[]>();
    STAGES.forEach((s) => map.set(s.key, []));
    filteredTickets.forEach((t) => {
      const arr = map.get(t.stage) ?? [];
      arr.push(t);
      map.set(t.stage, arr);
    });
    for (const [k, v] of map.entries()) {
      v.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
      map.set(k, v);
    }
    return map;
  }, [filteredTickets]);

  const refreshTickets = () => setTicketsTick((x) => x + 1);

  // ---------------- create ticket modal ----------------
  const [createStudentId, setCreateStudentId] = useState<string | null>(null);
  const [createType, setCreateType] = useState<ActionType>("TALK_STUDENT");
  const [createDesc, setCreateDesc] = useState<string>("");
  const [createDue, setCreateDue] = useState<string>("");
  const [pickedTeacherId, setPickedTeacherId] = useState<string>("");

  const createTeacherOptions = useMemo(() => {
    return ALL_DEMO_ACCOUNTS
      .filter((a) => a.role === "teacher" || a.role === "class_teacher")
      .map((a) => ({ id: a.id, label: `${a.fullName}${a.role === "class_teacher" ? " · классрук" : ""}` }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const handleOpenCreate = (studentId: string) => {
    setCreateStudentId(studentId);
    setCreateType("TALK_STUDENT");
    setCreateDesc("");
    setCreateDue("");
    setPickedTeacherId("");
  };

  const handleCreate = () => {
    if (!createStudentId) return;
    const student = studentById.get(createStudentId) ?? null;

    // assignment rules
    let assigneeAccountId: string | null = accountId ?? null;
    let assigneeName: string = displayName || "—";

    if (autoPsychologist(createType)) {
      assigneeAccountId = "psychologist";
      assigneeName = "Психолог";
    } else if (requiresHomeroomAssignee(createType)) {
      const homeroom = findHomeroomTeacherForClass(student?.className);
      assigneeAccountId = homeroom?.id ?? null;
      assigneeName = homeroom?.fullName ?? "Классрук не найден";
    } else if (requiresTeacherPick(createType)) {
      const found = createTeacherOptions.find((x) => x.id === pickedTeacherId);
      if (!found) {
        notify("Выберите учителя-предметника", "error");
        return;
      }
      assigneeAccountId = found.id;
      assigneeName = found.label;
    }

    createRiskTicket({
      studentId: createStudentId,
      type: createType,
      stage: "PROBLEM",
      assigneeAccountId,
      assigneeName,
      dueDate: createDue ? createDue : null,
      description: createDesc,
      createdByAccountId: accountId ?? null,
      createdByName: displayName || "—",
    });

    notify("Тикет создан", "success");
    setCreateStudentId(null);
    refreshTickets();
  };

  // ---------------- open ticket modal ----------------
  const [openedTicket, setOpenedTicket] = useState<RiskTicket | null>(null);

  const handleDrop = (stage: TicketStage, ticketId: string) => {
    const ticket = visibleTickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    if (ticket.stage === stage) return;

    const st = studentById.get(ticket.studentId) ?? null;
    if (!canMoveTicket(role ?? null, accountId ?? null, ticket, st, myHomeroomClasses)) {
      notify("Нет прав менять статус этого тикета", "error");
      return;
    }

    updateRiskTicket(ticket.id, { stage });
    refreshTickets();
  };

  const modeLabel = viewMode === "class" ? "По классу" : "По предмету";

  const [dragOverStage, setDragOverStage] = useState<TicketStage | null>(null);
  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
            {t("nav.risk")}
          </h1>
          <p className="text-sm text-slate-400">
            Канбан-доска контроля · {modeLabel}
            {myHomeroomClasses.length ? (
              <>
                · ваши классы: <span className="text-slate-200 font-medium">{myHomeroomClasses.join(", ")}</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(role === "deputy" || role === "teacher") && (
            <div className="flex rounded-2xl border border-slate-800 overflow-hidden">
              <button
                onClick={() => setViewMode("class")}
                className={`px-3 py-2 text-xs ${viewMode === "class" ? "bg-primary-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}
              >
                Класс
              </button>
              <button
                onClick={() => setViewMode("subject")}
                className={`px-3 py-2 text-xs ${viewMode === "subject" ? "bg-primary-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}
              >
                Предмет
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="ui-panel p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <p className="text-xs text-slate-400 mb-1">Класс</p>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value as any)}
            className="ui-select w-full"
            disabled={!!forcedClassName}
          >
            <option value="all">Все</option>
            {role === "class_teacher" && myHomeroomClasses.length > 0 && (
              <option value="my">Все мои ({myHomeroomClasses.join(", ")})</option>
            )}
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1">Поиск</p>
          <input
            className="ui-input w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ФИО / класс / ID"
          />
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1">Риск</p>
          <select
            className="ui-select w-full"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
          >
            <option value="all">Все</option>
            {(["high", "medium", "low", "none"] as RiskLevel[]).map((r) => (
              <option key={r} value={r}>
                {RISK_LEVEL_LABEL[r]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1">Предмет</p>
          <select
            className="ui-select w-full"
            value={selectedSubject ?? ""}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={viewMode !== "subject"}
          >
            <option value="">—</option>
            {[
              "MATH",
              "RUS",
              "KAZ",
              "ENG",
              "HIST",
              "PHYS",
              "CHEM",
              "BIO",
              "GEO",
              "CS",
            ].map((code) => (
              <option key={code} value={code}>
                {getSubjectByCode(code as any)?.nameRu ?? code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ticket filters */}
      <div className="ui-panel p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <p className="text-xs text-slate-400 mb-1">Поиск по тикетам</p>
          <input
            className="ui-input w-full"
            value={ticketQuery}
            onChange={(e) => setTicketQuery(e.target.value)}
            placeholder="ученик / класс / описание / поручено / #id"
          />
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1">Тип</p>
          <select className="ui-select w-full" value={ticketType} onChange={(e) => setTicketType(e.target.value as any)}>
            <option value="all">Все</option>
            {ACTION_TYPES.map((k) => (
              <option key={k} value={k}>
                {actionTypeLabel[k]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={onlyMine}
              disabled={role === "teacher" || role === "psychologist"}
              onChange={(e) => setOnlyMine(e.target.checked)}
            />
            Только мои
          </label>
        </div>

        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 select-none">
            <input type="checkbox" checked={needsWeekly} onChange={(e) => setNeedsWeekly(e.target.checked)} />
            Нужен отчёт
          </label>
        </div>

        <div className="md:col-span-5 text-[11px] text-slate-500">
          Показано тикетов: <span className="text-slate-200">{filteredTickets.length}</span> / {visibleTickets.length}
        </div>
      </div>

      {/* Candidates list */}
      <div className="ui-panel p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-50">Ученики с проблемами</h2>
            <p className="text-xs text-slate-400">
              Нажмите «Создать тикет», чтобы добавить карточку в Канбан.
            </p>
          </div>
          <div className="text-xs text-slate-500">Найдено: {studentsWithComputedRisk.length}</div>
        </div>

        <div className="flex gap-3 overflow-x-auto custom-scroll-thin pb-2">
          {studentsWithComputedRisk.slice(0, 30).map((s) => (
            <div key={s.id} className="min-w-[280px] rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-50">{s.fullName}</p>
                  <p className="text-xs text-slate-500">{s.className} · ID: {s.id}</p>
                </div>
                <button
                  onClick={() => onSelectStudent(s.id)}
                  className="ui-btn-ghost px-3 py-1.5 text-xs"
                >
                  Профиль
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  {viewMode === "class" ? (
                    <>Риск: <span className="text-slate-200">{RISK_LEVEL_LABEL[s._riskLevel]}</span> · score: {s._riskScore}</>
                  ) : (
                    <>Предмет: <span className="text-slate-200">{getSubjectByCode(selectedSubject as any)?.nameRu ?? selectedSubject}</span> · score: {s._subjectRiskScore ?? 0}</>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {canCreateTickets ? (
                  <button
                    onClick={() => handleOpenCreate(s.id)}
                    className="ui-btn-primary px-3 py-2 text-xs"
                  >
                    Создать тикет
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">Только завуч / классрук создают тикеты</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket filters */}
      <div className="ui-panel p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <p className="text-xs text-slate-400 mb-1">Поиск по тикетам</p>
          <input
            className="ui-input w-full"
            value={ticketQuery}
            onChange={(e) => setTicketQuery(e.target.value)}
            placeholder="Ученик / описание / поручение / #"
          />
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1">Тип контроля</p>
          <select
            className="ui-select w-full"
            value={ticketType}
            onChange={(e) => setTicketType(e.target.value as any)}
          >
            <option value="all">Все</option>
            {ACTION_TYPES.map((k) => (
              <option key={k} value={k}>
                {actionTypeLabel[k]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1">Показ</p>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              className="accent-primary-600"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
              disabled={role === "teacher" || role === "psychologist"}
            />
            Только мои
          </label>
          <p className="text-[11px] text-slate-500 mt-1">
            Всего: <span className="text-slate-200">{filteredTickets.length}</span>
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1">Отчёты</p>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              className="accent-primary-600"
              checked={needsWeekly}
              onChange={(e) => setNeedsWeekly(e.target.checked)}
            />
            Нужен отчёт на этой неделе
          </label>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {STAGES.map((col) => {
          const colTickets = ticketsByStage.get(col.key) ?? [];
          return (
            <div
              key={col.key}
              className={`ui-panel p-3 min-h-[320px] transition ${
                dragOverStage === col.key ? "ring-2 ring-primary-600/60" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(col.key);
              }}
              onDragLeave={() => {
                // avoid flicker: only clear if leaving current column
                setDragOverStage((prev) => (prev === col.key ? null : prev));
              }}
              onDrop={(e) => {
                e.preventDefault();
                const ticketId = e.dataTransfer.getData("text/plain");
                if (!ticketId) return;
                handleDrop(col.key, ticketId);
                setDragOverStage(null);
                setDraggingTicketId(null);
              }}
            >
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-50">{col.title}</h3>
                  <span className="text-xs text-slate-500">{colTickets.length}</span>
                </div>
                <p className="text-[11px] text-slate-500">{col.hint}</p>
              </div>

              <div className="space-y-2">
                {colTickets.map((ticket) => {
                  const st = studentById.get(ticket.studentId) ?? null;
                  const draggable = canMoveTicket(role ?? null, accountId ?? null, ticket, st, myHomeroomClasses);
                  const needsReport = ticketNeedsWeeklyReport(ticket);

                  return (
                    <div
                      key={ticket.id}
                      draggable={draggable}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", ticket.id);
                        setDraggingTicketId(ticket.id);
                      }}
                      onDragEnd={() => {
                        setDraggingTicketId(null);
                        setDragOverStage(null);
                      }}
                      onClick={() => setOpenedTicket(ticket)}
                      className={`rounded-3xl border border-slate-800/80 bg-slate-950/40 p-3 cursor-pointer hover:bg-slate-900/50 transition ${
                        draggable ? "" : "opacity-80"
                      } ${draggingTicketId === ticket.id ? "ring-2 ring-primary-600/50" : ""}`}
                      title={draggable ? "Можно перетаскивать" : "Нет прав перетаскивать"}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-50">
                            {st?.fullName ?? `ID: ${ticket.studentId}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {st?.className ?? "—"} · #{ticket.id.slice(-6)}
                          </p>
                        </div>
                        <span className="ui-chip border-slate-700/70 bg-slate-900/60 text-slate-200">
                          {ticketStageLabel[ticket.stage]}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-slate-300">
                        {actionTypeLabel[ticket.type]}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="text-xs text-slate-500 truncate">Поручено: {ticket.assigneeName || "—"}</div>
                        <div className="text-[10px] text-slate-600">{new Date(ticket.updatedAt).toLocaleDateString()}</div>
                      </div>

                      {needsReport && (
                        <div className="mt-2 text-[11px] text-amber-300/90">
                          Нужен мини-отчёт за неделю
                        </div>
                      )}

                      {draggingTicketId === ticket.id && (
                        <div className="mt-2 text-[11px] text-slate-500">Перетащите в нужную колонку…</div>
                      )}
                    </div>
                  );
                })}
                {colTickets.length === 0 && (
                  <div className="text-xs text-slate-600 text-center py-6">Пусто</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      {createStudentId && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="ui-panel w-full max-w-xl p-5 md:p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">Создать тикет</h2>
                <p className="text-sm text-slate-400">
                  {studentById.get(createStudentId)?.fullName ?? createStudentId} · {studentById.get(createStudentId)?.className ?? "—"}
                </p>
              </div>
              <button onClick={() => setCreateStudentId(null)} className="ui-btn-ghost rounded-full px-3 py-1.5 text-sm">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="ui-panel p-4">
                <p className="text-xs text-slate-400 mb-2">Тип контроля</p>
                <select
                  className="ui-select w-full"
                  value={createType}
                  onChange={(e) => {
                    const next = e.target.value as ActionType;
                    setCreateType(next);
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
              <div className="ui-panel p-4">
                <p className="text-xs text-slate-400 mb-2">Дедлайн (необязательно)</p>
                <input
                  type="datetime-local"
                  value={createDue}
                  onChange={(e) => setCreateDue(e.target.value)}
                  className="ui-input w-full"
                />
              </div>
            </div>

            {requiresTeacherPick(createType) && (
              <div className="ui-panel p-4">
                <p className="text-xs text-slate-400 mb-2">Поручить предметнику</p>
                <select
                  className="ui-select w-full"
                  value={pickedTeacherId}
                  onChange={(e) => setPickedTeacherId(e.target.value)}
                >
                  <option value="">— выбрать учителя —</option>
                  {createTeacherOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {requiresHomeroomAssignee(createType) && (
              <div className="ui-panel p-4">
                <p className="text-xs text-slate-400">Авто-поручение</p>
                <p className="text-sm text-slate-200">
                  Классному руководителю: {findHomeroomTeacherForClass(studentById.get(createStudentId)?.className)?.fullName ?? "Классрук не найден"}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Для «Связаться с родителями» и «Поручение классруку» выбор не нужен.
                </p>
              </div>
            )}

            {autoPsychologist(createType) && (
              <div className="ui-panel p-4">
                <p className="text-xs text-slate-400">Авто-направление</p>
                <p className="text-sm text-slate-200">Психологу</p>
              </div>
            )}

            <div className="ui-panel p-4">
              <p className="text-xs text-slate-400 mb-2">Описание / цель</p>
              <textarea
                className="ui-textarea w-full"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Коротко: что не так и какой ожидаемый результат…"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setCreateStudentId(null)} className="ui-btn-secondary">
                Отмена
              </button>
              <button onClick={handleCreate} className="ui-btn-primary">
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {openedTicket && (
        <RiskTicketModal
          ticket={openedTicket}
          student={studentById.get(openedTicket.studentId) ?? null}
          currentUser={{
            accountId: accountId ?? null,
            displayName: displayName || "—",
            role: role ?? null,
          }}
          canEdit={canMoveTicket(
            role ?? null,
            accountId ?? null,
            openedTicket,
            studentById.get(openedTicket.studentId) ?? null,
            myHomeroomClasses
          )}
          
          onClose={() => setOpenedTicket(null)}
          onChanged={refreshTickets}
        />
      )}
    </div>
  );
};
