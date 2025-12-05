// src/pages/ClassesAnalyticsPage.tsx
import React, { useMemo, useState } from "react";

type ClassStats = {
  name: string;
  students: number;
  girls: number;
  boys: number;
};

const CLASS_STATS: ClassStats[] = [
  { name: "7A", students: 22, girls: 14, boys: 8 },
  { name: "8A", students: 13, girls: 11, boys: 2 },
  { name: "8B", students: 12, girls: 7, boys: 5 },
  { name: "9A", students: 18, girls: 9, boys: 9 },
  { name: "9B", students: 19, girls: 13, boys: 6 },
  { name: "10A", students: 16, girls: 6, boys: 10 },
  { name: "10B", students: 15, girls: 7, boys: 8 },
  { name: "11A", students: 16, girls: 13, boys: 3 },
  { name: "11B", students: 19, girls: 14, boys: 5 },
];

type GradeFilter = "all" | "7" | "8" | "9" | "10" | "11";

const GRADE_FILTERS: { key: GradeFilter; label: string }[] = [
  { key: "all", label: "Барлық / Все" },
  { key: "7", label: "7 сынып" },
  { key: "8", label: "8 сынып" },
  { key: "9", label: "9 сынып" },
  { key: "10", label: "10 сынып" },
  { key: "11", label: "11 сынып" },
];

const percent = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 100);

const getGradeFromName = (name: string): GradeFilter => {
  const match = name.match(/^\d+/);
  if (!match) return "all";
  const val = match[0];
  if (["7", "8", "9", "10", "11"].includes(val)) {
    return val as GradeFilter;
  }
  return "all";
};

type ClassesAnalyticsPageProps = {
  onSelectClass: (className: string) => void;
};

export const ClassesAnalyticsPage: React.FC<ClassesAnalyticsPageProps> = ({
  onSelectClass,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeFilter>("all");

  const filteredClasses = useMemo(() => {
    if (selectedGrade === "all") return CLASS_STATS;
    return CLASS_STATS.filter(
      (cls) => getGradeFromName(cls.name) === selectedGrade
    );
  }, [selectedGrade]);

  const totals = useMemo(
    () =>
      filteredClasses.reduce(
        (acc, cls) => {
          acc.students += cls.students;
          acc.girls += cls.girls;
          acc.boys += cls.boys;
          return acc;
        },
        { students: 0, girls: 0, boys: 0 }
      ),
    [filteredClasses]
  );

  const girlsPercent = percent(totals.girls, totals.students);
  const boysPercent = percent(totals.boys, totals.students);

  return (
    <div className="space-y-6">
      {/* Заголовок + фильтры */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-1">
            Сынып аналитикасы / Аналитика по классам
          </h2>
          <p className="text-sm text-slate-400">
            Әр параллель мен сынып бойынша оқушылар саны мен ұл-қыз үлесін
            бақылау.
          </p>
        </div>

        <div className="inline-flex flex-wrap gap-2 rounded-full bg-slate-900/70 border border-slate-800 px-2 py-1">
          {GRADE_FILTERS.map((filter) => {
            const isActive = selectedGrade === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setSelectedGrade(filter.key)}
                className={`px-3 py-1.5 rounded-full text-xs md:text-sm transition whitespace-nowrap ${
                  isActive
                    ? "bg-primary-600 text-white shadow-soft"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Верхний блок: суммарные карточки + общий бар */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            title="Барлық оқушы / Всего учеников"
            value={totals.students}
            subtitle={
              selectedGrade === "all"
                ? "Мектеп бойынша жалпы саны"
                : "Таңдалған параллель бойынша"
            }
          />
          <SummaryCard
            title="Қыздар / Девочки"
            value={totals.girls}
            subtitle={`${girlsPercent}% жалпы құрамнан`}
            variant="pink"
          />
          <SummaryCard
            title="Ұлдар / Мальчики"
            value={totals.boys}
            subtitle={`${boysPercent}% жалпы құрамнан`}
            variant="blue"
          />
        </div>

        <div className="bg-slate-900/80 border border-slate-800/70 rounded-3xl p-4 md:p-5 shadow-soft flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold mb-1">
              Жыныс бойынша баланс / Гендерный баланс
            </h3>
            <p className="text-xs md:text-sm text-slate-400">
              Таңдалған сыныптар бойынша ұлдар мен қыздар қатынасы.
            </p>
          </div>

          <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden flex">
            <div
              className="h-full bg-fuchsia-500"
              style={{ width: `${girlsPercent}%` }}
            />
            <div
              className="h-full bg-sky-500"
              style={{ width: `${boysPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-300">
            <span>Қыздар / Девочки — {girlsPercent}%</span>
            <span>Ұлдар / Мальчики — {boysPercent}%</span>
          </div>

          <div className="text-[11px] text-slate-500 italic">
            Кеңес: баланс тым қатты бір жаққа ауысса, сыныптың психоәлеуметтік
            климатын бақылау маңызды.
          </div>
        </div>
      </section>

      {/* Карточки по классам */}
      <section className="bg-slate-900/80 border border-slate-800/70 rounded-3xl p-4 md:p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-semibold">
            Сыныптар кесіндісінде / По каждому классу
          </h3>
          <p className="text-xs text-slate-500">
            Барлық сыныптар: {filteredClasses.length}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => (
            <ClassCard
              key={cls.name}
              data={cls}
              onClick={() => onSelectClass(cls.name)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

type SummaryCardProps = {
  title: string;
  value: number;
  subtitle?: string;
  variant?: "default" | "pink" | "blue";
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

const ClassCard: React.FC<{ data: ClassStats; onClick: () => void }> = ({
  data,
  onClick,
}) => {
  const girlsPercent = percent(data.girls, data.students);
  const boysPercent = percent(data.boys, data.students);

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-slate-950/70 border border-slate-800 rounded-3xl p-4 flex flex-col gap-2 hover:border-primary-500/70 hover:-translate-y-0.5 transition transform shadow-sm cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{data.name}</div>
          <div className="text-[11px] text-slate-500">
            {data.students} оқушы · {data.girls} қыз · {data.boys} ұл
          </div>
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full bg-slate-800 text-slate-300">
          Орташа: {(data.students / 1).toFixed(0)} 👥
        </span>
      </div>

      <div className="mt-1">
        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
          <span>Қыздар / Девочки</span>
          <span>
            {data.girls} ({girlsPercent}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-fuchsia-500"
            style={{ width: `${girlsPercent}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
          <span>Ұлдар / Мальчики</span>
          <span>
            {data.boys} ({boysPercent}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-sky-500"
            style={{ width: `${boysPercent}%` }}
          />
        </div>
      </div>
    </button>
  );
};
