import React from "react";
import { useI18n } from "../../i18n/i18n";

export const Topbar: React.FC = () => {
  const { t, language, setLanguage } = useI18n();

  return (
    <header className="w-full border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-end">
        {/* <div>
          <h1 className="text-lg md:text-xl font-semibold tracking-tight">
            {t("topbar.title")}
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            {t("topbar.subtitle")}
          </p>
        </div> */}

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700 rounded-full p-1 text-xs">
            <button
              onClick={() => setLanguage("ru")}
              className={`px-2.5 py-1 rounded-full transition ${
                language === "ru"
                  ? "bg-primary-600 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              RU
            </button>
            <button
              onClick={() => setLanguage("kk")}
              className={`px-2.5 py-1 rounded-full transition ${
                language === "kk"
                  ? "bg-primary-600 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              KZ
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold">Еркебулан</div>
              <div className="text-[11px] text-slate-400">
                {t("topbar.role")}
              </div>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-bold">
              Е
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
