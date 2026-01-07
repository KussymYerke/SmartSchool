import React, { useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon, ArrowPathIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { useI18n } from "../../i18n/i18n";
import { useAuth } from "../../context/AuthContext";
import { STUDENTS } from "../../data/students";
import { ROLE_LABELS } from "../../types/auth";

type TopbarProps = {
  onToggleSidebar?: () => void;
  onOpenStudent?: (studentId: string) => void;
  onResetNavigation?: () => void;
};

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, onOpenStudent, onResetNavigation }) => {
  const { t, language, setLanguage } = useI18n();
  const { role, className, resetAuth, displayName, teachingClasses, selectedSubject } = useAuth();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const base = (() => {
      if (role === "class_teacher" && className) {
        return STUDENTS.filter((s) => s.className === className);
      }
      if (role === "teacher" && Array.isArray(teachingClasses) && teachingClasses.length > 0) {
        return STUDENTS.filter((s) => teachingClasses.includes(s.className));
      }
      return STUDENTS;
    })();

    return base
      .filter((s) => s.fullName.toLowerCase().includes(query) || s.className.toLowerCase().includes(query))
      .slice(0, 8);
  }, [q, role, className, teachingClasses]);

  const roleLabel = role ? ROLE_LABELS[role] : "";
  const name = displayName || "Гость";
  const avatarLetter = (name.trim()[0] || "?").toUpperCase();

  return (
    // Sticky + high z-index so the search dropdown never goes under page content
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/45 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center gap-4">
        {/* Mobile nav toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden ui-btn ui-btn-ghost !p-2"
          aria-label={t("nav.openMenu", "Открыть меню")}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        {/* Search */}
        <div ref={wrapRef} className="flex-1 max-w-xl relative">
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                // small delay to allow click
                setTimeout(() => setOpen(false), 120);
              }}
              className="w-full ui-input pl-9"
              placeholder={
                role === "class_teacher"
                  ? t("topbar.searchClass", "Поиск по вашему классу: имя")
                  : t("topbar.search", "Поиск ученика: имя или класс")
              }
            />
          </div>

          {open && results.length > 0 && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 ui-panel p-2 z-[9999]">
              {results.map((s) => (
                <button
                  key={s.id}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-900/70 transition flex items-center justify-between gap-3"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (onOpenStudent) onOpenStudent(s.id);
                    setQ("");
                    setOpen(false);
                  }}
                >
                  <div>
                    <div className="text-sm font-medium text-slate-100">{s.fullName}</div>
                    <div className="text-xs text-slate-400">Класс: {s.className} · Ср. балл {s.avgGrade.toFixed(1)}</div>
                  </div>
                  <div className="text-xs text-primary-300">Открыть →</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Language */}
          <div className="flex items-center gap-1 bg-slate-900/55 border border-slate-700/60 rounded-full p-1 text-xs shadow-soft">
            <button
              onClick={() => setLanguage("ru")}
              className={`px-2.5 py-1 rounded-full transition ${
                language === "ru" ? "bg-primary-600 text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              RU
            </button>
            <button
              onClick={() => setLanguage("kk")}
              className={`px-2.5 py-1 rounded-full transition ${
                language === "kk" ? "bg-primary-600 text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              KZ
            </button>
          </div>

          {/* Logout / switch */}
          <button
            onClick={() => {
              resetAuth();
              if (onResetNavigation) onResetNavigation();
            }}
            className="ui-btn-secondary rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-2"
            title="Выйти и выбрать другой аккаунт"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Выйти
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold">{name}</div>
              <div className="text-[11px] text-slate-400">
                {roleLabel}
                {role === "class_teacher" && className ? ` · ${className}` : ""}
                {role === "teacher" && selectedSubject ? " · предмет" : ""}
              </div>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-bold">
              {avatarLetter}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
