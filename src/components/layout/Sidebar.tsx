import React from "react";
import type { PageKey } from "../../App";
import { useI18n } from "../../i18n/i18n";

type SidebarProps = {
  currentPage: PageKey;
  onChangePage: (page: PageKey) => void;
};

const NAV_ITEMS: { key: PageKey; labelKey: string; icon: string }[] = [
  { key: "dashboard", labelKey: "nav.dashboard", icon: "📊" },
  { key: "orders", labelKey: "nav.orders", icon: "📁" },
  { key: "classes", labelKey: "nav.classes", icon: "🏫" },
  { key: "teachers", labelKey: "nav.teachers", icon: "👩‍🏫" },
  { key: "assessments", labelKey: "nav.assessments", icon: "📝" },
  { key: "risk", labelKey: "nav.risk", icon: "⚠️" },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onChangePage,
}) => {
  const { t } = useI18n();
  const year = new Date().getFullYear().toString();

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-slate-950 border-r border-slate-800/70 p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-soft">
          <span className="text-xl font-bold">Ш</span>
        </div>
        <div>
          <div className="text-sm uppercase tracking-[0.16em] text-slate-400">
            {t("app.schoolLabel")}
          </div>
          <div className="text-base font-semibold">{t("app.brand")}</div>
        </div>
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChangePage(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition
              ${
                isActive
                  ? "bg-primary-600 text-white shadow-soft"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="truncate">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 text-xs text-slate-500">
        {t("nav.footer").replace("{year}", year)}
      </div>
    </aside>
  );
};
    