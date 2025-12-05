// src/pages/TeachersPage.tsx
import React from "react";
import { TEACHERS } from "../data/teachers";
import { useI18n } from "../i18n/i18n";

type TeachersPageProps = {
  onSelectTeacher: (id: number) => void;
};

export const TeachersPage: React.FC<TeachersPageProps> = ({
  onSelectTeacher,
}) => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
          {t("teachers.title", "Педагогтар")}
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl">
          {t(
            "teachers.subtitle",
            "Мұғалімдер тізімі. Мұғалімнің атына бассаңыз – толық профилі ашылады."
          )}
        </p>
      </div>

      <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden">
        {/* header */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 text-xs uppercase tracking-wide text-slate-400 bg-slate-900/80 border-b border-slate-800">
          <div className="col-span-4">{t("teachers.col.name", "Мұғалім")}</div>
          <div className="col-span-3">
            {t("teachers.col.subject", "Пән / мамандығы")}
          </div>
          <div className="col-span-2">
            {t("teachers.col.langs", "Оқыту тілі")}
          </div>
          <div className="col-span-2">
            {t("teachers.col.experience", "Өтілі / санаты")}
          </div>
          <div className="col-span-1 text-right">
            {t("teachers.col.more", "Профиль")}
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          {TEACHERS.map((tch) => (
            <div
              key={tch.id}
              onClick={() => onSelectTeacher(tch.id)}
              className="px-4 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-slate-900/60 transition-colors cursor-pointer"
            >
              {/* Имя */}
              <div className="md:col-span-4">
                <p className="text-sm font-medium text-slate-50">
                  {tch.fullName}
                </p>
                <p className="text-xs text-slate-400">
                  {tch.email || ""}
                </p>
              </div>

              {/* Пән / мамандығы */}
              <div className="md:col-span-3 text-sm text-slate-200">
                {tch.specialty}
              </div>

              {/* Языки */}
              <div className="md:col-span-2 text-xs text-slate-300 flex flex-wrap gap-1">
                {tch.mainLanguages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center rounded-full bg-slate-800/80 px-2 py-0.5"
                  >
                    {lang}
                  </span>
                ))}
              </div>

              {/* Опыт / категория */}
              <div className="md:col-span-2 text-xs text-slate-300 space-y-1">
                {tch.totalExperience && tch.totalExperience !== "-" && (
                  <p>
                    {t("teachers.experience", "Өтілі")}:{" "}
                    <span className="text-slate-100">
                      {tch.totalExperience}
                    </span>
                  </p>
                )}
                {tch.category && tch.category !== "-" && (
                  <p>
                    {t("teachers.category", "Санаты")}:{" "}
                    <span className="text-slate-100">{tch.category}</span>
                  </p>
                )}
              </div>

              {/* Профиль */}
              <div className="md:col-span-1 flex md:justify-end">
                <span className="inline-flex items-center text-xs rounded-full border border-slate-700 px-3 py-1 text-slate-200 bg-slate-900/80">
                  {t("teachers.openProfile", "Ашу")}
                  <span className="ml-1 text-[10px]">↗</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
