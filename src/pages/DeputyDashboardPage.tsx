// src/pages/DeputyDashboardPage.tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { STUDENTS } from "../data/students";
import {
  calculateRiskScore,
  getRiskLevel,
  getRiskReasons,
  getPsychSignals,
  getRoleRecommendations,
  type RiskLevel,
  type Student,
} from "../data/riskUtils";

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

export const DeputyDashboardPage: React.FC = () => {
  const { setRole } = useAuth();

  const [profileStudent, setProfileStudent] = useState<StudentWithRisk | null>(
    null
  );
  const [psychModalStudent, setPsychModalStudent] =
    useState<StudentWithRisk | null>(null);

  // уже направленные к психологу (id учеников)
  const [referredStudentIds, setReferredStudentIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("psych_referrals");
      if (!raw) return [];
      const arr: PsychReferral[] = JSON.parse(raw);
      return Array.isArray(arr) ? arr.map((r) => r.studentId) : [];
    } catch {
      return [];
    }
  });

  // функция сохранения заявки в localStorage + стейт
  const handleReferralSaved = (ref: PsychReferral) => {
    setReferredStudentIds((prev) =>
      prev.includes(ref.studentId) ? prev : [...prev, ref.studentId]
    );

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

    const avgHomework =
      totalStudents === 0
        ? 0
        : STUDENTS.reduce((sum, s) => sum + s.homeworkCompletion, 0) /
          totalStudents;

    const homeworkDonePercent = Math.round(avgHomework);
    const homeworkNotPercent = Math.max(0, 100 - homeworkDonePercent);

    // риск-метрики
    const withRisk: StudentWithRisk[] = STUDENTS.map((s) => {
      const score = calculateRiskScore(s);
      const level = getRiskLevel(score);
      return { ...s, riskScore: score, riskLevel: level as RiskLevel };
    });

    const riskStudents = withRisk.filter((s) => s.riskLevel !== "none");
    const highRisk = riskStudents.filter((s) => s.riskLevel === "high").length;
    const mediumRisk = riskStudents.filter(
      (s) => s.riskLevel === "medium"
    ).length;
    const lowRisk = riskStudents.filter((s) => s.riskLevel === "low").length;

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
      const inClassRisk = inClass.filter((s) => s.riskLevel !== "none");

      const high = inClassRisk.filter((s) => s.riskLevel === "high").length;
      const medium = inClassRisk.filter((s) => s.riskLevel === "medium").length;
      const low = inClassRisk.filter((s) => s.riskLevel === "low").length;

      riskByClass.push({
        className: cls,
        total: inClassRisk.length,
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
      avgHomework,
      homeworkDonePercent,
      homeworkNotPercent,
      riskStudentsCount: riskStudents.length,
      highRisk,
      mediumRisk,
      lowRisk,
      riskByClass,
      psychSignalsCount,
      focusStudents,
    };
  }, []);

  // Цвета для круговых диаграмм
  const ABSENCE_COLORS = ["#f97373", "#38bdf8"]; // Себепсіз / Себепті
  const HOMEWORK_COLORS = ["#22c55e", "#64748b"]; // Орындаған / Орындамаған
  const STUDENT_COLORS = ["#60a5fa", "#f472b6"]; // Ұл / Қыз
  const GRADE_COLORS = ["#22c55e", "#1e293b"]; // Норм / қалған бөлігі
  const RISK_COLORS = ["#ef4444", "#facc15", "#22c55e"]; // Жоғары / Орташа / Төмен

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

  const riskPieData = [
    { name: "Жоғары", value: stats.highRisk },
    { name: "Орташа", value: stats.mediumRisk },
    { name: "Төмен", value: stats.lowRisk },
  ];

  const absencesPieData = [
    { name: "Себепсіз", value: stats.totalUnexcused },
    { name: "Себепті", value: stats.excusedAbsences },
  ];

  const homeworkPieData = [
    { name: "Орындаған", value: stats.homeworkDonePercent },
    { name: "Орындамаған", value: stats.homeworkNotPercent },
  ];

  const visibleFocusStudents = stats.focusStudents.filter(
    (s) => !referredStudentIds.includes(s.id)
  );

  return (
    <div>
      {/* HEADER */}
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Панель завуча</h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Негізгі мектеп көрінісі: оқушылар, үлгерім, тәуекел топтары.
          </p>
        </div>
        <button
          onClick={() => setRole(null)}
          className="text-xs px-3 py-1.5 rounded-full border border-slate-600 hover:bg-slate-800"
        >
          Рөлді ауыстыру
        </button>
      </header>

      {/* ВЕРХ: 3 КЛЮЧЕВЫЕ КАРТОЧКИ С КРУГАМИ */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Оқушылар + ұл/қыз круг */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-4 flex items-center gap-4">
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
                  {studentsPieData.map((index: any) => (
                    <Cell
                      key={`students-cell-${index}`}
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
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-4 flex items-center gap-4">
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
                  {gradePieData.map((index: any) => (
                    <Cell
                      key={`grade-cell-${index}`}
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

        {/* Қауіп тобы круг: жоғары / орташа / төмен */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
              Қауіп тобы (AI)
            </p>
            <p className="text-2xl font-semibold">
              {stats.riskStudentsCount}
              <span className="text-sm text-slate-400 ml-1">оқушы</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
              <span className="inline-flex items-center gap-1 text-red-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Жоғары: {stats.highRisk}
              </span>
              <span className="inline-flex items-center gap-1 text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Орташа: {stats.mediumRisk}
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Төмен: {stats.lowRisk}
              </span>
            </div>
          </div>

          <div className="w-24 h-24 overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={26}
                  outerRadius={38}
                  paddingAngle={2}
                >
                  {riskPieData.map((index: any) => (
                    <Cell
                      key={`risk-cell-${index}`}
                      fill={RISK_COLORS[index % RISK_COLORS.length]}
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
      </section>

      {/* СРЕДНЯЯ ЗОНА: КАРТА РИСКА + ПСИХО + ҚАТЫСПАУ/ДЗ */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* LEFT: Heatmap по классам */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">
              Жалпы тәуекел картасы (сыныптар)
            </h2>
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

        {/* RIGHT: Психо + Қатысу және үй тапсырмасы */}
        <div className="space-y-4">
          {/* Психологиялық сигналдар */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">
                Психологиялық сигналдар (завуч + психолог)
              </h2>
              <span className="text-[11px] text-slate-400">
                Бақылауды қажет ететін оқушылар:{" "}
                <span className="text-amber-300 font-medium">
                  {stats.psychSignalsCount}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Бұл блок кейін психолог модулімен біріктіріледі. Мұнда AI және
              мұғалімдер белгілеген «қызыл жалаушалар» шығады.
            </p>

            <ul className="text-[11px] text-slate-300 space-y-1">
              <li>
                • Сабақта үнсіз отыру, көз байланысынан қашу, тревожность
                белгілері.
              </li>
              <li>
                • Бірнеше пән бойынша баллдың күрт төмендеуі, БЖБ/ТЖБ
                нәтижелерінің нашарлауы.
              </li>
              <li>
                • Конфликттер сыныпта, ата-ананың шағымдары, тәртіп бұзушылық.
              </li>
              <li>
                • Мектеп психологының жеке жазбалары мен қорытындылары
                (көрінетін тек завуч пен психологқа).
              </li>
            </ul>

            <p className="mt-3 text-[11px] text-slate-400">
              Завуч осы блоктан «қызыл сигналдары» бар оқушыларды қарап, бірден
              психологқа жолдама немесе ата-анамен кездесу жоспарлай алады.
            </p>
          </div>

          {/* Қатысу және үй тапсырмасы */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
            <h2 className="text-sm font-semibold mb-1">
              Қатысу және үй тапсырмасы
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Себепсіз / себепті қатыспау және үй тапсырмасын орындау үлесі.
            </p>

            {/* Қатыспау құрылымы */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={absencesPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={22}
                      outerRadius={32}
                      paddingAngle={2}
                    >
                      {absencesPieData.map((index: any) => (
                        <Cell
                          key={`absence-cell-${index}`}
                          fill={ABSENCE_COLORS[index % ABSENCE_COLORS.length]}
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

              <div className="flex-1 text-[11px] text-slate-300 space-y-1">
                <p className="text-slate-400 uppercase tracking-wide text-[10px]">
                  Қатыспау құрылымы
                </p>
                <p>
                  Барлығы:{" "}
                  <span className="font-semibold">{stats.totalAbsences}</span>
                </p>
                <p className="text-red-300">
                  Себепсіз:{" "}
                  <span className="font-semibold">{stats.totalUnexcused}</span>
                </p>
                <p className="text-sky-300">
                  Себепті:{" "}
                  <span className="font-semibold">{stats.excusedAbsences}</span>
                </p>
              </div>
            </div>

            {/* Үй тапсырмасын орындау */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={homeworkPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={22}
                      outerRadius={32}
                      paddingAngle={2}
                    >
                      {homeworkPieData.map((index: any) => (
                        <Cell
                          key={`hw-cell-${index}`}
                          fill={HOMEWORK_COLORS[index % HOMEWORK_COLORS.length]}
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

              <div className="flex-1 text-[11px] text-slate-300 space-y-1">
                <p className="text-slate-400 uppercase tracking-wide text-[10px]">
                  Үй тапсырмасын орындау
                </p>
                <p className="text-emerald-300">
                  Орындаған:{" "}
                  <span className="font-semibold">
                    {stats.homeworkDonePercent}%
                  </span>
                </p>
                <p className="text-slate-300">
                  Орындамаған:{" "}
                  <span className="font-semibold">
                    {stats.homeworkNotPercent}%
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* НИЖНИЙ БЛОК: Фокус-оқушылар */}
      <section className="mt-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">
            Фокус-оқушылар (ең жоғары тәуекел)
          </h2>
          <span className="text-[11px] text-slate-400">
            Топ-5 · тек завуч + психолог
          </span>
        </div>

        {visibleFocusStudents.length === 0 && (
          <p className="text-xs text-slate-500">
            Қазіргі уақытта жаңа фокус-оқушылар жоқ (жолдауы барлары жасырылды).
          </p>
        )}

        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {visibleFocusStudents.map((s) => {
            const reasons = getRiskReasons(s as Student);

            return (
              <div
                key={s.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-100">{s.fullName}</p>
                    <p className="text-[11px] text-slate-400">
                      {s.className} · score: {s.riskScore}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      s.riskLevel === "high"
                        ? "bg-red-500/20 text-red-300 border border-red-500/40"
                        : "bg-amber-400/10 text-amber-300 border border-amber-400/40"
                    }`}
                  >
                    {s.riskLevel === "high"
                      ? "Жоғары тәуекел"
                      : "Орташа тәуекел"}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 line-clamp-3">
                  Себептері: {reasons[0]}
                </div>

                <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                  <button
                    type="button"
                    className="px-2 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700"
                    onClick={() => setProfileStudent(s)}
                  >
                    Профиль
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30"
                    onClick={() => setPsychModalStudent(s)}
                  >
                    Психологқа жолдау
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] text-slate-400">
          Идея: завуч осы тізімнен бастап жеке әңгіме, ата-анамен байланыс,
          психологқа жолдама жоспарлай алады.
        </p>
      </section>

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
        <div className="flex items-start justify между mb-3 gap-3">
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
                <span className="px-2 py-1 rounded-full bg-slate-900 border border-slate-700">
                  Үй тапсырмасы: {student.homeworkCompletion}% орындалған
                </span>
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
