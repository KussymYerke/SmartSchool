import React, { useMemo } from "react";
import {
  ChartBarIcon,
  FolderIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { PageKey } from "../../App";
import { useI18n } from "../../i18n/i18n";
import { useAuth } from "../../context/AuthContext";

type SidebarProps = {
  currentPage: PageKey;
  onChangePage: (page: PageKey) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

const NAV_ITEMS: {
  key: PageKey;
  labelKey: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}[] = [
  { key: "dashboard", labelKey: "nav.dashboard", Icon: ChartBarIcon },
  { key: "orders", labelKey: "nav.orders", Icon: FolderIcon },
  { key: "classes", labelKey: "nav.classes", Icon: BuildingOffice2Icon },
  { key: "teachers", labelKey: "nav.teachers", Icon: AcademicCapIcon },
  {
    key: "assessments",
    labelKey: "nav.assessments",
    Icon: ClipboardDocumentCheckIcon,
  },
  { key: "risk", labelKey: "nav.risk", Icon: ExclamationTriangleIcon },
];

const getItemsForRole = (role: string | null) => {
  if (role === "deputy") {
    return NAV_ITEMS; // Завуч видит всё
  }

  if (role === "teacher") {
    return NAV_ITEMS.filter((i) =>
      ["dashboard", "classes", "assessments", "risk"].includes(i.key)
    );
  }

  if (role === "class_teacher") {
    // Классрук: только свой класс (дашборд) и риски
    return NAV_ITEMS.filter((i) => ["dashboard", "risk"].includes(i.key));
  }

  if (role === "psychologist") {
    return NAV_ITEMS.filter((i) => ["dashboard", "classes", "risk"].includes(i.key));
  }

  return NAV_ITEMS.filter((i) => ["dashboard"].includes(i.key));
};

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onChangePage, mobileOpen = false, onCloseMobile }) => {
  const { t } = useI18n();
  const { role, className } = useAuth();
  const year = new Date().getFullYear().toString();

  const items = useMemo(() => getItemsForRole(role), [role]);

  const roleLabel =
    role === "deputy"
      ? "Завуч"
      : role === "teacher"
      ? "Учитель"
      : role === "class_teacher"
      ? `Классрук${className ? " · " + className : ""}`
      : role === "psychologist"
      ? "Психолог"
      : "";

  
  return (
    <>
      {/* Mobile drawer */}
      <div className={`md:hidden fixed inset-0 z-[60] ${mobileOpen ? "" : "pointer-events-none"}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/55 transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={onCloseMobile}
        />
        {/* Panel */}
        <aside
          className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/60 p-4 transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-soft">
                <span className="text-xl font-bold">Ш</span>
              </div>
              <div>
                <div className="text-sm uppercase tracking-[0.16em] text-slate-400">{t("nav.title", "ШАМ School")}</div>
                <div className="text-xs text-slate-500">{t("nav.subtitle", "Аналитика / Dashboard")}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onCloseMobile}
              className="ui-btn ui-btn-ghost !p-2"
              aria-label={t("nav.closeMenu", "Закрыть меню")}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {items.map((i) => {
              const active = currentPage === i.key;
              return (
                <button
                  key={i.key}
                  onClick={() => {
                    onChangePage(i.key);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl transition ${
                    active ? "bg-slate-900/70 text-slate-50" : "text-slate-300 hover:bg-slate-900/40"
                  }`}
                >
                  <i.Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{t(i.labelKey)}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 text-xs text-slate-500">
            {t("nav.footer").replace("{year}", year)}
            {role && <div className="mt-2 text-[10px] text-slate-500/80">Роль: {roleLabel}</div>}
          </div>
        </aside>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-slate-950/55 backdrop-blur-xl border-r border-slate-800/60 p-4">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-soft">
            <span className="text-xl font-bold">Ш</span>
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.16em] text-slate-400">
              {t("nav.title", "ШАМ School")}
            </div>
            <div className="text-xs text-slate-500">{t("nav.subtitle", "Аналитика / Dashboard")}</div>
          </div>
        </div>

        <nav className="space-y-1">
          {items.map((i) => {
            const active = currentPage === i.key;
            return (
              <button
                key={i.key}
                onClick={() => onChangePage(i.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl transition ${
                  active ? "bg-slate-900/70 text-slate-50" : "text-slate-300 hover:bg-slate-900/40"
                }`}
              >
                <i.Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{t(i.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 text-xs text-slate-500">
          {t("nav.footer").replace("{year}", year)}

          {role && <div className="mt-2 text-[10px] text-slate-500/80">Роль: {roleLabel}</div>}
        </div>
      </aside>
    </>
  );
};
