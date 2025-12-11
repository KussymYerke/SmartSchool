import React, { useMemo } from "react";
import type { PageKey } from "../../App";
import { useI18n } from "../../i18n/i18n";
import { useAuth } from "../../context/AuthContext";

type SidebarProps = {
  currentPage: PageKey;
  onChangePage: (page: PageKey) => void;
};

// 👇 Стандартный список — иконки НЕ ТРОГАЕМ
const NAV_ITEMS: { key: PageKey; labelKey: string; icon: string }[] = [
  { key: "dashboard", labelKey: "nav.dashboard", icon: "📊" },
  { key: "orders", labelKey: "nav.orders", icon: "📁" },
  { key: "classes", labelKey: "nav.classes", icon: "🏫" },
  { key: "teachers", labelKey: "nav.teachers", icon: "👩‍🏫" },
  { key: "assessments", labelKey: "nav.assessments", icon: "📝" },
  { key: "risk", labelKey: "nav.risk", icon: "⚠️" },
];

// 🎯 Роль влияет на то, какие пункты остаются
const getItemsForRole = (role: string | null) => {
  if (role === "deputy") {
    // Завуч видит всё
    return NAV_ITEMS;
  }

  if (role === "teacher") {
    // Учитель видит меньше
    return NAV_ITEMS.filter((i) =>
      ["dashboard", "classes", "assessments", "risk"].includes(i.key)
    );
  }

  if (role === "psychologist") {
    // Психолог — акцент на учащихся и классах
    return NAV_ITEMS.filter((i) =>
      ["dashboard", "classes", "risk"].includes(i.key)
    );
  }

  // Если роли нет — минимум
  return NAV_ITEMS.filter((i) => ["dashboard", "classes"].includes(i.key));
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onChangePage,
}) => {
  const { t } = useI18n();
  const { role } = useAuth();
  const year = new Date().getFullYear().toString();

  const items = useMemo(() => getItemsForRole(role), [role]);

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-slate-950 border-r border-slate-800/70 p-4">
      {/* Бренд */}
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

      {/* Навигация */}
      <nav className="space-y-1">
        {items.map((item) => {
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

      {/* Footer */}
      <div className="mt-auto pt-6 text-xs text-slate-500">
        {t("nav.footer").replace("{year}", year)}

        {/* Покажем роль мелко */}
        {role && (
          <div className="mt-1 text-[10px] text-slate-500/80">
            Роль:{" "}
            {role === "deputy"
              ? "Завуч"
              : role === "teacher"
              ? "Мұғалім"
              : role === "psychologist"
              ? "Психолог"
              : role}
          </div>
        )}
      </div>
    </aside>
  );
};
