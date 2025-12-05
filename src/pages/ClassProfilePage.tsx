// src/pages/ClassProfilePage.tsx
import React, { useMemo } from "react";
import { STUDENTS } from "../data/students";
import {
  calculateRiskScore,
  getRiskLevel,
  type Student,
} from "../data/riskUtils";

type ClassProfilePageProps = {
  className: string;
  onBack: () => void;
};

export const ClassProfilePage: React.FC<ClassProfilePageProps> = ({
  className,
  onBack,
}) => {
  const students = useMemo(
    () => STUDENTS.filter((s) => s.className === className),
    [className]
  );

  const totals = useMemo(() => {
    const girls = students.filter((s) => s.gender === "female").length;
    const boys = students.filter((s) => s.gender === "male").length;
    const avgGrade =
      students.length === 0
        ? 0
        : students.reduce((sum, s) => sum + s.avgGrade, 0) / students.length;
    const riskCount = students.filter((s) => {
      const score = calculateRiskScore(s);
      return getRiskLevel(score) !== "none";
    }).length;
    const absences = students.reduce((sum, s) => sum + s.absences, 0);

    return {
      total: students.length,
      girls,
      boys,
      avgGrade: Number(avgGrade.toFixed(2)),
      riskCount,
      absences,
    };
  }, [students]);

  // ---- Демо-данные для графика по четвертям (на основе среднего балла) ----
  const quarterGrades = useMemo(() => {
    const base = totals.avgGrade || 3.5;
    const clamp = (v: number) => Math.max(2, Math.min(5, v));
    return [
      { label: "1 тоқсан", value: clamp(base - 0.3) },
      { label: "2 тоқсан", value: clamp(base - 0.1) },
    ];
  }, [totals.avgGrade]);

  // ---- Демо-heatmap пропусков по месяцам (на основе общих пропусков) ----
  const absencesByMonth = useMemo(() => {
    // Учебный год: сентябрь–май (9 месяцев). Распределим с коеф. нагрузки.
    const months = [
      { key: "sep", label: "Қыр" },
      { key: "oct", label: "Қаз" },
      { key: "nov", label: "Қар" },
    ];
    const weights = [0.08, 0.1, 0.12];
    const total = totals.absences || 0;

    return months.map((m, idx) => ({
      ...m,
      count: Math.round(total * weights[idx]),
    }));
  }, [totals.absences]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <button
            onClick={onBack}
            className="mb-2 inline-flex items-center text-xs px-2 py-1 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            ← Артқа / Назад
          </button>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
            Сынып профилі · {className}
          </h2>
          <p className="text-sm text-slate-400">
            Бұл сынып бойынша толық аналитика: құрамы, үлгерім, қауіп тобы және
            қатыспау.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <SummaryCard
          title="Барлық оқушы"
          value={totals.total}
          subtitle="Сынып құрамы"
        />
        <SummaryCard
          title="Қыздар"
          value={totals.girls}
          subtitle={
            totals.total
              ? `${Math.round((totals.girls / totals.total) * 100)}%`
              : "0%"
          }
          variant="pink"
        />
        <SummaryCard
          title="Ұлдар"
          value={totals.boys}
          subtitle={
            totals.total
              ? `${Math.round((totals.boys / totals.total) * 100)}%`
              : "0%"
          }
          variant="blue"
        />
        <SummaryCard
          title="Орташа баға"
          value={totals.avgGrade}
          subtitle="/ 5.0"
        />
        <SummaryCard
          title="Қауіп тобындағы"
          value={totals.riskCount}
          subtitle="AI анықтаған"
          variant="danger"
        />
      </div>

      {/* График + heatmap + AI-рекомендации */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Line chart успеваемости */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 md:p-5 flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-50 mb-1">
              Тоқсан бойынша үлгерім
            </h3>
            <p className="text-xs text-slate-400">
              Орташа баға (1–5) әр тоқсан бойынша. Кейін бұл деректер БЖБ/ТЖБ,
              СОР/СОЧ жүйесінен автоматты түрде түседі.
            </p>
          </div>
          <ClassQuarterLineChart data={quarterGrades} />
        </div>

        {/* Heatmap пропусков */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 md:p-5 flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-50 mb-1">
              Қатыспау heatmap (айлар бойынша)
            </h3>
            <p className="text-xs text-slate-400">
              Жыл бойындағы қатыспау динамикасы. Қою түс — көбірек қатыспау.
            </p>
          </div>
          <AbsencesHeatmap data={absencesByMonth} />
        </div>

        {/* AI-рекомендации */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 md:p-5 flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-50 mb-1">
              AI-рекомендациялар по классу
            </h3>
            <p className="text-xs text-slate-400">
              Черновой вариант: логика на основе текущих метрик. Потом можно
              подвязать к реальной AI-модели.
            </p>
          </div>
          <ClassAiRecommendations
            className={className}
            totals={totals}
            students={students}
          />
        </div>
      </div>

      {/* Таблица учеников */}
      <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 text-xs uppercase tracking-wide text-slate-400 bg-slate-900/80 border-b border-slate-800">
          <div className="col-span-4">Оқушы</div>
          <div className="col-span-2 text-center">Орта баға</div>
          <div className="col-span-2 text-center">Қатыспау</div>
          <div className="col-span-2 text-center">Қиын пәндер</div>
          <div className="col-span-2 text-center">Тәуекел</div>
        </div>

        <div className="divide-y divide-slate-800">
          {students.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-400 text-center">
              Бұл сыныпқа оқушылар енгізілмеген.
            </div>
          )}

          {students.map((s) => {
            const score = calculateRiskScore(s);
            const level = getRiskLevel(score);

            const levelLabel =
              level === "high"
                ? "Жоғары"
                : level === "medium"
                ? "Орташа"
                : level === "low"
                ? "Төмен"
                : "Норма";

            const levelClass =
              level === "high"
                ? "bg-red-500/10 text-red-300 border-red-500/40"
                : level === "medium"
                ? "bg-amber-500/10 text-amber-300 border-amber-500/40"
                : level === "low"
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
                : "bg-slate-700/20 text-slate-300 border-slate-500/40";

            return (
              <div
                key={s.id}
                className="px-4 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
              >
                <div className="md:col-span-4">
                  <p className="text-sm font-medium text-slate-50">
                    {s.fullName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {s.gender === "male" ? "Ұл бала" : "Қыз бала"}
                  </p>
                </div>

                <div className="md:col-span-2 text-sm md:text-center">
                  <span className="font-semibold text-slate-50">
                    {s.avgGrade.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">/ 5.0</span>
                </div>

                <div className="md:col-span-2 text-xs md:text-center text-slate-200">
                  Барлығы: {s.absences}
                  <span className="ml-2 text-red-300">
                    · Себепсіз: {s.unexcusedAbsences}
                  </span>
                </div>

                <div className="md:col-span-2 flex flex-wrap gap-1">
                  {s.subjectsAtRisk.length === 0 && (
                    <span className="text-xs text-slate-500">
                      Қиын пәндер жоқ
                    </span>
                  )}
                  {s.subjectsAtRisk.map((subj: string) => (
                    <span
                      key={subj}
                      className="text-xs px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-200 border border-indigo-500/30"
                    >
                      {subj}
                    </span>
                  ))}
                </div>

                <div className="md:col-span-2 flex md:justify-center">
                  <span
                    className={
                      "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border " +
                      levelClass
                    }
                  >
                    {levelLabel}
                    <span className="ml-2 text-[10px] text-slate-300/80">
                      score: {score}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------- SummaryCard ----------
type SummaryCardProps = {
  title: string;
  value: number | string;
  subtitle?: string;
  variant?: "default" | "pink" | "blue" | "danger";
};

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  variant = "default",
}) => {
  const accentClass =
    variant === "pink"
      ? "from-fuchsia-500/80 to-pink-500/40"
      : variant === "blue"
      ? "from-sky-500/80 to-cyan-500/40"
      : variant === "danger"
      ? "from-red-500/80 to-rose-500/40"
      : "from-primary-500/80 to-accent-500/40";

  return (
    <div className="relative overflow-hidden bg-slate-900/80 border border-slate-800/70 rounded-3xl p-4 shadow-soft">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${accentClass} opacity-20`}
      />
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 mb-1">
        {title}
      </p>
      <div className="text-2xl md:text-3xl font-semibold">{value}</div>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
};

// ---------- Мини line chart по четвертям ----------
type QuarterPoint = {
  label: string;
  value: number; // 1–5
};

const ClassQuarterLineChart: React.FC<{ data: QuarterPoint[] }> = ({
  data,
}) => {
  if (!data.length) return null;

  const max = 5;
  const min = 1;
  const width = 220;
  const height = 90;
  const stepX = width / (data.length - 1 || 1);

  const points = data.map((d, idx) => {
    const x = idx * stepX;
    const norm = (d.value - min) / (max - min);
    const y = height - norm * height;
    return { x, y };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-24 text-primary-400"
      >
        {/* grid */}
        <line
          x1={0}
          y1={height}
          x2={width}
          y2={height}
          className="stroke-slate-700"
          strokeWidth={0.5}
        />
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          className="stroke-slate-800"
          strokeWidth={0.5}
        />
        {/* polyline */}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          points={polyline}
        />
        {/* points */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={3}
            className="fill-primary-400"
          />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400">
        {data.map((d) => (
          <div key={d.label} className="flex flex-col items-center">
            <span>{d.label}</span>
            <span className="text-[11px] text-slate-200 font-semibold">
              {d.value.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-500">
        Егер 3-тоқсан мен 4-тоқсанда баға түссе – БЖБ/ТЖБ нәтижелерін және үй
        тапсырмалары бойынша кері байланысты талдау қажет.
      </p>
    </div>
  );
};

// ---------- Heatmap пропусков по месяцам ----------
type MonthAbsence = {
  key: string;
  label: string;
  count: number;
};

const AbsencesHeatmap: React.FC<{ data: MonthAbsence[] }> = ({ data }) => {
  const max = data.reduce((m, d) => Math.max(m, d.count), 0);

  const intensityClass = (count: number) => {
    if (count === 0) return "bg-slate-800 text-slate-300";
    const ratio = max ? count / max : 0;
    if (ratio < 0.25) return "bg-emerald-500/20 text-emerald-100";
    if (ratio < 0.5) return "bg-amber-500/30 text-amber-100";
    if (ratio < 0.75) return "bg-orange-500/40 text-orange-50";
    return "bg-red-500/50 text-red-50";
  };

  return (
    <div className="grid grid-cols-3 gap-2 text-[11px]">
      {data.map((m) => (
        <div
          key={m.key}
          className={
            "rounded-xl px-2 py-2 flex flex-col items-center justify-center border border-slate-700/40 " +
            intensityClass(m.count)
          }
        >
          <span className="font-semibold">{m.label}</span>
          <span className="mt-1">{m.count} күн</span>
        </div>
      ))}
      <p className="col-span-3 text-[10px] text-slate-500 mt-1">
        Қызылға жақын айлар — сыныптың қатысуын бақылауды күшейту керек кезең.
      </p>
    </div>
  );
};

// ---------- AI-рекомендации по классу ----------
type Totals = {
  total: number;
  girls: number;
  boys: number;
  avgGrade: number;
  riskCount: number;
  absences: number;
};

const ClassAiRecommendations: React.FC<{
  className: string;
  totals: Totals;
  students: Student[];
}> = ({ className, totals, students }) => {
  const tips: string[] = [];

  const girlShare =
    totals.total === 0 ? 0 : Math.round((totals.girls / totals.total) * 100);
  const boyShare =
    totals.total === 0 ? 0 : Math.round((totals.boys / totals.total) * 100);

  if (totals.avgGrade < 3.5) {
    tips.push(
      "Тоғытылған пәндер бойынша тақырыптық қайталау аптасын жоспарлау (мини-диагностика + шағын топтармен жұмыс)."
    );
  }

  if (totals.riskCount >= Math.max(3, Math.round(totals.total * 0.2))) {
    tips.push(
      "Қауіп тобындағы оқушылар үшін жеке бақылау картасын жасау: ата-анамен байланыс, пән мұғалімдерінің ескертулері және психологиялық қолдау."
    );
  }

  if (totals.absences > totals.total * 4) {
    tips.push(
      "Сынып жетекшісімен бірге қатыспау себептерін талдап, таңғы келген-келмеген мониторингін 2–3 аптаға күшейту."
    );
  }

  if (Math.abs(girlShare - boyShare) >= 30) {
    tips.push(
      "Гендерлік баланс тең емес: сыныптағы рөлдік ойындар мен жобаларда ұлдар мен қыздарға тең мүмкіндік беру маңызды."
    );
  }

  const highAlertStudents = students
    .map((s) => ({ s, score: calculateRiskScore(s) }))
    .filter(({ score }) => score >= 10)
    .slice(0, 3);

  if (highAlertStudents.length) {
    tips.push(
      "Ең жоғары тәуекелдегі оқушылармен (3 оқушыға дейін) жеке кездесу өткізу: оқу мотивациясы, режим және үй тапсырмасын ұйымдастыру."
    );
  }

  if (!tips.length) {
    tips.push(
      "Сыныптың жалпы жағдайы тұрақты. Үлгерім мен қатыспау динамикасын ағымдағы деңгейде бақылауды жалғастыру жеткілікті."
    );
  }

  return (
    <div className="space-y-2 text-xs text-slate-200">
      <p className="text-[11px] text-slate-400">
        Сынып: <span className="font-semibold text-slate-100">{className}</span>
      </p>
      <ul className="list-disc list-inside space-y-1">
        {tips.map((tip, idx) => (
          <li key={idx}>{tip}</li>
        ))}
      </ul>

      {highAlertStudents.length > 0 && (
        <div className="mt-2 rounded-xl bg-slate-950/80 border border-red-500/40 p-2">
          <p className="text-[11px] font-semibold text-red-300 mb-1">
            Фокус-топ (ең жоғары тәуекел):
          </p>
          <ul className="text-[11px] space-y-0.5">
            {highAlertStudents.map(({ s, score }) => (
              <li key={s.id}>
                {s.fullName} — score: {score}, орташа баға:{" "}
                {s.avgGrade.toFixed(1)}, себепсіз қатыспау:{" "}
                {s.unexcusedAbsences}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-slate-500 mt-1">
        Ескерту: бұл ұсыныстар демо-логика негізінде жасалған. Кейін олар нақты
        AI-моделі мен журнал деректеріне негізделіп, автоматты түрде
        жаңартылады.
      </p>
    </div>
  );
};
