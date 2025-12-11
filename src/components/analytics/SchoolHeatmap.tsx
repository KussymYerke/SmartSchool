// src/components/analytics/SchoolHeatmap.tsx
import React, { useMemo } from "react";
import { STUDENTS } from "../../data/students";

export const SchoolHeatmap: React.FC = () => {
  const byClass = useMemo(() => {
    const map = new Map<
      string,
      { total: number; highRisk: number; mediumRisk: number }
    >();

    for (const s of STUDENTS) {
      const key = s.className;
      if (!map.has(key)) {
        map.set(key, { total: 0, highRisk: 0, mediumRisk: 0 });
      }
      const item = map.get(key)!;
      item.total += 1;

      const score =
        // можно использовать calculateRiskScore из riskUtils
        (s.unexcusedAbsences ?? 0) * 2 +
        (s.teacherAlerts ?? 0) * 2 +
        (s.lowActivity ? 2 : 0) +
        (s.avgGrade < 3.0 ? 3 : 0);

      if (score >= 10) item.highRisk += 1;
      else if (score >= 6) item.mediumRisk += 1;
    }

    return Array.from(map.entries()).map(([className, v]) => ({
      className,
      ...v,
    }));
  }, []);

  const bySubject = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of STUDENTS) {
      for (const subj of s.subjectsAtRisk) {
        map.set(subj, (map.get(subj) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const byMonth = useMemo(() => {
    // условно распределим отсутствие по месяцам
    const months = ["Қыр", "Қаз", "Қар", "Жел"];
    const result = months.map((m) => ({ label: m, abs: 0 }));
    for (const s of STUDENTS) {
      const q = Math.max(1, Math.min(4, Math.round(s.absences / 2) || 1));
      for (let i = 0; i < q && i < result.length; i++) {
        result[i].abs += Math.max(0, Math.round(s.absences / q));
      }
    }
    return result;
  }, []);

  const maxAbs = byMonth.reduce((m, d) => Math.max(m, d.abs), 0);

  const clsIntensity = (value: number, total: number) => {
    if (!total) return "bg-slate-800 text-slate-300";
    const ratio = value / total;
    if (ratio >= 0.4) return "bg-red-500/50 text-red-50";
    if (ratio >= 0.25) return "bg-orange-500/40 text-orange-50";
    if (ratio >= 0.1) return "bg-amber-500/30 text-amber-50";
    return "bg-emerald-500/20 text-emerald-50";
  };

  const monthIntensity = (v: number) => {
    if (maxAbs === 0) return "bg-slate-800 text-slate-300";
    const r = v / maxAbs;
    if (r >= 0.7) return "bg-red-500/50 text-red-50";
    if (r >= 0.4) return "bg-orange-500/40 text-orange-50";
    if (r >= 0.2) return "bg-amber-500/30 text-amber-50";
    return "bg-emerald-500/20 text-emerald-50";
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Классы с наибольшим риском */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
        <h3 className="text-sm font-semibold text-slate-50 mb-2">
          Риск по классам
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Класстар бойынша тәуекелдегі оқушылар үлесі.
        </p>
        <div className="space-y-2 text-xs">
          {byClass.map((c) => {
            const risk = c.highRisk + c.mediumRisk;
            return (
              <div
                key={c.className}
                className={
                  "flex items-center justify-between rounded-xl px-3 py-2 border border-slate-700/50 " +
                  clsIntensity(risk, c.total)
                }
              >
                <span className="font-semibold">{c.className}</span>
                <span>
                  {risk}/{c.total} тәуекелде
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Предметы с наибольшим провалом */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
        <h3 className="text-sm font-semibold text-slate-50 mb-2">
          Қиын пәндер (мектеп бойынша)
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Қай пәндер бойынша оқушылар жиі қиналады.
        </p>
        <div className="space-y-1.5 text-xs">
          {bySubject.map((s) => (
            <div
              key={s.subject}
              className="flex items-center justify-between rounded-xl px-3 py-1.5 bg-slate-800/60 border border-slate-700/60"
            >
              <span className="font-semibold">{s.subject}</span>
              <span className="text-slate-200">{s.count} оқушы</span>
            </div>
          ))}
          {!bySubject.length && (
            <p className="text-xs text-slate-500">
              Қиын пәндер бойынша дерек әзірге жоқ.
            </p>
          )}
        </div>
      </div>

      {/* Месяцы с самыми критичными пропусками */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
        <h3 className="text-sm font-semibold text-slate-50 mb-2">
          Қатыспау heatmap (айлар бойынша)
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Қай айларда қатыспау саны көбірек.
        </p>
        <div className="grid grid-cols-4 gap-2 text-[11px]">
          {byMonth.map((m) => (
            <div
              key={m.label}
              className={
                "rounded-xl px-2 py-2 flex flex-col items-center justify-center border border-slate-700/40 " +
                monthIntensity(m.abs)
              }
            >
              <span className="font-semibold">{m.label}</span>
              <span className="mt-1">{m.abs} күн</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-2">
          Бұл карта мектеп бойынша жүйелі кезеңдердегі проблемаларды көруге
          көмектеседі, тек жеке оқушыларды емес.
        </p>
      </div>
    </div>
  );
};
