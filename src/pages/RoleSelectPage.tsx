// src/pages/RoleSelectPage.tsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/auth";

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  deputy:
    "Толық мектеп аналитикасы, тәуекел картасы, сыныптар мен пәндер бойынша сандар.",
  teacher:
    "Тек өз сыныптарыңыз, бағалар, қатыспау және пән бойынша қысқа аналитика.",
  psychologist:
    "Психологиялық сигналдар, белсенділік, қақтығыстар және жеке бақылау.",
};

export const RoleSelectPage: React.FC = () => {
  const { setRole } = useAuth();

  const handleSelect = (role: UserRole) => {
    setRole(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="max-w-4xl w-full px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-50 text-center mb-2">
          Аккаунт түрін таңдаңыз
        </h1>
        <p className="text-sm text-slate-400 text-center mb-8">
          Жүйеге кіру кезінде рөліңізге сәйкес панель ашылады: завуч, мұғалім
          немесе психолог.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["deputy", "teacher", "psychologist"] as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => handleSelect(role)}
              className="group bg-slate-900/80 border border-slate-700/70 rounded-3xl p-4 text-left hover:border-primary-500/70 hover:-translate-y-1 transition transform"
            >
              <h2 className="text-lg font-semibold text-slate-50 mb-1">
                {role === "deputy"
                  ? "Завуч"
                  : role === "teacher"
                  ? "Мұғалім / Учитель"
                  : "Психолог"}
              </h2>
              <p className="text-xs text-slate-400">
                {ROLE_DESCRIPTIONS[role]}
              </p>
              <div className="mt-4 text-xs text-primary-300 group-hover:text-primary-200">
                Кіру →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
