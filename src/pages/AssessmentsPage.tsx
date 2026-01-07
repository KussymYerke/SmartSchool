// src/pages/AssessmentsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n/i18n";

type QuarterKey = "Q1" | "Q2";
const QUARTERS: { key: QuarterKey; label: string }[] = [
  { key: "Q1", label: "1 тоқсан / 1 четверть" },
  { key: "Q2", label: "2 тоқсан / 2 четверть" },
  // { key: "Q3", label: "3 тоқсан / 3 четверть" },
  // { key: "Q4", label: "4 тоқсан / 4 четверть" },
];

type AssessmentSubject = {
  code: string;
  title: string;
  hasSOCH: boolean;
};

// ✅ ЕДИНЫЕ ПРЕДМЕТЫ ДЛЯ ВСЕХ КЛАССОВ
// ✅ В этих предметах есть и СОР и СОЧ
const ASSESSMENT_SUBJECTS: AssessmentSubject[] = [
  { code: "kz_lang", title: "Казахский язык", hasSOCH: true },
  { code: "kz_lit", title: "Казахский адебиет", hasSOCH: true },
  { code: "physics", title: "Физика", hasSOCH: true },
  { code: "chem", title: "Химия", hasSOCH: true },
  { code: "bio", title: "Биология", hasSOCH: true },
  { code: "eng", title: "Английский язык", hasSOCH: true },
  { code: "ru", title: "Русский язык", hasSOCH: true },
  { code: "algebra", title: "Алгебра", hasSOCH: true },
  { code: "history", title: "Казахстан тарих", hasSOCH: true },

  // ✅ Остальные предметы — только СОР
  { code: "geo", title: "География", hasSOCH: false },
  { code: "cs", title: "Информатика", hasSOCH: false },
];

type SubjectAssessStats = {
  subjectCode: string;
  subjectTitle: string;
  sorAvg: number; // БЖБ / СОР
  sochAvg: number | null; // ТЖБ / СОЧ (null если нет)
  lowShare: number; // % работ на "2" и "3"
};

