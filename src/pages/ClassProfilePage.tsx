// src/pages/ClassProfilePage.tsx
import React, { useMemo, useState, useEffect } from "react";
import { STUDENTS } from "../data/students";
import {
  calculateRiskScore,
  getRiskLevel,
  type Student,
} from "../data/riskUtils";
import { getClassAIRecommendations } from "../services/ai";

type ClassProfilePageProps = {
  className: string;
  onBack: () => void;
};

type Totals = {
  total: number;
  girls: number;
  boys: number;
  avgGrade: number;
  riskCount: number;
  absences: number;
};

export const ClassProfilePage: React.FC<ClassProfilePageProps> = ({
  className,
  onBack,
}) => {
  const students = useMemo(
    () => STUDENTS.filter((s) => s.className === className),
    [className]
  );

  const totals: Totals = useMemo(() => {
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

  // ---- Демо-данные для графика по четвертям ----
  const quarterGrades = useMemo(() => {
    const base = totals.avgGrade || 3.5;
    const clamp = (v: number) => Math.max(2, Math.min(5, v));

    return [
      { label: "1 тоқсан", value: clamp(base - 0.2) },
      { label: "2 тоқсан", value: clamp(base) },
    ];
  }, [totals.avgGrade]);

  // ---- Демо-heatmap пропусков по месяцам ----
  const absencesByMonth = useMemo(() => {
    const months = [
      { key: "sep", label: "Қыр" },
      { key: "oct", label: "Қаз" },
      { key: "nov", label: "Қар" },
      { key: "dec", label: "Жел" },
    ];
    const weights = [0.07, 0.09, 0.1, 0.08, 0.09, 0.1, 0.12, 0.17, 0.18];
    const total = totals.absences || 0;

    return months.map((m, idx) => ({
      ...m,
      count: Math.round(total * (weights[idx] ?? 0.1)),
    }));
  }, [totals.absences]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <button
            onClick={onBack}
            className="mb-2 inline-flex items-center text-xs px-2.5 py-1.5 rounded-full border border-slate-700/80 text-slate-300 hover:bg-slate-800/70 transition"
          >
            ← Артқа / Назад
          </button>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
            {className} · сынып профилі
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
            Сыныптың қысқа портреті: құрамы, орташа баға, қатыспау және AI
            анықтаған тәуекел топ.
          </p>
        </div>

        <div className="hidden md:flex flex-col items-end text-[11px] text-slate-400">
          <span>Барлығы: {totals.total} оқушы</span>
          <span>
            Қыздар: {totals.girls} · Ұлдар: {totals.boys}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
          title="Қауіп тобында"
          value={totals.riskCount}
          subtitle="AI белгіледі"
          variant="danger"
        />
      </div>

      {/* Графики + AI-рекомендации */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Line chart успеваемости */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-4 md:p-5 flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-50 mb-1">
              Тоқсан бойынша үлгерім
            </h3>
            <p className="text-xs text-slate-400">
              1–4 тоқсан бойынша орташа баға. Кейін нақты БЖБ/ТЖБ деректерімен
              алмастыруға болады.
            </p>
          </div>
          <ClassQuarterLineChart data={quarterGrades} />
        </div>

        {/* Heatmap пропусков */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-4 md:p-5 flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-50 mb-1">
              Қатыспау жыл бойы
            </h3>
            <p className="text-xs text-slate-400">
              Қай айларда қатыспау көбірек. Қою түс — көп қатыспау.
            </p>
          </div>
          <AbsencesHeatmap data={absencesByMonth} />
        </div>

        {/* AI-рекомендации */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-4 md:p-5 flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-50 mb-1">
              AI-рекомендациялар по классу
            </h3>
            <p className="text-xs text-slate-400">
              Бұл жерде нақты Groq моделінен келетін ұсыныстар көрсетіледі.
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
      <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 text-[11px] uppercase tracking-wide text-slate-400 bg-slate-900/90 border-b border-slate-800">
          <div className="col-span-4">Оқушы</div>
          <div className="col-span-2 text-center">Орта баға</div>
          <div className="col-span-2 text-center">Қатыспау</div>
          <div className="col-span-2 text-center">Қиын пәндер</div>
          <div className="col-span-2 text-center">Тәуекел</div>
        </div>

        <div className="divide-y divide-slate-800/80">
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
                className="px-4 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-slate-900/60 transition-colors"
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
                  <span>Барлығы: {s.absences}</span>
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
                      className="text-[11px] px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-200 border border-indigo-500/30"
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
      : "from-indigo-500/80 to-cyan-500/40";

  return (
    <div className="relative overflow-hidden bg-slate-900/80 border border-slate-800/70 rounded-3xl p-4 shadow-soft">
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-br ${accentClass} opacity-20`}
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
        className="w-full h-24 text-indigo-400"
      >
        {/* baseline */}
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
            className="fill-indigo-400"
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
        Егер 3–4 тоқсанда баға түссе – БЖБ/ТЖБ нәтижесін және үй тапсырмасын
        талдау керек.
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
    <div className="space-y-2">
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
      </div>
      <p className="text-[10px] text-slate-500">
        Қызылға жақын айлар — сыныптың қатысуын ерекше бақылау керек кезеңдер.
      </p>
    </div>
  );
};

// ---------- AI-рекомендации по классу (реальный AI) ----------
const ClassAiRecommendations: React.FC<{
  className: string;
  totals: Totals;
  students: Student[];
}> = ({ className, totals, students }) => {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Подготовим "контекст" для AI, но без гигантских объектов
  useEffect(() => {
    let cancelled = false;

    async function run() {
      // если нет учеников — нет смысла грузить модель
      if (!students.length) {
        setText(
          "Бұл сыныпқа оқушылар енгізілмеген, сондықтан AI кеңес бере алмайды."
        );
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const ctx = {
          className,
          totals,
          // Чтобы не слать огромный массив, ограничим 15 учениками
          students: students.slice(0, 15).map((s) => ({
            fullName: s.fullName,
            avgGrade: s.avgGrade,
            unexcusedAbsences: s.unexcusedAbsences,
            subjectsAtRisk: s.subjectsAtRisk,
          })),
        };

        const resp = await getClassAIRecommendations(ctx, "kk");

        if (!cancelled) {
          setText(resp);
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) {
          setError("AI-қызметі қолжетімсіз. Кейінірек қайталап көріңіз.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [
    className,
    totals.total,
    totals.avgGrade,
    totals.riskCount,
    totals.absences,
    students,
  ]);

  if (loading && !text) {
    return (
      <div className="text-xs text-slate-400 flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded-full border border-emerald-400 border-t-transparent animate-spin" />
        <span>AI ұсыныстарын есептеп жатырмыз...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-[11px] rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-red-200">
        {error}
      </div>
    );
  }

  if (!text) {
    return (
      <div className="text-xs text-slate-500">
        AI ұсынысы әлі дайын емес. Бір сәттен кейін қайта жүктеп көріңіз.
      </div>
    );
  }

  // Разбиваем текст на абзацы по пустым строкам
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="text-xs text-slate-200 space-y-2">
      <p className="text-[11px] text-slate-400">
        Сынып:{" "}
        <span className="font-semibold text-slate-100 inline-block ml-1">
          {className}
        </span>
      </p>

      <div className="rounded-xl bg-slate-950/70 border border-slate-700/60 px-3 py-2.5 text-xs max-h-56 overflow-y-auto">
        <div className="space-y-2 leading-relaxed">
          {paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-slate-500">
        Кеңестер AI моделінен автоматты түрде жасалды. Завуч пен сынып жетекші
        нақты жағдайға қарай түзетіп қолдана алады.
      </p>
    </div>
  );
};
