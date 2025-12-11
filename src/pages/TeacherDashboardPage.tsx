// src/pages/TeacherDashboardPage.tsx
import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { STUDENTS } from "../data/students";
import { ClassProfilePage } from "./ClassProfilePage";

export const TeacherDashboardPage: React.FC = () => {
  const { setRole } = useAuth();

  const classes = useMemo(() => {
    const set = new Set<string>();
    STUDENTS.forEach((s) => set.add(s.className));

    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a); // 7A → 7
      const numB = parseInt(b); // 10A → 10

      if (numA !== numB) return numA - numB;

      // если числа равны → сортируем по буквам
      const letterA = a.replace(/\d+/g, ""); // A, B
      const letterB = b.replace(/\d+/g, "");

      return letterA.localeCompare(letterB);
    });
  }, []);

  const [selectedClass, setSelectedClass] = useState<string | null>(
    classes[0] ?? null
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">
            Панель мұғалім / учителя
          </h1>
          <p className="text-xs text-slate-400">
            Өз сыныптарыңыз және пәндеріңіз бойынша қысқа аналитика.
          </p>
        </div>
        <button
          onClick={() => setRole(null)}
          className="text-xs px-3 py-1.5 rounded-full border border-slate-600 hover:bg-slate-800"
        >
          Рөлді ауыстыру
        </button>
      </header>

      {/* Выбор класса */}
      <div className="flex gap-2 flex-wrap">
        {classes.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedClass(c)}
            className={
              "px-3 py-1.5 rounded-full text-xs border transition " +
              (selectedClass === c
                ? "bg-primary-500/20 border-primary-400 text-primary-100"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800")
            }
          >
            {c}
          </button>
        ))}
      </div>

      {/* ClassProfilePage как аналитика по выбранному классу */}
      {selectedClass && (
        <ClassProfilePage
          className={selectedClass}
          onBack={() => setSelectedClass(null)}
        />
      )}
    </div>
  );
};
