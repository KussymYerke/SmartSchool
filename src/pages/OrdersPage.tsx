import React from "react";
import { useI18n } from "../i18n/i18n";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export const OrdersPage: React.FC = () => {
  const { t } = useI18n();

  const ORDERS = [
    {
      title: "Әдістемелік нұсқау хат (2024–2025)",
      type: "Әдістемелік құжат",
      link: "/files/file.pdf",
    },
    {
      title: "№500 бұйрық — 2022 жылғы оқу жылының тәртібі",
      type: "Бұйрық (Adilet)",
      link: "https://adilet.zan.kz/kaz/docs/V2200029916#z4",
    },
    {
      title: "МЖМБС — Мемлекеттік жалпыға міндетті білім стандарты",
      type: "Стандарт",
      link: "https://adilet.zan.kz/kaz/docs/V1200008170",
    },
    {
      title: "Оқу бағдарламалары (1–11 сынып)",
      type: "Негізгі бағдарлама",
      link: "https://adilet.zan.kz/kaz/docs/V090005750_",
    },
    {
      title: "БЖБ/ТЖБ өткізу ережелері",
      type: "Бағалау",
      link: "https://adilet.zan.kz/kaz/docs/V1500012129",
    },
    {
      title: "Педагог мәртебесі туралы заң",
      type: "Заң",
      link: "https://adilet.zan.kz/kaz/docs/K1900000293",
    },
    {
      title: "Педагогтардың жүктемесі туралы бұйрық",
      type: "Жүктеме",
      link: "https://adilet.zan.kz/kaz/docs/V1800017162",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-slate-50">
          {t("orders.title", "Бұйрықтар мен нормативтік құжаттар")}
        </h2>
        <p className="text-sm text-slate-400">
          {t(
            "orders.subtitle",
            "Мектеп жұмысына қажетті ресми құжаттар, адилет.gov.kz сілтемелері, әдістемелік хаттар және ішкі бұйрықтар."
          )}
        </p>
      </div>

      {/* Document list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {ORDERS.map((doc, i) => (
          <a
            key={i}
            href={doc.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-slate-950/70 border border-slate-800 rounded-3xl p-4 flex flex-col gap-3 hover:border-primary-500/70 hover:-translate-y-1 transition transform shadow-sm"
          >
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="w-7 h-7 text-primary-400 group-hover:text-primary-300" />
              <div>
                <p className="text-sm font-semibold text-slate-50">
                  {doc.title}
                </p>
                <p className="text-xs text-slate-400">{doc.type}</p>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 group-hover:text-slate-200">
              Ашу →
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
