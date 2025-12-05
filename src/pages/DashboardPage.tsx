import React from "react";
import type { PageKey } from "../App";
import { StatCard } from "../components/ui/StatCard";
import { useI18n } from "../i18n/i18n";

type Props = {
  onNavigate: (page: PageKey) => void;
};

export const DashboardPage: React.FC<Props> = ({ onNavigate }) => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg md:text-xl font-semibold mb-1">
          {t("dashboard.overview.title")}
        </h2>
        <p className="text-sm text-slate-400">
          {t("dashboard.overview.subtitle")}
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("dashboard.stat.students.label")}
          value={624}
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

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/70 rounded-3xl p-4 md:p-5">
          <h3 className="text-sm font-semibold mb-2">
            {t("dashboard.assessments.title")}
          </h3>
          <p className="text-xs md:text-sm text-slate-400 mb-4">
            {t("dashboard.assessments.subtitle")}
          </p>
          <div className="text-xs text-slate-400 italic">
            {t("dashboard.assessments.placeholder")}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/70 rounded-3xl p-4 md:p-5">
          <h3 className="text-sm font-semibold mb-2">
            {t("dashboard.quickActions.title")}
          </h3>
          <div className="flex flex-col gap-2 text-sm">
            <button
              onClick={() => onNavigate("orders")}
              className="w-full px-3 py-2 rounded-2xl bg-primary-600 hover:bg-primary-500 transition text-sm text-white text-left"
            >
              {t("dashboard.quickActions.orders")}
            </button>
            <button
              onClick={() => onNavigate("classes")}
              className="w-full px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 transition text-sm text-slate-100 text-left"
            >
              {t("dashboard.quickActions.classes")}
            </button>
            <button
              onClick={() => onNavigate("risk")}
              className="w-full px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 transition text-sm text-slate-100 text-left"
            >
              {t("dashboard.quickActions.risk")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
