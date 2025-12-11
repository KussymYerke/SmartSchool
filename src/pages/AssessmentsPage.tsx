// src/pages/AssessmentsPage.tsx
import React, { useMemo, useState } from "react";
import { useI18n } from "../i18n/i18n";

type SubjectAssessStats = {
  subject: string;
  sorAvg: number; // БЖБ / СОР
  sochAvg: number; // ТЖБ / СОЧ
  lowShare: number; // % работ на "2" и "3"
};

type ClassAssessStats = {
  className: string;
  sorAvg: number;
  sochAvg: number;
  lowShare: number; // % слабых работ
  highShare: number; // % "4-5"
  worstSubject: string; // предмет риска
};

// 🔢 Демоданные по школе (агрегировано)
const SCHOOL_SUBJECTS_STATS: SubjectAssessStats[] = [
  { subject: "Математика", sorAvg: 3.4, sochAvg: 3.2, lowShare: 32 },
  { subject: "Қазақ тілі / Рус. яз.", sorAvg: 3.8, sochAvg: 3.6, lowShare: 18 },
  { subject: "Ағылшын тілі", sorAvg: 3.7, sochAvg: 3.4, lowShare: 22 },
  { subject: "Информатика", sorAvg: 4.2, sochAvg: 4.0, lowShare: 9 },
  { subject: "Физика", sorAvg: 3.3, sochAvg: 3.1, lowShare: 35 },
  { subject: "Химия", sorAvg: 3.5, sochAvg: 3.2, lowShare: 29 },
];

// 🔢 Демоданные по классам (общие)
const CLASS_ASSESS_STATS: ClassAssessStats[] = [
  {
    className: "7A",
    sorAvg: 3.9,
    sochAvg: 3.7,
    lowShare: 15,
    highShare: 55,
    worstSubject: "Математика",
  },
  {
    className: "8A",
    sorAvg: 3.6,
    sochAvg: 3.3,
    lowShare: 26,
    highShare: 40,
    worstSubject: "Физика",
  },
  {
    className: "8B",
    sorAvg: 3.4,
    sochAvg: 3.1,
    lowShare: 32,
    highShare: 35,
    worstSubject: "Математика",
  },
  {
    className: "9A",
    sorAvg: 3.8,
    sochAvg: 3.5,
    lowShare: 21,
    highShare: 48,
    worstSubject: "Қазақ тілі / Рус. яз.",
  },
  {
    className: "9B",
    sorAvg: 3.5,
    sochAvg: 3.2,
    lowShare: 28,
    highShare: 39,
    worstSubject: "Физика",
  },
  {
    className: "10A",
    sorAvg: 3.7,
    sochAvg: 3.4,
    lowShare: 24,
    highShare: 43,
    worstSubject: "Физика",
  },
  {
    className: "10B",
    sorAvg: 3.6,
    sochAvg: 3.3,
    lowShare: 27,
    highShare: 38,
    worstSubject: "Химия",
  },
  {
    className: "11A",
    sorAvg: 4.0,
    sochAvg: 3.8,
    lowShare: 14,
    highShare: 60,
    worstSubject: "Ағылшын тілі",
  },
  {
    className: "11B",
    sorAvg: 3.9,
    sochAvg: 3.7,
    lowShare: 17,
    highShare: 52,
    worstSubject: "Математика",
  },
];

