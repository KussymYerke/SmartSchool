// src/pages/TeacherDashboardPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { STUDENTS } from "../data/students";
import { getSubjectByCode, VISIBLE_SUBJECTS } from "../data/subjects";
import { getSubjectGrade } from "../utils/subjectGrades";
import { loadRiskTickets, type RiskTicket } from "../data/riskTickets";
import { RiskTicketsTable } from "../components/risk/RiskTicketsTable";
import { RiskTicketModal } from "../components/risk/RiskTicketModal";

type Props = {
  onOpenStudent: (id: string) => void;
};

// Teacher view: only own classes + only own subjects
export const TeacherDashboardPage: React.FC<Props> = ({ onOpenStudent }) => {
  const {
    resetAuth,
    accountId,
    role,
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

  const allowedClasses = useMemo(() => {
    const unique = Array.from(new Set(teachingClasses)).filter(Boolean);
    // Stable sorting: by grade number, then letter
    return unique.sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (na !== nb) return na - nb;
      return a.localeCompare(b);
    });
  }, [teachingClasses]);

  const allowedSubjects = useMemo(() => {
    const set = new Set<string>(Array.isArray(subjects) ? subjects : []);
    // keep only visible subjects to avoid broken codes
    const vis = VISIBLE_SUBJECTS.map((s) => String(s.code));
    const filtered = Array.from(set).filter((c) => vis.includes(String(c)));
    return filtered.length ? filtered : [VISIBLE_SUBJECTS[0]?.code].filter(Boolean);
  }, [subjects]);

  const effectiveSubject = (selectedSubject && allowedSubjects.includes(selectedSubject))
    ? selectedSubject
    : (allowedSubjects[0] ?? null);

  // ensure selectedSubject always valid
  useEffect(() => {
    if (effectiveSubject && effectiveSubject !== selectedSubject) {
      setSelectedSubject(effectiveSubject);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSubject]);

  const [selectedClass, setSelectedClass] = useState<string | null>(allowedClasses[0] ?? null);

  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return STUDENTS.filter((s) => s.className === selectedClass);
  }, [selectedClass]);

  const [query, setQuery] = useState<string>("");
  const [onlyProblems, setOnlyProblems] = useState<boolean>(false);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return classStudents
      .filter((s) => {
        if (!q) return true;
        return (
          s.fullName.toLowerCase().includes(q) ||
          String(s.id).toLowerCase().includes(q)
        );
      })
      .filter((s) => {
        if (!onlyProblems) return true;
        const grade = effectiveSubject
          ? getSubjectGrade(s, effectiveSubject as any)
          : s.avgGrade;
        const explicitRisk = Array.isArray(s.subjectsAtRisk)
          ? s.subjectsAtRisk.includes(String(effectiveSubject))
          : false;
        return explicitRisk || grade < 3.5;
      });
  }, [classStudents, query, onlyProblems, effectiveSubject]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
            Панель учителя
          </h1>
          <p className="text-sm text-slate-400">
            {displayName ? <span className="text-slate-200 font-medium">{displayName}</span> : ""}
            {""}
            {allowedClasses.length ? (
              <> · Классы: {allowedClasses.join(", ")}</>
            ) : (
              <> · Нет назначенных классов (проверьте accounts.ts)</>
            )}
          </p>
        </div>

        <button onClick={resetAuth} className="ui-btn-secondary rounded-full px-3 py-1.5 text-xs">
          Выйти
        </button>
      </header>

      {/* Subject selector */}
      <div className="ui-panel p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-slate-400">Пән / Предмет</p>
          <select
            value={effectiveSubject ?? ""}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="ui-select w-full"
          >
            {allowedSubjects.map((code) => {
              const subj = getSubjectByCode(code as any);
              return (
                <option key={code} value={code}>
                  {subj?.nameRu ?? code}
                </option>
              );
            })}
          </select>
        </div>

        {/* Class selector */}
        <div className="flex-1">
          <p className="text-xs text-slate-400">Сынып / Класс</p>
          <select
            value={selectedClass ?? ""}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="ui-select w-full"
          >
            {allowedClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* My assigned risk tickets */}
      <RiskTicketsTable
        title="Мои тикеты (группа риска)"
        tickets={myTickets}
        onOpenTicket={(t) => setOpenedTicket(t)}
        onOpenStudent={onOpenStudent}
      />

      {/* Students table (subject grades only) */}
      <div className="ui-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/70">
          <h3 className="text-sm font-semibold text-slate-50">Оценки по предмету</h3>
          <p className="text-xs text-slate-400">
            {selectedClass ?? "—"} · {getSubjectByCode(effectiveSubject ?? undefined)?.nameRu ?? ""}
          </p>

          <div className="mt-3 flex flex-col md:flex-row md:items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск ученика (ФИО или ID)…"
              className="ui-input w-full md:w-80"
            />
            <label className="flex items-center gap-2 text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={onlyProblems}
                onChange={(e) => setOnlyProblems(e.target.checked)}
              />
              Показать только проблемных
            </label>
            <div className="md:ml-auto text-xs text-slate-500">
              Показано: {filteredStudents.length}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredStudents.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-400 text-center">
              Нет учеников или класс не выбран.
            </div>
          )}

          {filteredStudents.map((s) => {
            const grade = effectiveSubject ? getSubjectGrade(s, effectiveSubject as any) : s.avgGrade;
            return (
              <button
                key={s.id}
                onClick={() => onOpenStudent(s.id)}
                className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-900/60 transition"
              >
                <div>
                  <p className="text-sm font-medium text-slate-50">{s.fullName}</p>
                  <p className="text-xs text-slate-500">ID: {s.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-50">{grade.toFixed(1)}</p>
                  <p className="text-[10px] text-slate-500">из 5.0</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
