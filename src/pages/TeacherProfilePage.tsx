// src/pages/TeacherProfilePage.tsx
import React from "react";
import { TEACHERS } from "../data/teachers";
import { useI18n } from "../i18n/i18n";

type TeacherProfilePageProps = {
  teacherId: number;
  onBack: () => void;
};

export const TeacherProfilePage: React.FC<TeacherProfilePageProps> = ({
  teacherId,
  onBack,
}) => {
  const { t } = useI18n();
  const teacher = TEACHERS.find((tch) => tch.id === teacherId);

  if (!teacher) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="text-sm text-slate-300 hover:text-slate-50 hover:underline"
        >
          ← {t("teacher.back", "Артқа қайту")}
        </button>
        <p className="text-slate-200">
          {t("teacher.notFound", "Мұғалім табылмады.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Назад */}
      <button
        onClick={onBack}
        className="inline-flex items-center text-sm text-slate-300 hover:text-slate-50 hover:underline"
      >
        ← {t("teacher.back", "Артқа қайту")}
      </button>

      {/* Header */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-[0_0_60px_rgba(15,23,42,0.75)]">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-400/70">
            {t("teacher.profileLabel", "Мұғалім профилі")}
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
            {teacher.fullName}
          </h1>
          <p className="text-sm text-slate-300">
            {teacher.mainSubjects?.join(" · ") || t("teacher.noSubject", "Пән")}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {teacher.mainLanguages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center rounded-full bg-slate-800/70 border border-slate-600/60 px-3 py-1 text-xs text-slate-100"
              >
                {lang}
              </span>
            ))}

            {teacher.totalExperience && teacher.totalExperience !== "-" && (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/50 px-3 py-1 text-xs text-emerald-200">
                {t("teacher.experience", "Пед. өтілі")}:{" "}
                {teacher.totalExperience}
              </span>
            )}

            {teacher.degree && teacher.degree !== "-" && (
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/50 px-3 py-1 text-xs text-indigo-200">
                {teacher.degree}
              </span>
            )}

            {teacher.category && teacher.category !== "-" && (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/50 px-3 py-1 text-xs text-amber-200">
                {teacher.category}
              </span>
            )}
          </div>
        </div>

        {/* Контакты */}
        <div className="w-full md:w-auto md:min-w-[260px] rounded-2xl bg-slate-900/80 border border-slate-700/80 p-4 space-y-2 text-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {t("teacher.contacts", "Байланыс")}
          </p>
          {teacher.email && (
            <p className="text-slate-100 break-all">
              <span className="text-slate-400 text-xs mr-1">email:</span>
              {teacher.email}
            </p>
          )}
          {teacher.phones && (
            <p className="text-slate-100">
              <span className="text-slate-400 text-xs mr-1">tel:</span>
              {teacher.phones}
            </p>
          )}
          {teacher.education && (
            <p className="text-xs text-slate-400 pt-1">
              {t("teacher.education", "Білімі")}: {teacher.education}
            </p>
          )}
        </div>
      </section>

      {/* Основной контент (слева аналитика, справа кадрлық инфо) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Левая часть: аналитика */}
        <div className="xl:col-span-2 space-y-4">
          {/* Успеваемость */}
          {/* 📈 График успеваемости по четвертям */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-50">
                  {t("teacher.performance", "Успеваемость по четвертям")}
                </h2>
                <p className="text-xs text-slate-400">
                  {t(
                    "teacher.performanceHint",
                    "Орташа баға 1–5 шкаласы бойынша. Бұл мұғалім өткізетін сыныптар бойынша жинақталған көрсеткіш."
                  )}
                </p>
              </div>
            </div>

            {teacher.performanceByQuarter &&
            teacher.performanceByQuarter.length > 0 ? (
              <div className="mt-3">
                {/* Простенький bar-chart */}
                <div className="flex items-end gap-3 h-40 border-b border-slate-800 pb-4">
                  {teacher.performanceByQuarter.map((q) => {
                    const ratio = Math.max(0, Math.min(q.avgGrade / 5, 1));
                    const height = 20 + ratio * 100; // от 20px до ~120px

                    return (
                      <div
                        key={q.label}
                        className="flex flex-col items-center justify-end flex-1"
                      >
                        <div
                          className="w-full max-w-[32px] rounded-t-xl bg-indigo-500/60 border border-indigo-400/70 shadow-[0_0_20px_rgba(129,140,248,0.5)] transition-all"
                          style={{ height }}
                        />
                        <span className="mt-2 text-[11px] text-slate-300 text-center">
                          {q.label}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {q.avgGrade.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-2 text-[11px] text-slate-500">
                  {t(
                    "teacher.performanceLegend",
                    "5.0 – максимум. Кейін бұл деректер БЖБ/ТЖБ және журналмен автоматты түрде байланысады."
                  )}
                </p>
              </div>
            ) : (
              <div className="h-32 rounded-xl border border-dashed border-slate-700/60 bg-slate-900/40 flex items-center justify-center text-xs text-slate-500 text-center px-4">
                {t(
                  "teacher.performancePlaceholder",
                  "Бұл мұғалім бойынша әзірге сандық деректер енгізілген жоқ. Кейін БЖБ/ТЖБ және тоқсандық бағалардан автоматты түрде құрылады."
                )}
              </div>
            )}
          </div>

          {/* AI-рекомендации */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-50">
                  {t("teacher.aiRecs", "AI ұсыныстары")}
                </h2>
                <p className="text-xs text-slate-400">
                  {t(
                    "teacher.aiRecsHint",
                    "Кейін жүйе осы мұғалімнің сыныптары мен нәтижелеріне сүйеніп ұсыныстар береді."
                  )}
                </p>
              </div>
            </div>

            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>
                  {t(
                    "teacher.aiRecs.placeholder1",
                    "БЖБ/ТЖБ нәтижелері жүктелгеннен кейін, әлсіз тақырыптар бойынша талдау көрсетіледі."
                  )}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span>
                  {t(
                    "teacher.aiRecs.placeholder2",
                    "AI оқушылардың қиындық көріп жатқан сыныптарын бөлек шығарады."
                  )}
                </span>
              </li>
            </ul>
          </div>
        </div>
        {/* 🧑‍🏫 Привязка к классам */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                {t("teacher.classes", "Сыныптар мен пәндер")}
              </h2>
              <p className="text-xs text-slate-400">
                {t(
                  "teacher.classesHint",
                  "Бұл мұғалім жүргізетін сыныптар, пәндер және апталық сағат саны."
                )}
              </p>
            </div>
          </div>

          {teacher.classAssignments && teacher.classAssignments.length > 0 ? (
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden text-xs">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <div className="col-span-3">
                  {t("teacher.col.class", "Сынып")}
                </div>
                <div className="col-span-6">
                  {t("teacher.col.subject", "Пән")}
                </div>
                <div className="col-span-3 text-right">
                  {t("teacher.col.hours", "Сағат/апта")}
                </div>
              </div>

              <div className="divide-y divide-slate-800/80">
                {teacher.classAssignments.map((c) => (
                  <div
                    key={c.className + c.subject}
                    className="grid grid-cols-12 gap-2 px-3 py-2 text-slate-100"
                  >
                    <div className="col-span-3">{c.className}</div>
                    <div className="col-span-6">{c.subject}</div>
                    <div className="col-span-3 text-right">
                      {c.hoursPerWeek ?? "-"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-20 flex items-center justify-center text-xs text-slate-500 text-center px-4 border border-dashed border-slate-700/60 rounded-xl bg-slate-900/40">
              {t(
                "teacher.classesPlaceholder",
                "Бұл мұғалім үшін сынып-пән байланысы әлі енгізілген жоқ. Кейін оқу жоспары мен жүктемеден автоматты түрде толтырылады."
              )}
            </div>
          )}
        </div>

        {/* Правая колонка: кадрлық info */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 md:p-5">
            <h2 className="text-sm font-semibold text-slate-50 mb-3">
              {t("teacher.hrBlock", "Кадрлық ақпарат")}
            </h2>

            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400 min-w-[90px]">
                  {t("teacher.iin", "ЖСН")}
                </dt>
                <dd className="text-slate-100 text-right">{teacher.iin}</dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">
                  {t("teacher.birthDate", "Туған күні")}
                </dt>
                <dd className="text-slate-100 text-right">
                  {teacher.birthDate}
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">
                  {t("teacher.nationality", "Ұлты")}
                </dt>
                <dd className="text-slate-100 text-right">
                  {teacher.nationality}
                </dd>
              </div>

              <div className="border-t border-slate-800 pt-2 mt-2" />

              <div className="flex flex-col gap-1">
                <dt className="text-slate-400">
                  {t("teacher.educationFull", "Білімі, оқу орны")}
                </dt>
                <dd className="text-slate-100 text-right whitespace-pre-line">
                  {teacher.education}
                </dd>
              </div>

              {teacher.specialty && (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">
                    {t("teacher.specialty", "Мамандығы")}
                  </dt>
                  <dd className="text-slate-100 text-right">
                    {teacher.specialty}
                  </dd>
                </div>
              )}

              {teacher.attestationYear && teacher.attestationYear !== "-" && (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">
                    {t("teacher.attestation", "Аттестация жылы")}
                  </dt>
                  <dd className="text-slate-100 text-right">
                    {teacher.attestationYear}
                  </dd>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <dt className="text-slate-400">
                  {t("teacher.courses", "Курстар")}
                </dt>
                <dd className="text-slate-100 text-right whitespace-pre-line">
                  {teacher.courses || "-"}
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="text-slate-400">
                  {t("teacher.sorCourses", "БЖБ / ТЖБ курстары")}
                </dt>
                <dd className="text-slate-100 text-right whitespace-pre-line">
                  {teacher.sorCourses || "-"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
