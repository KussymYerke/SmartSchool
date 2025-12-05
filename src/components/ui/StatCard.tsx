import React from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  trendLabel?: string;
  trendValue?: string;
  accent?: "green" | "red" | "blue" | "orange";
  onClick?: () => void;
};

const accentClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
  green: "text-emerald-400 bg-emerald-400/10",
  red: "text-rose-400 bg-rose-400/10",
  blue: "text-sky-400 bg-sky-400/10",
  orange: "text-amber-400 bg-amber-400/10",
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  trendLabel,
  trendValue,
  accent = "blue",
  onClick,
}) => {
  return (
    <button
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="w-full text-left bg-slate-900/80 border border-slate-800/70 rounded-3xl p-4 md:p-5 shadow-soft hover:border-primary-500/70 hover:-translate-y-0.5 transition transform"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
        {trendLabel && trendValue && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full ${accentClasses[accent]}`}
          >
            <span>{trendLabel}</span>
            <span className="font-semibold">{trendValue}</span>
          </span>
        )}
      </div>
      <div className="text-2xl md:text-3xl font-semibold mb-1">{value}</div>
      {subtitle && (
        <p className="text-xs md:text-sm text-slate-400">{subtitle}</p>
      )}
    </button>
  );
};