// 🔢 Детализация по предметам для КАЖДОГО класса
const CLASS_SUBJECT_DETAILS: Record<string, SubjectAssessStats[]> = {
  "7A": [
    { subject: "Математика", sorAvg: 3.6, sochAvg: 3.4, lowShare: 22 },
    { subject: "Қазақ тілі", sorAvg: 4.1, sochAvg: 3.9, lowShare: 10 },
    { subject: "Русский язык", sorAvg: 3.9, sochAvg: 3.8, lowShare: 12 },
    { subject: "Ағылшын тілі", sorAvg: 3.8, sochAvg: 3.7, lowShare: 15 },
    { subject: "Информатика", sorAvg: 4.4, sochAvg: 4.2, lowShare: 5 },
  ],
  "8A": [
    { subject: "Математика", sorAvg: 3.4, sochAvg: 3.2, lowShare: 30 },
    { subject: "Физика", sorAvg: 3.2, sochAvg: 3.0, lowShare: 35 },
    { subject: "Қазақ тілі", sorAvg: 3.9, sochAvg: 3.6, lowShare: 18 },
    { subject: "Ағылшын тілі", sorAvg: 3.7, sochAvg: 3.4, lowShare: 22 },
  ],
  "8B": [
    { subject: "Математика", sorAvg: 3.2, sochAvg: 3.0, lowShare: 36 },
    { subject: "Физика", sorAvg: 3.1, sochAvg: 2.9, lowShare: 38 },
    { subject: "Қазақ тілі", sorAvg: 3.7, sochAvg: 3.5, lowShare: 20 },
    { subject: "Ағылшын тілі", sorAvg: 3.5, sochAvg: 3.2, lowShare: 26 },
  ],
  "9A": [
    { subject: "Математика", sorAvg: 3.5, sochAvg: 3.3, lowShare: 27 },
    {
      subject: "Қазақ тілі / Рус. яз.",
      sorAvg: 3.7,
      sochAvg: 3.4,
      lowShare: 24,
    },
    { subject: "Физика", sorAvg: 3.4, sochAvg: 3.1, lowShare: 30 },
    { subject: "Информатика", sorAvg: 4.3, sochAvg: 4.1, lowShare: 7 },
  ],
  "9B": [
    { subject: "Математика", sorAvg: 3.3, sochAvg: 3.1, lowShare: 33 },
    { subject: "Физика", sorAvg: 3.1, sochAvg: 2.9, lowShare: 37 },
    {
      subject: "Қазақ тілі / Рус. яз.",
      sorAvg: 3.6,
      sochAvg: 3.3,
      lowShare: 25,
    },
    { subject: "Ағылшын тілі", sorAvg: 3.5, sochAvg: 3.2, lowShare: 28 },
  ],
  "10A": [
    { subject: "Математика", sorAvg: 3.6, sochAvg: 3.4, lowShare: 28 },
    { subject: "Физика", sorAvg: 3.3, sochAvg: 3.1, lowShare: 32 },
    { subject: "Химия", sorAvg: 3.5, sochAvg: 3.2, lowShare: 29 },
    { subject: "Информатика", sorAvg: 4.1, sochAvg: 3.9, lowShare: 10 },
  ],
  "10B": [
    { subject: "Математика", sorAvg: 3.4, sochAvg: 3.2, lowShare: 31 },
    { subject: "Физика", sorAvg: 3.2, sochAvg: 3.0, lowShare: 34 },
    { subject: "Химия", sorAvg: 3.3, sochAvg: 3.1, lowShare: 36 },
    {
      subject: "Қазақ тілі / Рус. яз.",
      sorAvg: 3.8,
      sochAvg: 3.5,
      lowShare: 22,
    },
  ],
  "11A": [
    { subject: "Математика", sorAvg: 4.0, sochAvg: 3.8, lowShare: 14 },
    {
      subject: "Қазақ тілі / Рус. яз.",
      sorAvg: 4.1,
      sochAvg: 3.9,
      lowShare: 12,
    },
    { subject: "Ағылшын тілі", sorAvg: 3.9, sochAvg: 3.7, lowShare: 18 },
    { subject: "Информатика", sorAvg: 4.5, sochAvg: 4.3, lowShare: 4 },
  ],
  "11B": [
    { subject: "Математика", sorAvg: 3.8, sochAvg: 3.6, lowShare: 19 },
    {
      subject: "Қазақ тілі / Рус. яз.",
      sorAvg: 3.9,
      sochAvg: 3.7,
      lowShare: 17,
    },
    { subject: "Физика", sorAvg: 3.5, sochAvg: 3.3, lowShare: 26 },
    { subject: "Ағылшын тілі", sorAvg: 3.7, sochAvg: 3.5, lowShare: 21 },
  ],
};

