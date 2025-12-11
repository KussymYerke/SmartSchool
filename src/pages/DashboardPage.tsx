import React from "react";
import type { PageKey } from "../App";
import { StatCard } from "../components/ui/StatCard";
import { useI18n } from "../i18n/i18n";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { SchoolHeatmap } from "../components/analytics/SchoolHeatmap";

type Props = {
  onNavigate: (page: PageKey) => void;
};

const attendanceData = [
  { week: "1-апта", attendance: 96, discipline: 4.7 },
  { week: "2-апта", attendance: 94, discipline: 4.5 },
  { week: "3-апта", attendance: 92, discipline: 4.3 },
  { week: "4-апта", attendance: 90, discipline: 4.1 },
];

const riskData = [
  { segment: "5–7 сынып", risk: 3 },
  { segment: "8–9 сынып", risk: 6 },
  { segment: "10–11 сынып", risk: 4 },
];

export const DashboardPage: React.FC<Props> = ({ onNavigate }) => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Overview */}
      <section>
        <h2 className="text-lg md:text-xl font-semibold mb-1">
          {t("dashboard.overview.title")}
        </h2>
        <p className="text-sm text-slate-400">
          {t("dashboard.overview.subtitle")}
        </p>
      </section>

      {/* Жалпы статистика карточкалары */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("dashboard.stat.students.label")}
          value={150}
          subtitle={t("dashboard.stat.students.subtitle")}
          trendLabel={t("dashboard.stat.students.trendLabel")}
          trendValue={t("dashboard.stat.students.trendValue")}
          accent="green"
          onClick={() => onNavigate("classes")}
        />
        <StatCard
          label={t("dashboard.stat.excellents.label")}
          value={"18%"}
          subtitle={t("dashboard.stat.excellents.subtitle")}
          trendLabel={t("dashboard.stat.excellents.trendLabel")}
          trendValue={t("dashboard.stat.excellents.trendValue")}
          accent="blue"
          onClick={() => onNavigate("classes")}
        />
        <StatCard
          label={t("dashboard.stat.teachers.label")}
          value={54}
          subtitle={t("dashboard.stat.teachers.subtitle")}
          trendLabel={t("dashboard.stat.teachers.trendLabel")}
          trendValue={t("dashboard.stat.teachers.trendValue")}
          accent="orange"
          onClick={() => onNavigate("teachers")}
        />
        <StatCard
          label={t("dashboard.stat.risk.label")}
          value={12}
          subtitle={t("dashboard.stat.risk.subtitle")}
          trendLabel={t("dashboard.stat.risk.trendLabel")}
          trendValue={t("dashboard.stat.risk.trendValue")}
          accent="red"
          onClick={() => onNavigate("risk")}
        />
      </section>

      {/* ЖИ-бақылау орталығы: графиктер */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Қатысу және тәртіп графигі */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/70 rounded-3xl p-4 md:p-5">
          <h3 className="text-sm md:text-base font-semibold mb-2">
            Қатысу және тәртіп динамикасы
          </h3>
          <p className="text-xs md:text-sm text-slate-400 mb-4">
            Апталар бойынша қатысу пайызы және тәртіп индексі.
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={attendanceData}
                margin={{ left: -20, right: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  domain={[80, 100]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  domain={[3.5, 5]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    border: "1px solid #1f2937",
                    borderRadius: "0.75rem",
                    fontSize: 12,
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="attendance"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Қатысу (%)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="discipline"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Тәртіп (0–5)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Тәуекел тобына байланысты бар-чарт */}
        <div className="bg-slate-900/80 border border-slate-800/70 rounded-3xl p-4 md:p-5">
          <h3 className="text-sm md:text-base font-semibold mb-2">
            Тәуекел тобының үлесі
          </h3>
          <p className="text-xs md:text-sm text-slate-400 mb-4">
            Сынып блоктары бойынша тәуекел тобындағы оқушылар саны.
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="segment"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    border: "1px solid #1f2937",
                    borderRadius: "0.75rem",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="risk"
                  name="Оқушылар саны"
                  fill="#ef4444"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg md:text-xl font-semibold text-slate-50">
          Heatmap проблем по школе
        </h2>
        <p className="text-sm text-slate-400">
          В каких классах больше риска, по каким предметам и в какие месяцы
          ситуация обостряется.
        </p>
        <SchoolHeatmap />
      </section>

      {/* Сенің бұрынғы assessments + quick actions блобың қаласаң, осынан кейін қоя бересің */}
      {/* ... */}
    </div>
  );
};
