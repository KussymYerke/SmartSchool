// src/pages/DeputyDashboardPage.tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { STUDENTS } from "../data/students";
import { createPortal } from "react-dom";

import {
  calculateRiskScore,
  getRiskLevel,
  getRiskReasons,
  getPsychSignals,
  getRoleRecommendations,
  type RiskLevel,
  type Student,
} from "../data/riskUtils";
import {
  getOverdueActions,
  isActionActive,
  loadActions,
  type StudentAction,
} from "../data/actions";

type DeputyDashboardPageProps = {
  onOpenStudent?: (studentId: string) => void;
  onOpenRisk?: () => void;
};

type PsychReferral = {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  reasonType: string;
  urgency: "low" | "medium" | "high";
  comment: string;
  createdAt: string;
};

type StudentWithRisk = Student & {
  riskScore?: number;
  riskLevel?: RiskLevel;
};

type LessonGrade = {
  subject: string;
  topic: string;
  grade: number;
  type: "күнделікті" | "БЖБ" | "ТЖБ";
  date: string;
};

// генерим демо-оценки на основе среднего балла
function buildDemoLessonGrades(student: Student): LessonGrade[] {
  const base = Math.max(2, Math.min(5, student.avgGrade));
  const clamp = (g: number) => Math.max(2, Math.min(5, Number(g.toFixed(1))));

  return [
    {
      subject: "Математика",
      topic: "Квадрат теңдеулер",
      grade: clamp(base + 0.3),
      type: "күнделікті",
      date: "12.11",
    },
    {
      subject: "Қазақ тілі",
      topic: "Мәтінмен жұмыс",
      grade: clamp(base),
      type: "күнделікті",
      date: "13.11",
    },
    {
      subject: "Ағылшын тілі",
      topic: "Reading & Vocabulary",
      grade: clamp(base - 0.2),
      type: "күнделікті",
      date: "14.11",
    },
    {
      subject: "Математика",
      topic: "БЖБ (2-тоқсан)",
      grade: clamp(base - 0.4),
      type: "БЖБ",
      date: "18.11",
    },
    {
      subject: "Информатика",
      topic: "Алгоритмдер",
      grade: clamp(base + 0.1),
      type: "күнделікті",
      date: "19.11",
    },
  ];
}