type GradeFilter = "all" | "7" | "8" | "9" | "10" | "11";

const GRADE_FILTERS: { key: GradeFilter; label: string }[] = [
  { key: "all", label: "Барлық параллель / Все" },
  { key: "7", label: "7 сынып" },
  { key: "8", label: "8 сынып" },
  { key: "9", label: "9 сынып" },
  { key: "10", label: "10 сынып" },
  { key: "11", label: "11 сынып" },
];

const getGradeFromClassName = (name: string): GradeFilter => {
  const match = name.match(/^\d+/);
  if (!match) return "all";
  const val = match[0];
  if (["7", "8", "9", "10", "11"].includes(val)) {
    return val as GradeFilter;
  }
  return "all";
};

const RadialCircle: React.FC<{
  value: number;
  max?: number;
  label: string;
  className?: string;
}> = ({ value, max = 5, label, className }) => {
  const size = 64;
  const stroke = 6;
  const center = size / 2;
  const radius = center - stroke;
  const circ = 2 * Math.PI * radius;

  const filled = (value / max) * circ;

  return (
    <div className={`flex flex-col items-center ${className ?? ""}`}>
      <svg width={size} height={size} className="overflow-visible">
        {/* фон */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(148, 163, 184, 0.4)" // slate-400/40
          strokeWidth={stroke}
          fill="none"
        />
        {/* прогресс */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ - filled}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
        {/* значение */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="text-[13px] font-semibold fill-white"
        >
          {value.toFixed(1)}
        </text>
      </svg>
      <span className="mt-1 text-[10px] text-slate-300">{label}</span>
    </div>
  );
};

export const AssessmentsPage: React.FC = () => {
  const { t } = useI18n();
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all");
  const [selectedClassName, setSelectedClassName] = useState<string | null>(
    null
  );

  const filteredClasses = useMemo(() => {
    const base =
      gradeFilter === "all"
        ? CLASS_ASSESS_STATS
        : CLASS_ASSESS_STATS.filter(
            (cls) => getGradeFromClassName(cls.className) === gradeFilter
          );
    // Если выбранный класс не входит в фильтр — сбрасываем
    if (
      selectedClassName &&
      !base.some((cls) => cls.className === selectedClassName)
    ) {
      setSelectedClassName(null);
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeFilter]);

  const schoolSorAvg = useMemo(() => {
    if (!filteredClasses.length) return 0;
    const sum = filteredClasses.reduce((acc, c) => acc + c.sorAvg, 0);
    return Number((sum / filteredClasses.length).toFixed(2));
  }, [filteredClasses]);

  const schoolSochAvg = useMemo(() => {
    if (!filteredClasses.length) return 0;
    const sum = filteredClasses.reduce((acc, c) => acc + c.sochAvg, 0);
    return Number((sum / filteredClasses.length).toFixed(2));
  }, [filteredClasses]);

  const schoolLowShare = useMemo(() => {
    if (!filteredClasses.length) return 0;
    const sum = filteredClasses.reduce((acc, c) => acc + c.lowShare, 0);
    return Math.round(sum / filteredClasses.length);
  }, [filteredClasses]);

  const selectedClassSubjects: SubjectAssessStats[] = useMemo(() => {
    if (!selectedClassName) return [];
    return CLASS_SUBJECT_DETAILS[selectedClassName] ?? [];
  }, [selectedClassName]);

  return (
    <div className="space-y-6">
      {/* Header + filters */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-1 text-slate-50">
            {t("assessments.title", "БЖБ / ТЖБ · СОР / СОЧ")}
          </h2>
          <p className="text-sm text-slate-400">
            {t(
              "assessments.subtitle",
              "Мектеп бойынша БЖБ/ТЖБ нәтижелері: орташа балл, параллельдер мен сыныптар кесіндісінде."
            )}
          </p>
        </div>

        <div className="inline-flex flex-wrap gap-2 rounded-full bg-slate-900/70 border border-slate-800 px-2 py-1">
          {GRADE_FILTERS.map((f) => {
            const active = gradeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setGradeFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs md:text-sm transition whitespace-nowrap ${
                  active
                    ? "bg-primary-600 text-white shadow-soft"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Обзор по школе */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* summary cards */}
        <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
          <SummaryCard
            title="Орташа БЖБ / СОР"
            value={schoolSorAvg}
            subtitle="/ 5.0"
          />
          <SummaryCard
            title="Орташа ТЖБ / СОЧ"
            value={schoolSochAvg}
            subtitle="/ 5.0"
            variant="blue"
          />
          <SummaryCard
            title="Төмен нәтиже үлесі"
            value={`${schoolLowShare}%`}
            subtitle="2–3 алған жұмыстар"
            variant="danger"
          />
        </div>

        {/* bar chart by subjects */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/70 rounded-3xl p-4 md:p-5 shadow-soft flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-50 mb-1">
              Пәндер бойынша орташа балл (мектеп бойынша)
            </h3>
            <p className="text-xs text-slate-400">
              БЖБ/СОР және ТЖБ/СОЧ орташа балл. 5.0 – максимум. Бұл блок бүкіл
              мектеп/таңдалған параллель бойынша көрінеді.
            </p>
          </div>
          <SubjectsBarChart data={SCHOOL_SUBJECTS_STATS} />
        </div>
      </section>

      {/* По классам */}
      <section className="bg-slate-900/80 border border-slate-800/70 rounded-3xl p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-50">
            Сыныптар кесіндісінде · БЖБ / ТЖБ
          </h3>
          <p className="text-xs text-slate-500">
            Сыныптар саны: {filteredClasses.length}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => (
            <ClassAssessCard
              key={cls.className}
              data={cls}
              selected={selectedClassName === cls.className}
              onClick={() =>
                setSelectedClassName((prev) =>
                  prev === cls.className ? null : cls.className
                )
              }
            />
          ))}
        </div>

        {selectedClassName && (
          <div className="mt-6 border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-50">
                БЖБ / ТЖБ по предметам — {selectedClassName}
              </h4>
              <button
                onClick={() => setSelectedClassName(null)}
                className="text-[11px] text-slate-400 hover:text-slate-200"
              >
                Скрыть детали ✕
              </button>
            </div>

            {selectedClassSubjects.length === 0 ? (
              <p className="text-xs text-slate-500">
                Для этого класса пока нет детализации по предметам. Позже сюда
                можно подтянуть реальные данные из журнала.
              </p>
            ) : (
              <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-4">
                {/* ВАЖНО: key */}
                <SubjectsBarChart
                  key={selectedClassName}
                  data={selectedClassSubjects}
                />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

// ---------- SummaryCard ----------
type SummaryCardProps = {
  title: string;
  value: number | string;
  subtitle?: string;
  variant?: "default" | "blue" | "danger";
};

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  variant = "default",
}) => {
  const accentClass =
    variant === "blue"
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
      <div className="text-2xl md:text-3xl font-semibold text-slate-50">
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-slate-400 mt-1 whitespace-nowrap">
          {subtitle}
        </p>
      )}
    </div>
  );
};

const SubjectsBarChart: React.FC<{ data: SubjectAssessStats[] }> = ({
  data,
}) => {
  if (!data.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {data.map((row) => (
        <div
          key={row.subject}
          className="rounded-3xl bg-slate-950/60 border border-slate-800 p-4 flex gap-4 items-center hover:bg-slate-900 transition"
        >
          {/* Две отдельные круговые диаграммы */}
          <div className="flex gap-3">
            <div className="text-sky-400">
              <RadialCircle value={row.sorAvg} label="БЖБ / СОР" />
            </div>
            <div className="text-violet-400">
              <RadialCircle value={row.sochAvg} label="ТЖБ / СОЧ" />
            </div>
          </div>

          {/* Текстовая часть */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-100">
              {row.subject}
            </span>

            <span className="text-xs text-slate-400 mt-1">
              БЖБ/СОР орташа балл:{" "}
              <span className="text-sky-300 font-medium">
                {row.sorAvg.toFixed(1)} / 5.0
              </span>
            </span>

            <span className="text-xs text-slate-400">
              ТЖБ/СОЧ орташа балл:{" "}
              <span className="text-violet-300 font-medium">
                {row.sochAvg.toFixed(1)} / 5.0
              </span>
            </span>

            <span className="text-xs text-amber-300 mt-2">
              🔥 Төмен нәтиже үлесі: {row.lowShare}%{" "}
              <span className="text-slate-400">(2–3 алған жұмыстар)</span>
            </span>
          </div>
        </div>
      ))}
      <p className="text-[10px] text-slate-500 col-span-full mt-1">
        Кеңес: ТЖБ/СОЧ БЖБ/СОР-ға қарағанда айқын төмен пәндер — қорытынды
        бақылауға дайындықты терең талдауды қажет ететін бағыттар.
      </p>
    </div>
  );
};

// ---------- ClassAssessCard ----------
const ClassAssessCard: React.FC<{
  data: ClassAssessStats;
  selected: boolean;
  onClick: () => void;
}> = ({ data, selected, onClick }) => {
  const low = data.lowShare;
  const high = data.highShare;
  const mid = Math.max(0, 100 - low - high);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left bg-slate-950/70 border rounded-3xl p-4 flex flex-col gap-2 hover:border-primary-500/70 hover:-translate-y-0.5 transition transform shadow-sm cursor-pointer ${
        selected ? "border-primary-500/80" : "border-slate-800"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-50">
            {data.className}
          </div>
          <div className="text-[11px] text-slate-500">
            Орташа БЖБ/СОР:{" "}
            <span className="text-slate-100">
              {data.sorAvg.toFixed(1)} / 5.0
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Орташа ТЖБ/СОЧ:{" "}
            <span className="text-slate-100">
              {data.sochAvg.toFixed(1)} / 5.0
            </span>
          </div>
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full bg-slate-800 text-slate-300">
          Төмен нәтиже: {low}%
        </span>
      </div>

      {/* stacked bar */}
      {/* распределение результатов по уровням */}
      <div className="mt-2 space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Нәтижелер құрылымы</span>
        </div>

        {/* 2–3 */}
        <div className="flex items-center gap-2 text-[10px]">
          <span className="w-8 text-red-200">2–3</span>
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-red-500/80"
              style={{ width: `${low}%` }}
            />
          </div>
          <span className="w-10 text-right text-slate-300">{low}%</span>
        </div>

        {/* 3–4 */}
        <div className="flex items-center gap-2 text-[10px]">
          <span className="w-8 text-amber-200">3–4</span>
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-amber-400/80"
              style={{ width: `${mid}%` }}
            />
          </div>
          <span className="w-10 text-right text-slate-300">{mid}%</span>
        </div>

        {/* 4–5 */}
        <div className="flex items-center gap-2 text-[10px]">
          <span className="w-8 text-emerald-200">4–5</span>
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-400/80"
              style={{ width: `${high}%` }}
            />
          </div>
          <span className="w-10 text-right text-slate-300">{high}%</span>
        </div>
      </div>

      {/* subject at risk + совет */}
      <div className="mt-2 text-[11px] text-slate-300">
        Қиын пән:{" "}
        <span className="font-semibold text-amber-200">
          {data.worstSubject}
        </span>
      </div>
      <p className="text-[10px] text-slate-500 mt-1">
        Кеңес: {data.worstSubject} пәні бойынша БЖБ/ТЖБ нәтижелерін талдап,
        шағын топтармен мақсатты коррекциялық жұмыс ұйымдастыру.
      </p>
    </button>
  );
};