type ClassAssessStats = {
  className: string;
  sorAvg: number;
  sochAvg: number;
  lowShare: number;
  highShare: number;
  worstSubjectTitle: string;
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

// ---------------- DEMO: базовые данные по классам ----------------
const CLASS_ASSESS_STATS_BASE: ClassAssessStats[] = [
  {
    className: "7A",
    sorAvg: 3.9,
    sochAvg: 3.7,
    lowShare: 15,
    highShare: 55,
    worstSubjectTitle: "Алгебра",
  },
  {
    className: "8A",
    sorAvg: 3.6,
    sochAvg: 3.3,
    lowShare: 26,
    highShare: 40,
    worstSubjectTitle: "Физика",
  },
  {
    className: "8B",
    sorAvg: 3.4,
    sochAvg: 3.1,
    lowShare: 32,
    highShare: 35,
    worstSubjectTitle: "Алгебра",
  },
  {
    className: "9A",
    sorAvg: 3.8,
    sochAvg: 3.5,
    lowShare: 21,
    highShare: 48,
    worstSubjectTitle: "Русский язык",
  },
  {
    className: "9B",
    sorAvg: 3.5,
    sochAvg: 3.2,
    lowShare: 28,
    highShare: 39,
    worstSubjectTitle: "Физика",
  },
  {
    className: "10A",
    sorAvg: 3.7,
    sochAvg: 3.4,
    lowShare: 24,
    highShare: 43,
    worstSubjectTitle: "Физика",
  },
  {
    className: "10B",
    sorAvg: 3.6,
    sochAvg: 3.3,
    lowShare: 27,
    highShare: 38,
    worstSubjectTitle: "Химия",
  },
  {
    className: "11A",
    sorAvg: 4.0,
    sochAvg: 3.8,
    lowShare: 14,
    highShare: 60,
    worstSubjectTitle: "Английский язык",
  },
  {
    className: "11B",
    sorAvg: 3.9,
    sochAvg: 3.7,
    lowShare: 17,
    highShare: 52,
    worstSubjectTitle: "Алгебра",
  },
];

// ---------------- helpers (quarter tweak) ----------------
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

const quarterDelta = (q: QuarterKey) => {
  // лёгкая вариативность по четвертям (demo)
  switch (q) {
    case "Q1":
      return 0.0;
    case "Q2":
      return -0.1;
    default:
      return 0.0;
  }
};

const quarterLowShareDelta = (q: QuarterKey) => {
  switch (q) {
    case "Q1":
      return 0;
    case "Q2":
      return 2;
    default:
      return 0;
  }
};

// Генерация предметной детализации на основе класса + четверти,
// но со строгим правилом: у некоторых предметов нет СОЧ => sochAvg = null.
const buildSubjectsForClass = (
  cls: ClassAssessStats,
  q: QuarterKey
): SubjectAssessStats[] => {
  const qd = quarterDelta(q);
  const qLowD = quarterLowShareDelta(q);

  // базовый уровень класса
  const baseSor = cls.sorAvg + qd;
  const baseSoch = cls.sochAvg + qd;

  // небольшие “сдвиги” по предметам (детерминированно, без рандома)
  const subjectOffsets: Record<string, number> = {
    algebra: -0.2,
    physics: -0.25,
    chem: -0.15,
    bio: -0.05,
    eng: 0.05,
    ru: 0.0,
    kz_lang: 0.05,
    kz_lit: 0.0,
    history: -0.05,
    cs: 0.2,
    geo: 0.05,
    pe: 0.25,
    art: 0.15,
  };

  return ASSESSMENT_SUBJECTS.map((s) => {
    const off = subjectOffsets[s.code] ?? 0;
    const sorAvg = round1(clamp(baseSor + off, 2.6, 5.0));

    const sochAvg = s.hasSOCH
      ? round1(clamp(baseSoch + off * 0.8, 2.6, 5.0))
      : null;

    // lowShare: в “слабых” предметах выше процент
    const lowBias = off < 0 ? Math.abs(off) * 40 : 0;
    const lowShare = Math.round(clamp(cls.lowShare + qLowD + lowBias, 5, 60));

    return {
      subjectCode: s.code,
      subjectTitle: s.title,
      sorAvg,
      sochAvg,
      lowShare,
    };
  });
};

const computeWorstSubject = (rows: SubjectAssessStats[]) => {
  if (!rows.length) return "";
  // худший — где lowShare выше, при равенстве — ниже sorAvg
  const sorted = [...rows].sort((a, b) => {
    if (b.lowShare !== a.lowShare) return b.lowShare - a.lowShare;
    return a.sorAvg - b.sorAvg;
  });
  return sorted[0]?.subjectTitle ?? "";
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
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(148, 163, 184, 0.4)"
          strokeWidth={stroke}
          fill="none"
        />
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
  const [quarter, setQuarter] = useState<QuarterKey>("Q1");

  const filteredClasses = useMemo(() => {
    return gradeFilter === "all"
      ? CLASS_ASSESS_STATS_BASE
      : CLASS_ASSESS_STATS_BASE.filter(
          (cls) => getGradeFromClassName(cls.className) === gradeFilter
        );
  }, [gradeFilter]);

  // ✅ чтобы не было setState внутри useMemo — сбрасываем выбор через useEffect
  useEffect(() => {
    if (
      selectedClassName &&
      !filteredClasses.some((c) => c.className === selectedClassName)
    ) {
      setSelectedClassName(null);
    }
  }, [filteredClasses, selectedClassName]);

  const selectedClass = useMemo(() => {
    if (!selectedClassName) return null;
    return (
      CLASS_ASSESS_STATS_BASE.find((c) => c.className === selectedClassName) ??
      null
    );
  }, [selectedClassName]);

  // ✅ Верхние summary и график теперь зависят от выбранного класса:
  // - если класс выбран -> показываем его данные
  // - иначе -> показываем агрегат по фильтру (параллель/все)
  const summarySorAvg = useMemo(() => {
    if (selectedClass)
      return round1(clamp(selectedClass.sorAvg + quarterDelta(quarter), 2, 5));
    if (!filteredClasses.length) return 0;
    const sum = filteredClasses.reduce(
      (acc, c) => acc + (c.sorAvg + quarterDelta(quarter)),
      0
    );
    return round1(sum / filteredClasses.length);
  }, [filteredClasses, selectedClass, quarter]);

  const summarySochAvg = useMemo(() => {
    if (selectedClass)
      return round1(clamp(selectedClass.sochAvg + quarterDelta(quarter), 2, 5));
    if (!filteredClasses.length) return 0;
    const sum = filteredClasses.reduce(
      (acc, c) => acc + (c.sochAvg + quarterDelta(quarter)),
      0
    );
    return round1(sum / filteredClasses.length);
  }, [filteredClasses, selectedClass, quarter]);

  const summaryLowShare = useMemo(() => {
    const d = quarterLowShareDelta(quarter);
    if (selectedClass)
      return Math.round(clamp(selectedClass.lowShare + d, 0, 100));
    if (!filteredClasses.length) return 0;
    const sum = filteredClasses.reduce(
      (acc, c) => acc + clamp(c.lowShare + d, 0, 100),
      0
    );
    return Math.round(sum / filteredClasses.length);
  }, [filteredClasses, selectedClass, quarter]);

  // ✅ График предметов “сверху”:
  // - если выбран класс -> предметы по классу (единый список предметов)
  // - иначе -> агрегируем по фильтру (среднее по классам)
  const topSubjectsData = useMemo((): SubjectAssessStats[] => {
    if (selectedClass) {
      return buildSubjectsForClass(selectedClass, quarter);
    }

    if (!filteredClasses.length) return [];

    const perClass = filteredClasses.map((c) =>
      buildSubjectsForClass(c, quarter)
    );

    // усредняем по предметам (subjectCode)
    const map = new Map<
      string,
      {
        sumSor: number;
        sumSoch: number;
        cntSoch: number;
        sumLow: number;
        cnt: number;
        title: string;
      }
    >();

    for (const rows of perClass) {
      for (const r of rows) {
        const prev = map.get(r.subjectCode) ?? {
          sumSor: 0,
          sumSoch: 0,
          cntSoch: 0,
          sumLow: 0,
          cnt: 0,
          title: r.subjectTitle,
        };
        prev.sumSor += r.sorAvg;
        if (typeof r.sochAvg === "number") {
          prev.sumSoch += r.sochAvg;
          prev.cntSoch += 1;
        }
        prev.sumLow += r.lowShare;
        prev.cnt += 1;
        prev.title = r.subjectTitle;
        map.set(r.subjectCode, prev);
      }
    }

    return ASSESSMENT_SUBJECTS.map((s) => {
      const v = map.get(s.code);
      if (!v || v.cnt === 0) {
        return {
          subjectCode: s.code,
          subjectTitle: s.title,
          sorAvg: 0,
          sochAvg: s.hasSOCH ? 0 : null,
          lowShare: 0,
        };
      }
      const sorAvg = round1(v.sumSor / v.cnt);
      const sochAvg =
        s.hasSOCH && v.cntSoch > 0 ? round1(v.sumSoch / v.cntSoch) : null;
      const lowShare = Math.round(v.sumLow / v.cnt);
      return {
        subjectCode: s.code,
        subjectTitle: s.title,
        sorAvg,
        sochAvg,
        lowShare,
      };
    });
  }, [selectedClass, filteredClasses, quarter]);

  const worstSubjectTitle = useMemo(
    () => computeWorstSubject(topSubjectsData),
    [topSubjectsData]
  );

  return (
    <div className="space-y-6">
      {/* Header + filters */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-1 text-slate-50">
            {t("assessments.title", "БЖБ / ТЖБ · СОР / СОЧ")}
          </h2>

          <p className="text-sm text-slate-400">
            {selectedClassName
              ? `Сынып: ${selectedClassName} · ${
                  QUARTERS.find((x) => x.key === quarter)?.label
                }`
              : `Параллель/мектеп: ${
                  GRADE_FILTERS.find((x) => x.key === gradeFilter)?.label
                } · ${QUARTERS.find((x) => x.key === quarter)?.label}`}
          </p>
        </div>

        <div className="flex flex-col gap-2 items-start md:items-end">
          {/* Quarter tabs */}
          <div className="inline-flex flex-wrap gap-2 rounded-full bg-slate-900/70 border border-slate-800 px-2 py-1">
            {QUARTERS.map((q) => {
              const active = quarter === q.key;
              return (
                <button
                  key={q.key}
                  onClick={() => setQuarter(q.key)}
                  className={`px-3 py-1.5 rounded-full text-xs md:text-sm transition whitespace-nowrap ${
                    active
                      ? "bg-primary-600 text-white shadow-soft"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {q.key}
                </button>
              );
            })}
          </div>

          {/* Grade filters */}
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
        </div>
      </section>

      {/* ✅ Теперь summary сверху над "Пәндер бойынша..." */}
      <section className="bg-slate-900/80 border border-slate-800/70 rounded-3xl p-4 md:p-5 shadow-soft space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            title="Орташа БЖБ / СОР"
            value={summarySorAvg}
            subtitle="/ 5.0"
          />
          <SummaryCard
            title="Орташа ТЖБ / СОЧ"
            value={summarySochAvg}
            subtitle="/ 5.0"
            variant="blue"
          />
          <SummaryCard
            title="Төмен нәтиже үлесі"
            value={`${summaryLowShare}%`}
            subtitle="2–3 алған жұмыстар"
            variant="danger"
          />
        </div>

        <div className="text-[11px] text-slate-400 px-1">
          Қиын пән (авто):{" "}
          <span className="font-semibold text-amber-200">
            {worstSubjectTitle || "—"}
          </span>
        </div>

        {/* Subjects block */}
        <div className="pt-2">
          <h3 className="text-sm font-semibold text-slate-50 mb-1">
            Пәндер бойынша (таңдалған бөлім үшін)
          </h3>
          <p className="text-xs text-slate-400">
            Егер сынып таңдалса — көрсеткіштер сол сынып бойынша. Әйтпесе —
            таңдалған параллель/мектеп бойынша. Предметтер барлық сыныпта
            бірдей. СОЧ тек кейбір пәндерде көрсетіледі.
          </p>
        </div>

        <SubjectsBarChart data={topSubjectsData} />
      </section>

      {/* По классам (карточки) */}
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
              quarter={quarter}
              onClick={() =>
                setSelectedClassName((prev) =>
                  prev === cls.className ? null : cls.className
                )
              }
            />
          ))}
        </div>

        {/* ✅ Нижний блок детализации УБРАН */}
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
    // ✅ По 3 предмета в ряд на lg+, по 2 на sm, по 1 на xs
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((row) => (
        <div
          key={row.subjectCode}
          className="rounded-3xl bg-slate-950/60 border border-slate-800 p-4 flex gap-4 items-center hover:bg-slate-900 transition"
        >
          <div className="flex gap-3">
            <div className="text-sky-400">
              <RadialCircle value={row.sorAvg} label="БЖБ / СОР" />
            </div>

            {/* ✅ СОЧ показываем только если есть */}
            {typeof row.sochAvg === "number" && (
              <div className="text-violet-400">
                <RadialCircle value={row.sochAvg} label="ТЖБ / СОЧ" />
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-100">
              {row.subjectTitle}
            </span>

            <span className="text-xs text-slate-400 mt-1">
              БЖБ/СОР орташа балл:{" "}
              <span className="text-sky-300 font-medium">
                {row.sorAvg.toFixed(1)} / 5.0
              </span>
            </span>

            {typeof row.sochAvg === "number" ? (
              <span className="text-xs text-slate-400">
                ТЖБ/СОЧ орташа балл:{" "}
                <span className="text-violet-300 font-medium">
                  {row.sochAvg.toFixed(1)} / 5.0
                </span>
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                ТЖБ/СОЧ: жоқ (тек СОР)
              </span>
            )}

            <span className="text-xs text-amber-300 mt-2">
              🔥 Төмен нәтиже үлесі: {row.lowShare}%{" "}
              <span className="text-slate-400">(2–3 алған жұмыстар)</span>
            </span>
          </div>
        </div>
      ))}
      <p className="text-[10px] text-slate-500 col-span-full mt-1">
        Кеңес: СОР төмен пәндер — күнделікті коррекция, ал СОЧ төмен пәндер —
        тоқсандық қорытынды дайындықты күшейту.
      </p>
    </div>
  );
};

// ---------- ClassAssessCard ----------
const ClassAssessCard: React.FC<{
  data: ClassAssessStats;
  selected: boolean;
  quarter: QuarterKey;
  onClick: () => void;
}> = ({ data, selected, quarter, onClick }) => {
  const d = quarterLowShareDelta(quarter);

  const low = Math.round(clamp(data.lowShare + d, 0, 100));
  const high = Math.round(clamp(data.highShare - d, 0, 100));
  const mid = Math.max(0, 100 - low - high);

  const sor = round1(clamp(data.sorAvg + quarterDelta(quarter), 2, 5));
  const soch = round1(clamp(data.sochAvg + quarterDelta(quarter), 2, 5));

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
            <span className="text-slate-100">{sor.toFixed(1)} / 5.0</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Орташа ТЖБ/СОЧ:{" "}
            <span className="text-slate-100">{soch.toFixed(1)} / 5.0</span>
          </div>
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full bg-slate-800 text-slate-300">
          Төмен нәтиже: {low}%
        </span>
      </div>

      <div className="mt-2 space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Нәтижелер құрылымы</span>
        </div>

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

      <div className="mt-2 text-[11px] text-slate-300">
        Қиын пән:{" "}
        <span className="font-semibold text-amber-200">
          {data.worstSubjectTitle}
        </span>
      </div>

      <p className="text-[10px] text-slate-500 mt-1">
        Кеңес: {data.worstSubjectTitle} пәні бойынша осы тоқсанның СОР/СОЧ
        нәтижелерін талдап, мақсатты коррекциялық жұмыс ұйымдастыру.
      </p>
    </button>
  );
};