export const DeputyDashboardPage: React.FC<DeputyDashboardPageProps> = ({
  onOpenStudent,
  onOpenRisk,
}) => {
  const { setRole } = useAuth();

  const [globalQuery, setGlobalQuery] = useState<string>("");
  const searchResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return STUDENTS.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [globalQuery]);

  const [profileStudent, setProfileStudent] = useState<StudentWithRisk | null>(
    null
  );
  const [psychModalStudent, setPsychModalStudent] =
    useState<StudentWithRisk | null>(null);

  // уже направленные к психологу (id учеников)
  // const [referredStudentIds, setReferredStudentIds] = useState<string[]>(() => {
  //   if (typeof window === "undefined") return [];
  //   try {
  //     const raw = localStorage.getItem("psych_referrals");
  //     if (!raw) return [];
  //     const arr: PsychReferral[] = JSON.parse(raw);
  //     return Array.isArray(arr) ? arr.map((r) => r.studentId) : [];
  //   } catch {
  //     return [];
  //   }
  // });

  // функция сохранения заявки в localStorage + стейт
  const handleReferralSaved = (ref: PsychReferral) => {
    // setReferredStudentIds((prev) =>
    //   prev.includes(ref.studentId) ? prev : [...prev, ref.studentId]
    // );

    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem("psych_referrals");
      const arr: PsychReferral[] = raw ? JSON.parse(raw) : [];
      arr.push(ref);
      localStorage.setItem("psych_referrals", JSON.stringify(arr));
    } catch (e) {
      console.error("Failed to save referral to localStorage", e);
    }
  };

  /* -------------------- Control actions summary -------------------- */
  const [actionsTick, setActionsTick] = useState(0);
  const actions = useMemo<StudentAction[]>(
    () => loadActions(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actionsTick]
  );
  const activeActions = useMemo(
    () => actions.filter(isActionActive),
    [actions]
  );
  const overdueActions = useMemo(() => getOverdueActions(), [actionsTick]);
  const controlStudentsCount = useMemo(
    () => new Set(activeActions.map((a) => a.studentId)).size,
    [activeActions]
  );

  // ------- Агрегированная статистика по школе -------
  const stats = useMemo(() => {
    const totalStudents = STUDENTS.length;

    const classSet = new Set(STUDENTS.map((s) => s.className));
    const totalClasses = classSet.size;

    const boys = STUDENTS.filter((s) => s.gender === "male").length;
    const girls = STUDENTS.filter((s) => s.gender === "female").length;

    const totalAvgGrade =
      totalStudents === 0
        ? 0
        : STUDENTS.reduce((sum, s) => sum + s.avgGrade, 0) / totalStudents;

    const totalAbsences = STUDENTS.reduce((sum, s) => sum + s.absences, 0);
    const totalUnexcused = STUDENTS.reduce(
      (sum, s) => sum + s.unexcusedAbsences,
      0
    );
    const excusedAbsences = Math.max(totalAbsences - totalUnexcused, 0);

    // риск-метрики (DEMO-TUNING):
    // 1) В презентационном режиме "тәуекел" считаем только medium/high
    // 2) Некоторым ученикам слегка улучшаем тренд (не всем), чтобы графики выглядели реалистично
    const hash = (v: string) =>
      Array.from(v).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);

    const withRisk: StudentWithRisk[] = STUDENTS.map((s) => {
      const h = hash(s.id);
      const shouldBoostTrend = s.gradeTrend < 0 && h % 5 === 0; // ~20% негативных трендов улучшаем
      const boostedTrend = shouldBoostTrend
        ? Math.min(s.gradeTrend + 0.35, 0.6)
        : s.gradeTrend;

      const tunedStudent = { ...s, gradeTrend: boostedTrend };
      const score = calculateRiskScore(tunedStudent as any);
      const level = getRiskLevel(score);
      return {
        ...tunedStudent,
        riskScore: score,
        riskLevel: level as RiskLevel,
      };
    });

    const highRisk = withRisk.filter((s) => s.riskLevel === "high").length;
    const mediumRisk = withRisk.filter((s) => s.riskLevel === "medium").length;
    const lowRisk = withRisk.filter((s) => s.riskLevel === "low").length;
    const riskStudentsCount = highRisk + mediumRisk;

    // "heatmap" по классам: сколько риска в каждом
    const riskByClass: {
      className: string;
      total: number;
      high: number;
      medium: number;
      low: number;
    }[] = [];

    classSet.forEach((cls) => {
      const inClass = withRisk.filter((s) => s.className === cls);

      // Для карты «тәуекел» считаем только medium/high как основную группу риска.
      // Low оставляем как «на бақылауда» и показываем отдельно.
      const high = inClass.filter((s) => s.riskLevel === "high").length;
      const medium = inClass.filter((s) => s.riskLevel === "medium").length;
      const low = inClass.filter((s) => s.riskLevel === "low").length;

      riskByClass.push({
        className: cls,
        total: high + medium,
        high,
        medium,
        low,
      });
    });

    riskByClass.sort((a, b) => b.total - a.total);

    // Психо-сигналдары бар оқушылар саны
    const psychSignalsCount = STUDENTS.filter((s) => {
      const signals = getPsychSignals(s as any);
      return (
        signals.length > 0 &&
        signals[0] !==
          "Қазіргі уақытта айқын психологиялық сигналдар тіркелмеген."
      );
    }).length;

    // Фокус-оқушылар (жоғары + орташа, топ-5)
    const focusStudents = [...withRisk]
      .filter((s) => s.riskLevel === "high" || s.riskLevel === "medium")
      .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
      .slice(0, 5);

    return {
      totalStudents,
      totalClasses,
      boys,
      girls,
      totalAvgGrade,
      totalAbsences,
      totalUnexcused,
      excusedAbsences,
      riskStudentsCount,
      highRisk,
      mediumRisk,
      lowRisk,
      riskByClass,
      psychSignalsCount,
      focusStudents,
    };
  }, []);

  // Цвета для круговых диаграмм
  const ABSENCE_COLORS = ["#f97373", "#38bdf8"];
  const STUDENT_COLORS = ["#60a5fa", "#f472b6"];
  const GRADE_COLORS = ["#22c55e", "#1e293b"]; // Норм / қалған бөлігі

  // Данные для верхних кругов
  const studentsPieData = [
    { name: "Ұл", value: stats.boys },
    { name: "Қыз", value: stats.girls },
  ];

  const gradePercent = Number(
    Math.max(0, Math.min((stats.totalAvgGrade / 5) * 100, 100)).toFixed(2)
  );

  const gradePieData = [
    { name: "Орташа үлгерім", value: gradePercent },
    { name: "Қалған бөлігі", value: 100 - gradePercent },
  ];

  const absencesPieData = [
    { name: "Себепсіз", value: stats.totalUnexcused },
    { name: "Себепті", value: stats.excusedAbsences },
  ];

  // const visibleFocusStudents = stats.focusStudents.filter(
  //   (s) => !referredStudentIds.includes(s.id)
  // );

  const anchorRef = React.useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = React.useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  React.useEffect(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left, width: r.width });
  }, [globalQuery, searchResults.length]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="ui-panel p-4 md:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
              Панель завуча
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1">
              Негізгі мектеп көрінісі: оқушылар, үлгерім, тәуекел топтары және
              бақылау әрекеттері.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div ref={anchorRef} className="relative w-full sm:w-[320px]">
              <input
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                className="w-full ui-input"
                placeholder="Оқушыны іздеу: аты немесе сынып"
              />
              {searchResults.length > 0 &&
                createPortal(
                  <div
                    style={{ top: pos.top, left: pos.left, width: pos.width }}
                    className="fixed z-[9999] ui-panel p-2"
                  >
                    {searchResults.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setGlobalQuery("");
                          onOpenStudent?.(s.id);
                        }}
                        className="w-full text-left rounded-2xl px-3 py-2 hover:bg-slate-800/70 transition"
                      >
                        <div className="text-sm font-medium text-slate-50">
                          {s.fullName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {s.className} · Орта баға: {s.avgGrade.toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
            </div>

            <div className="flex items-center gap-2">
              {onOpenRisk && (
                <button onClick={onOpenRisk} className="ui-btn-primary">
                  Риски
                </button>
              )}
              <button
                onClick={() => setRole(null)}
                className="ui-btn-secondary"
              >
                Рөлді ауыстыру
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTROL summary */}
      <section className="ui-panel p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Контроль
            </p>
            <p className="text-sm text-slate-200 mt-1">
              Учеников на контроле:{" "}
              <span className="font-semibold text-slate-50">
                {controlStudentsCount}
              </span>
              <span className="text-slate-400">
                {" "}
                · активных действий: {activeActions.length}
              </span>
              <span className="text-slate-400">
                {" "}
                · просрочено: {overdueActions.length}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActionsTick((x) => x + 1)}
              className="ui-btn-secondary"
            >
              ↻ Обновить
            </button>
          </div>
        </div>

        {overdueActions.length > 0 && (
          <div className="mt-4 rounded-2xl bg-slate-900/60 border border-rose-500/30 p-3">
            <p className="text-xs font-semibold text-rose-200 mb-2">
              Просроченные действия (топ-5)
            </p>

            <div className="space-y-2">
              {overdueActions.slice(0, 5).map((a) => {
                const st = STUDENTS.find((s) => s.id === a.studentId);
                return (
                  <button
                    key={a.id}
                    onClick={() => onOpenStudent?.(a.studentId)}
                    className="w-full text-left rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-950/60 transition p-3"
                  >
                    <p className="text-sm font-medium text-slate-50">
                      {st?.fullName ?? "Ученик"} · {a.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Срок: <span className="text-rose-200">{a.dueDate}</span> ·
                      Кому: {a.assignee}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="ui-panel p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
              Оқушылар
            </p>
            <p className="text-2xl font-semibold">
              {stats.totalStudents}
              <span className="text-xs text-slate-400 ml-1">
                · {stats.totalClasses} сынып
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {stats.boys} ұл · {stats.girls} қыз
            </p>
          </div>

          <div className="w-24 h-24 overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={studentsPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={26}
                  outerRadius={38}
                  paddingAngle={2}
                >
                  {studentsPieData.map((entry, index) => (
                    <Cell
                      key={`students-cell-${entry.name}-${index}`}
                      fill={STUDENT_COLORS[index % STUDENT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{
                    zIndex: 9999,
                  }}
                  contentStyle={{
                    backgroundColor: "#020617",
                    border: "1px solid #1f2937",
                    borderRadius: "0.75rem",
                    fontSize: 11,
                    color: "#e5e7eb",
                  }}
                  itemStyle={{
                    color: "#e5e7eb",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Орташа үлгерім круг */}
        <div className="ui-panel p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
              Орташа үлгерім
            </p>
            <p className="text-2xl font-semibold">
              {stats.totalAvgGrade.toFixed(2)}
              <span className="text-sm text-slate-400"> / 5.0</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Барлық сыныптар және пәндер бойынша орташа балл.
            </p>
          </div>

          <div className="w-24 h-24 overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradePieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={26}
                  outerRadius={38}
                  paddingAngle={2}
                >
                  {gradePieData.map((entry, index) => (
                    <Cell
                      key={`grade-cell-${entry.name}-${index}`}
                      fill={GRADE_COLORS[index % GRADE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{
                    zIndex: 9999,
                  }}
                  contentStyle={{
                    backgroundColor: "#020617",
                    border: "1px solid #1f2937",
                    borderRadius: "0.75rem",
                    fontSize: 11,
                    color: "#e5e7eb",
                  }}
                  itemStyle={{
                    color: "#e5e7eb",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Қатысу (қысқаша) */}
        <div className="ui-panel p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
              Қатысу
            </p>
            <p className="text-2xl font-semibold">
              {stats.totalAbsences}
              <span className="text-sm text-slate-400 ml-1">қатыспау</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Барлығы қатыспау:{" "}
              <span className="text-slate-200 font-semibold">
                {stats.totalAbsences}
              </span>{" "}
              · себепсіз:{" "}
              <span className="text-red-200 font-semibold">
                {stats.totalUnexcused}
              </span>
            </p>
          </div>

          <div className="w-24 h-24 overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={absencesPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={26}
                  outerRadius={38}
                  paddingAngle={2}
                >
                  {absencesPieData.map((entry, index) => (
                    <Cell
                      key={`absence-top-cell-${entry.name}-${index}`}
                      fill={ABSENCE_COLORS[index % ABSENCE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ zIndex: 9999 }}
                  contentStyle={{
                    backgroundColor: "#020617",
                    border: "1px solid #1f2937",
                    borderRadius: "0.75rem",
                    fontSize: 11,
                    color: "#e5e7eb",
                  }}
                  itemStyle={{ color: "#e5e7eb" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* СРЕДНЯЯ ЗОНА: КАРТА РИСКА */}
      <section className="grid grid-cols-1 gap-4">
        {/* LEFT: Heatmap по классам */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
          <div className="flex items-center justify-between mb-2 gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">
                Жалпы тәуекел картасы (сыныптар)
              </h2>
              <span className="text-[11px] text-slate-400">
                · Барлығы:{" "}
                <span className="text-slate-200 font-semibold">
                  {stats.riskStudentsCount}
                </span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              🟥 жоғары · 🟨 орташа · 🟩 төмен
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Қай сыныптарда тәуекел көп, қай жерде жағдай тұрақты екенін бір
            қарағанда көруге болады.
          </p>

          <div className="space-y-2 text-xs">
            {stats.riskByClass.length === 0 && (
              <p className="text-slate-500">
                Қауіп тобындағы оқушылар әлі анықталмаған.
              </p>
            )}

            {stats.riskByClass.map((row) => (
              <div
                key={row.className}
                className="flex items-center gap-3 rounded-2xl bg-slate-900/80 border border-slate-800 px-3 py-2"
              >
                <div className="w-14 text-[11px] text-slate-300 font-medium">
                  {row.className}
                </div>

                <div className="flex-1">
                  {/* Линия рисков */}
                  <div className="flex items-center gap-1 mb-1">
                    <div
                      className={`h-1.5 rounded-full ${
                        row.high > 0 ? "bg-red-500" : "bg-slate-800"
                      }`}
                      style={{ flexGrow: row.high, flexBasis: 0 }}
                    />
                    <div
                      className={`h-1.5 rounded-full ${
                        row.medium > 0 ? "bg-amber-400" : "bg-slate-800"
                      }`}
                      style={{ flexGrow: row.medium, flexBasis: 0 }}
                    />
                    <div
                      className={`h-1.5 rounded-full ${
                        row.low > 0 ? "bg-emerald-400" : "bg-slate-800"
                      }`}
                      style={{ flexGrow: row.low, flexBasis: 0 }}
                    />
                  </div>

                  <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                    <span>Барлығы: {row.total}</span>
                    <span className="text-red-300">Жоғары: {row.high}</span>
                    <span className="text-amber-300">Орташа: {row.medium}</span>
                    <span className="text-emerald-300">Төмен: {row.low}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/*  */}

      {/* Профиль — модальное окно в центре */}
      {profileStudent && (
        <StudentProfileModal
          student={profileStudent}
          onClose={() => setProfileStudent(null)}
        />
      )}

      {/* Модалка записи к психологу */}
      {psychModalStudent && (
        <PsychReferralModal
          student={psychModalStudent}
          onClose={() => setPsychModalStudent(null)}
          onSaved={handleReferralSaved}
        />
      )}
    </div>
  );
};

// ---------- Профиль ученика (центральное модальное окно) ----------
const StudentProfileModal: React.FC<{
  student: StudentWithRisk;
  onClose: () => void;
}> = ({ student, onClose }) => {
  const psychSignals = getPsychSignals(student as Student);
  const reasons = getRiskReasons(student as Student);
  const recs = getRoleRecommendations(student as Student);
  const lessonGrades = buildDemoLessonGrades(student as Student);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* фон */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* модалка */}
      <div className="relative z-10 w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-2xl">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div>
            <p className="text-[11px] text-slate-500 mb-1">Профиль оқушы</p>
            <h2 className="text-lg font-semibold text-slate-50">
              {student.fullName}
            </h2>
            <p className="text-[11px] text-slate-400">
              {student.className} · Орташа балл: {student.avgGrade.toFixed(2)} /
              5.0
            </p>
          </div>
          <div className="flex items-center gap-2">
            {student.riskLevel && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  student.riskLevel === "high"
                    ? "bg-red-500/20 text-red-200 border-red-500/40"
                    : student.riskLevel === "medium"
                    ? "bg-amber-400/10 text-amber-200 border-amber-400/40"
                    : "bg-emerald-500/10 text-emerald-200 border-emerald-400/40"
                }`}
              >
                {student.riskLevel === "high"
                  ? "Жоғары тәуекел"
                  : student.riskLevel === "medium"
                  ? "Орташа тәуекел"
                  : "Төмен / жоқ"}
              </span>
            )}
            <button
              onClick={onClose}
              className="text-xs px-2 py-1 rounded-full border border-slate-700 hover:bg-slate-800"
            >
              Жабу
            </button>
          </div>
        </div>

        {/* Контент: слева инфо, справа — бағалар */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Левая колонка */}
          <div className="space-y-4 text-[11px] text-slate-300">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded-full bg-slate-900 border border-slate-700">
                  Жынысы: {student.gender === "male" ? "ұл" : "қыз"}
                </span>
                <span className="px-2 py-1 rounded-full bg-slate-900 border border-slate-700">
                  Қатыспау: {student.absences} (себепсіз:{" "}
                  {student.unexcusedAbsences})
                </span>
                <span className="px-2 py-1 rounded-full bg-slate-900 border border-slate-700"></span>
              </div>
              <p>
                Баға динамикасы (тренд):{" "}
                <span
                  className={
                    student.gradeTrend < 0
                      ? "text-red-300 font-semibold"
                      : "text-emerald-300 font-semibold"
                  }
                >
                  {student.gradeTrend > 0 ? "+" : ""}
                  {student.gradeTrend.toFixed(2)}
                </span>
              </p>
              {student.subjectsAtRisk.length > 0 && (
                <p>
                  Қиын пәндер:{" "}
                  <span className="text-amber-200">
                    {student.subjectsAtRisk.join(", ")}
                  </span>
                </p>
              )}
              {student.riskScore !== undefined && (
                <p className="text-slate-500">
                  AI-risk score:{" "}
                  <span className="font-semibold text-slate-200">
                    {student.riskScore}
                  </span>
                </p>
              )}
            </div>

            {/* Причины и психо-сигналы */}
            <div>
              <h3 className="text-xs font-semibold text-slate-200 mb-1">
                Негізгі себептер (AI талдау)
              </h3>
              <ul className="space-y-1">
                {reasons.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-200 mb-1">
                Психологиялық сигналдар
              </h3>
              <ul className="space-y-1">
                {psychSignals.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>

            {/* Рекомендации по ролям */}
            <div className="grid grid-cols-1 gap-2">
              <RoleRecBlock title="Мұғалімге" items={recs.teacher} />
              <RoleRecBlock title="Завучқа" items={recs.deputy} />
              <RoleRecBlock title="Ата-анаға" items={recs.parent} />
              <RoleRecBlock title="Психологқа" items={recs.psychologist} />
            </div>
          </div>

          {/* Правая колонка — бағалар */}
          <div className="text-[11px] text-slate-300 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200">
                Бағалар бойынша көрініс
              </h3>
              <span className="text-[10px] text-slate-500">
                Соңғы сабақтар (демо)
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="grid grid-cols-[40px,1fr,52px,40px] px-2 py-1.5 text-[10px] text-slate-400 bg-slate-900/80">
                <span>Күн</span>
                <span>Пән / Тақырып</span>
                <span className="text-center">Түрі</span>
                <span className="text-center">Баға</span>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {lessonGrades.map((g, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[40px,1fr,52px,40px] px-2 py-1.5 items-center border-t border-slate-800/60 text-[11px]"
                  >
                    <span className="text-slate-500">{g.date}</span>
                    <span>
                      <span className="text-slate-100">{g.subject}</span>
                      <span className="text-slate-500"> · {g.topic}</span>
                    </span>
                    <span className="text-center text-slate-300">{g.type}</span>
                    <span
                      className={`text-center font-semibold ${
                        g.grade >= 4.5
                          ? "text-emerald-300"
                          : g.grade >= 3
                          ? "text-amber-300"
                          : "text-red-300"
                      }`}
                    >
                      {g.grade.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 mt-1">
              Кейін бұл блок күнделікті журналмен, БЖБ/ТЖБ базасымен нақты
              интеграцияланады. Қазір — UI демонстрациясы үшін жасалған үлгі.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoleRecBlock: React.FC<{ title: string; items: string[] }> = ({
  title,
  items,
}) => {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-2.5">
      <p className="text-[11px] font-semibold text-slate-200 mb-1">{title}</p>
      <ul className="text-[11px] text-slate-300 space-y-1 max-h-32 overflow-y-auto">
        {items.map((r, i) => (
          <li key={i}>• {r}</li>
        ))}
      </ul>
    </div>
  );
};

// ---------- Модалка записи к психологу ----------
const PsychReferralModal: React.FC<{
  student: StudentWithRisk;
  onClose: () => void;
  onSaved: (ref: PsychReferral) => void;
}> = ({ student, onClose, onSaved }) => {
  const [reasonType, setReasonType] = useState("академиялық");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const referral: PsychReferral = {
      id: `${student.id}-${Date.now()}`,
      studentId: student.id,
      studentName: student.fullName,
      className: student.className,
      reasonType,
      urgency,
      comment,
      createdAt: new Date().toISOString(),
    };

    onSaved(referral);

    // beautiful success state
    setSaved(true);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* фон */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] text-slate-500 mb-1">Психологқа жолдау</p>
            <h2 className="text-sm font-semibold text-slate-50">
              {student.fullName}
            </h2>
            <p className="text-[11px] text-slate-400">{student.className}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-2 py-1 rounded-full border border-slate-700 hover:bg-slate-800"
          >
            Жабу
          </button>
        </div>

        <div className="space-y-3 text-[11px]">
          <div>
            <label className="block mb-1 text-slate-300">
              Негізгі сұрақ / бағыт
            </label>
            <select
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="академиялық">Академиялық қиындықтар</option>
              <option value="мінез-құлық">Мінез-құлық / тәртіп</option>
              <option value="эмоциялық">Эмоциялық жағдай / стресс</option>
              <option value="қарым-қатынас">
                Сыныппен / отбасымен қарым-қатынас
              </option>
              <option value="басқа">Басқа (төменде жазу)</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-slate-300">
              Шұғылдық деңгейі
            </label>
            <div className="flex gap-2">
              <UrgencyChip
                label="Жоспарлы"
                value="low"
                current={urgency}
                onChange={setUrgency}
              />
              <UrgencyChip
                label="Маңызды"
                value="medium"
                current={urgency}
                onChange={setUrgency}
              />
              <UrgencyChip
                label="Шұғыл"
                value="high"
                current={urgency}
                onChange={setUrgency}
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-slate-300">
              Қысқаша түсіндірме (не байқадыңыз?)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Мысалы: соңғы 2 аптада сабақта үндемейді, бағалары төмендеді, сыныппен конфликт болды..."
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-2 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>
        {saved && (
          <div
            className="mb-3 text-center text-[11px] px-3 py-2 rounded-xl
    bg-emerald-500/20 text-emerald-300 border border-emerald-500/40
    animate-fade-in"
          >
            Жолдау сәтті сақталды ✓
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] px-3 py-1.5 rounded-full border border-slate-700 hover:bg-slate-800 text-slate-200"
          >
            Болдырмау
          </button>
          <button
            type="submit"
            className="text-[11px] px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold"
          >
            Жолдауды сақтау
          </button>
        </div>
      </form>
    </div>
  );
};

const UrgencyChip: React.FC<{
  label: string;
  value: "low" | "medium" | "high";
  current: "low" | "medium" | "high";
  onChange: (v: "low" | "medium" | "high") => void;
}> = ({ label, value, current, onChange }) => {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`px-2 py-1 rounded-full text-[11px] border transition ${
        active
          ? "bg-emerald-500 text-slate-950 border-emerald-400"
          : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
      }`}
    >
      {label}
    </button>
  );
};
