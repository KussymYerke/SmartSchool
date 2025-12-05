// src/pages/RiskStudentsPage.tsx
import React, { useMemo, useState } from "react";
import { STUDENTS } from "../data/students";
import {
  calculateRiskScore,
  getRiskLevel,
  isAtRisk,
  type RiskLevel,
} from "../data/riskUtils";
import { useI18n } from "../i18n/i18n";

type RiskStudentsPageProps = {
  onSelectStudent: (id: number) => void;
};

const riskColorClass: Record<RiskLevel, string> = {
  none: "bg-slate-500/10 text-slate-300 border border-slate-600/40",
  low: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40",
  medium: "bg-amber-500/10 text-amber-300 border border-amber-500/40",
  high: "bg-red-500/10 text-red-300 border border-red-500/40",
};

const riskLabel: Record<RiskLevel, string> = {
  none: "Норма",
  low: "Низкий риск",
  medium: "Орташа риск",
  high: "Жоғары риск",
};

export const RiskStudentsPage: React.FC<RiskStudentsPageProps> = ({
  onSelectStudent,
}) => {
  const { t } = useI18n();
  const [selectedClass, setSelectedClass] = useState<string | "all">("all");

  const classOptions = useMemo(() => {
    const set = new Set(STUDENTS.map((s) => s.className));
    return Array.from(set).sort();
  }, []);

  const riskStudents = useMemo(() => {
    return STUDENTS.filter((s) =>
      selectedClass === "all" ? true : s.className === selectedClass
    )
      .filter((s) => isAtRisk(s))
      .map((s) => {
        const score = calculateRiskScore(s);
        const level = getRiskLevel(score);
        return { ...s, riskScore: score, riskLevel: level };
      })
      .sort((a, b) => b.riskScore - a.riskScore); // самые проблемные сверху
  }, [selectedClass]);

  return (
    <div className="space-y-6">
      {/* Header + фильтр по классу */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
            {t("risk.title", "Ученики в группе риска")}
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            {t(
              "risk.subtitle",
              "AI-мониторинг отмечает учеников с падающими оценками, пропусками и другими тревожными сигналами."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {t("risk.classFilter", "Сынып:")}
          </span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value as any)}
            className="rounded-xl bg-slate-800/80 border border-slate-600/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
          >
            <option value="all">
              {t("risk.allClasses", "Барлық сыныптар")}
            </option>
            {classOptions.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-700/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
            {t("risk.count", "Группа риска")}
          </p>
          <p className="text-2xl font-semibold text-slate-50">
            {riskStudents.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {selectedClass === "all"
              ? t("risk.countHintAll", "Барлық сыныптар бойынша")
              : t("risk.countHintClass", "Таңдалған сынып бойынша")}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-700/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
            {t("risk.high", "Жоғары риск")}
          </p>
          <p className="text-2xl font-semibold text-red-400">
            {riskStudents.filter((s) => s.riskLevel === "high").length}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-700/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
            {t("risk.medium", "Орташа риск")}
          </p>
          <p className="text-2xl font-semibold text-amber-300">
            {riskStudents.filter((s) => s.riskLevel === "medium").length}
          </p>
        </div>
      </div>

      {/* Таблица / список */}
      <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 text-xs uppercase tracking-wide text-slate-400 bg-slate-900/80 border-b border-slate-800">
          <div className="col-span-3">{t("risk.student", "Оқушы")}</div>
          <div className="col-span-1 text-center">
            {t("risk.class", "Сынып")}
          </div>
          <div className="col-span-1 text-center">
            {t("risk.avgGrade", "Орта баға")}
          </div>
          <div className="col-span-1 text-center">
            {t("risk.trend", "Тренд")}
          </div>
          <div className="col-span-2 text-center">
            {t("risk.absences", "Қатыспау")}
          </div>
          <div className="col-span-2 text-center">
            {t("risk.subjects", "Қиын пәндер")}
          </div>
          <div className="col-span-2 text-center">
            {t("risk.level", "Риск деңгейі")}
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          {riskStudents.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-400 text-center">
              {t(
                "risk.empty",
                "Бұл фильтр бойынша тәуекел тобында оқушылар жоқ."
              )}
            </div>
          )}

          {riskStudents.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectStudent(s.id)}
              className="px-4 py-4 hover:bg-slate-900/60 transition-colors grid grid-cols-1 md:grid-cols-12 gap-3 items-center cursor-pointer"
            >
              {/* Имя + гендер */}
              <div className="md:col-span-3">
                <p className="text-sm font-medium text-slate-50 underline-offset-2 hover:underline">
                  {s.fullName}
                </p>
                <p className="text-xs text-slate-400">
                  {s.gender === "male" ? "Ұл бала" : "Қыз бала"}
                </p>
              </div>

              {/* Класс */}
              <div className="md:col-span-1 text-sm text-slate-200 md:text-center">
                {s.className}
              </div>

              {/* Средний балл */}
              <div className="md:col-span-1 text-sm md:text-center">
                <span className="font-semibold text-slate-50">
                  {s.avgGrade.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 ml-1">/ 5.0</span>
              </div>

              {/* Тренд */}
              <div className="md:col-span-1 text-sm md:text-center">
                <span
                  className={
                    s.gradeTrend > 0
                      ? "text-emerald-400"
                      : s.gradeTrend < 0
                      ? "text-red-400"
                      : "text-slate-300"
                  }
                >
                  {s.gradeTrend > 0 ? "+" : ""}
                  {s.gradeTrend.toFixed(1)}
                </span>
              </div>

              {/* Пропуски */}
              <div className="md:col-span-2 text-xs md:text-center text-slate-200">
                <span className="inline-flex items-center justify-center rounded-full bg-slate-800/80 px-2 py-1 mr-2">
                  {t("risk.abs.total", "Барлығы")}: {s.absences}
                </span>
                <span className="inline-flex items-center justify-center rounded-full bg-red-500/10 text-red-300 border border-red-500/30 px-2 py-1">
                  {t("risk.abs.unexcused", "Себепсіз")}: {s.unexcusedAbsences}
                </span>
              </div>

              {/* Предметы риска */}
              <div className="md:col-span-2 flex flex-wrap gap-1">
                {s.subjectsAtRisk.length === 0 && (
                  <span className="text-xs text-slate-500">
                    {t("risk.noSubjects", "Қиын пәндер жоқ")}
                  </span>
                )}
                {s.subjectsAtRisk.map((subj) => (
                  <span
                    key={subj}
                    className="text-xs px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-200 border border-indigo-500/30"
                  >
                    {subj}
                  </span>
                ))}
              </div>

              {/* Уровень риска */}
              <div className="md:col-span-2 flex md:justify-center">
                <span
                  className={
                    "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium " +
                    riskColorClass[s.riskLevel]
                  }
                >
                  {riskLabel[s.riskLevel]}
                  <span className="ml-2 text-[10px] text-slate-300/80">
                    score: {s.riskScore}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
