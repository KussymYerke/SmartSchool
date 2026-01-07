// src/pages/ClassTeacherDashboardPage.tsx
import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { STUDENTS } from "../data/students";
import { VISIBLE_SUBJECTS, getSubjectByCode } from "../data/subjects";
import { calculateRiskScore, getRiskLevel } from "../data/riskUtils";
import { calculateSubjectRiskScore, getSubjectGrade } from "../utils/subjectGrades";
import { isSubjectInRisk } from "../utils/subjects";
import { ClassProfilePage } from "./ClassProfilePage";
import { loadRiskTickets, type RiskTicket } from "../data/riskTickets";
import { RiskTicketsTable } from "../components/risk/RiskTicketsTable";
import { RiskTicketModal } from "../components/risk/RiskTicketModal";

type Props = {
  onOpenRisk: (mode: "class" | "subject") => void;
  onOpenStudent: (id: string) => void;
};

export const ClassTeacherDashboardPage: React.FC<Props> = ({ onOpenRisk, onOpenStudent }) => {
  const {
    resetAuth,
    accountId,
    role,
    className,
    homeroomClasses = [],
    teachingClasses = [],
    subjects = [],
    selectedSubject,
    setSelectedSubject,
    displayName,
  } = useAuth();

  // ---------------- My risk tickets (assigned to me) ----------------
  const [ticketsTick, setTicketsTick] = useState(0);
  const myTickets = useMemo<RiskTicket[]>(
    () => loadRiskTickets().filter((t) => !!accountId && t.assigneeAccountId === accountId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ticketsTick, accountId]
  );
  const [openedTicket, setOpenedTicket] = useState<RiskTicket | null>(null);
  const [tab, setTab] = useState<"class" | "subject">("class");
  const [activeHomeroom, setActiveHomeroom] = useState<string | null>(className ?? homeroomClasses[0] ?? null);
  const [subjectQuery, setSubjectQuery] = useState<string>("");
  const [subjectOnlySerious, setSubjectOnlySerious] = useState<boolean>(true);
  const [subjectShowAll, setSubjectShowAll] = useState<boolean>(false);

  // keep local activeHomeroom in sync with auth className
  React.useEffect(() => {
    if (className && className !== activeHomeroom) setActiveHomeroom(className);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className]);

  const effectiveClass = (activeHomeroom ?? className ?? "");

  const allowedSubjects = useMemo(() => {
    const vis = new Set(VISIBLE_SUBJECTS.map((s) => String(s.code)));
    const list = (Array.isArray(subjects) ? subjects : []).filter((c) => vis.has(String(c)));
    return list.length ? list : [VISIBLE_SUBJECTS[0]?.code].filter(Boolean);
  }, [subjects]);

  const subjectCode = (selectedSubject && allowedSubjects.includes(selectedSubject))
    ? selectedSubject
    : (allowedSubjects[0] ?? null);

  React.useEffect(() => {
    if (subjectCode && subjectCode !== selectedSubject) setSelectedSubject(subjectCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectCode]);

  const classStudents = useMemo(
    () => STUDENTS.filter((s) => (effectiveClass ? s.className === effectiveClass : true)),
    [effectiveClass]
  );

  const classRiskCount = useMemo(() => {
    if (!effectiveClass) return 0;
    return classStudents.filter((s) => getRiskLevel(calculateRiskScore(s)) !== "none").length;
  }, [classStudents, effectiveClass]);

  const subjectStudentsScope = useMemo(() => {
    const allowed = new Set<string>(Array.isArray(teachingClasses) ? teachingClasses : []);
    if (allowed.size === 0) return [];
    return STUDENTS.filter((s) => allowed.has(s.className));
  }, [teachingClasses]);

  const subjectRiskStudents = useMemo(() => {
    if (!subjectCode) return [];

    const q = subjectQuery.trim().toLowerCase();

    const rows = subjectStudentsScope
      .map((s) => {
        const subjScore = calculateSubjectRiskScore(s, subjectCode);
        const lvl = getRiskLevel(subjScore);
        const grade = getSubjectGrade(s, subjectCode);
        return {
          ...s,
          _subjectGrade: grade,
          _subjectRiskScore: subjScore,
          _subjectRiskLevel: lvl,
          _subjectExplicitRisk: isSubjectInRisk(s.subjectsAtRisk, subjectCode),
        };
      })
      .filter((s) => {
        if (q) {
          const idMatch = String(s.id).toLowerCase().includes(q);
          const nameMatch = String(s.fullName).toLowerCase().includes(q);
          const classMatch = String(s.className).toLowerCase().includes(q);
          if (!idMatch && !nameMatch && !classMatch) return false;
        }
        if (subjectOnlySerious) {
          return s._subjectRiskLevel === "high" || s._subjectRiskLevel === "medium";
        }
        return s._subjectRiskLevel !== "none";
      })
      .sort((a, b) => b._subjectRiskScore - a._subjectRiskScore)
      ;

    return subjectShowAll ? rows : rows.slice(0, 10);
  }, [subjectStudentsScope, subjectCode, subjectQuery, subjectOnlySerious, subjectShowAll]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
            Панель классрука
          </h1>
          <p className="text-sm text-slate-400">
            {displayName ? <span className="text-slate-200 font-medium">{displayName}</span> : null}
            {effectiveClass ? (
              <>
                Класс: <span className="text-slate-200 font-medium">{effectiveClass}</span> · Риск-оқушылар: {classRiskCount}
              </>
            ) : (
              "Выберите класс при входе в роль «Классный руководитель»."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenRisk(tab === "class" ? "class" : "subject")}
            className="ui-btn-primary rounded-full px-3 py-1.5 text-xs"
          >
            Открыть риски
          </button>
          <button
            onClick={() => resetAuth()}
            className="ui-btn-secondary rounded-full px-3 py-1.5 text-xs"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* My assigned risk tickets */}
      <RiskTicketsTable
        title="Мои тикеты (контроль учеников)"
        tickets={myTickets}
        onOpenTicket={(t) => setOpenedTicket(t)}
        onOpenStudent={onOpenStudent}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab("class")}
          className={"ui-tab " + (tab === "class" ? "ui-tab-active" : "ui-tab-inactive")}
        >
          Сынып / Класс
        </button>
        <button
          onClick={() => setTab("subject")}
          className={"ui-tab " + (tab === "subject" ? "ui-tab-active" : "ui-tab-inactive")}
        >
          Мой предмет
        </button>
      </div>

      {tab === "class" ? (
        <div className="space-y-4">
          {homeroomClasses.length > 1 && (
            <div className="ui-panel p-4">
              <p className="text-xs text-slate-400 mb-2">Выбор класса руководства</p>
              <div className="flex flex-wrap gap-2">
                {homeroomClasses.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setActiveHomeroom(cls)}
                    className={
                      "ui-btn-secondary rounded-full px-4 py-2 text-sm " +
                      (activeHomeroom === cls ? "ui-btn-primary" : "")
                    }
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>
          )}
          {effectiveClass ? (
            <ClassProfilePage className={effectiveClass} showBack={false} onOpenStudent={onOpenStudent} />
          ) : (
            <div className="ui-panel p-5 text-sm text-slate-300">
              Класс не выбран. Перезайдите через выбор роли и выберите класс.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="ui-panel p-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-400">Пән / Предмет</p>
              <select
                value={subjectCode ?? ""}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="ui-select w-full"
              >
                {allowedSubjects.map((code) => (
                  <option key={code} value={code}>
                    {getSubjectByCode(code as any)?.nameRu ?? code}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <p className="text-xs text-slate-400">Фильтр</p>
              <input
                value={subjectQuery}
                onChange={(e) => setSubjectQuery(e.target.value)}
                placeholder="Поиск: ФИО, ID или класс…"
                className="ui-input w-full"
              />
            </div>

            <div className="flex items-center justify-between md:justify-end gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={subjectOnlySerious}
                  onChange={(e) => setSubjectOnlySerious(e.target.checked)}
                />
                Только средний/высокий риск
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={subjectShowAll}
                  onChange={(e) => setSubjectShowAll(e.target.checked)}
                />
                Показать всех
              </label>
              <button
                onClick={() => onOpenRisk("subject")}
                className="ui-btn-primary rounded-full px-4 py-2 text-sm"
              >
                Смотреть риски по предмету
              </button>
            </div>
          </div>

          <div className="ui-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/70">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-50">Топ проблем по предмету</h3>
                  <p className="text-xs text-slate-400">
                    Все мои классы · {getSubjectByCode((subjectCode ?? undefined) as any)?.nameRu ?? ""}
                    
                  </p>
                </div>
                <div className="text-xs text-slate-400">Показываем до 10 учеников</div>
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {subjectRiskStudents.length === 0 && (
                <div className="px-4 py-6 text-sm text-slate-400 text-center">
                  Нет явных рисков по этому предмету в ваших классах.
                </div>
              )}

              {subjectRiskStudents.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onOpenStudent(s.id)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-50">{s.fullName}</p>
                      <p className="text-xs text-slate-400">
                        <span className="text-slate-300">{s.className}</span>
                        {s._subjectExplicitRisk ? " · В списке трудных тем" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-50">
                          {s._subjectGrade.toFixed(1)}
                        </p>
                        <p className="text-[10px] text-slate-500">из 5.0</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200">
                        score: {s._subjectRiskScore}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {openedTicket && (
        <RiskTicketModal
          ticket={openedTicket}
          student={STUDENTS.find((s) => s.id === openedTicket.studentId) ?? null}
          currentUser={{ accountId: accountId ?? null, displayName: displayName || "—", role: role ?? null }}
          canEdit={openedTicket.assigneeAccountId === (accountId ?? null) || role === "deputy"}
          onClose={() => setOpenedTicket(null)}
          onChanged={() => setTicketsTick((x) => x + 1)}
        />
      )}
    </div>
  );
};
