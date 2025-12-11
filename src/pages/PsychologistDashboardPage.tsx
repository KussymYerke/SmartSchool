// src/pages/PsychologistDashboardPage.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { STUDENTS } from "../data/students";
import { calculateRiskScore } from "../data/riskUtils";
import type { Student } from "../types/student";

/* ---------------------- helpers for referrals ---------------------- */

const loadPsychReferrals = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("psych_referrals");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

/* --------------------------- notes types --------------------------- */

type PsychNote = {
  id: number;
  studentId: string;
  meetingAt: string | null;
  note: string;
  createdAt: string;
};

const loadPsychNotes = (): PsychNote[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("psych_notes");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const savePsychNotes = (notes: PsychNote[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("psych_notes", JSON.stringify(notes));
};

/* --------------------------- Modal --------------------------- */

const PsychStudentModal: React.FC<{
  student: Student;
  onClose: () => void;
}> = ({ student, onClose }) => {
  const [meetingAt, setMeetingAt] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [history, setHistory] = useState<PsychNote[]>([]);

  useEffect(() => {
    const all = loadPsychNotes();
    setHistory(all.filter((n) => n.studentId === student.id));
  }, [student.id]);

  const handleSave = () => {
    if (!note.trim() && !meetingAt) {
      onClose();
      return;
    }

    const all = loadPsychNotes();

    const newRecord: PsychNote = {
      id: Date.now(),
      studentId: student.id,
      meetingAt: meetingAt || null,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...all, newRecord];
    savePsychNotes(updated);
    setHistory((prev) => [...prev, newRecord]);

    setMeetingAt("");
    setNote("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900/95 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {student.fullName}
            </h2>
            <p className="text-sm text-slate-300">
              Сынып: <span className="text-slate-100">{student.className}</span>{" "}
              · {student.gender === "male" ? "Ұл бала" : "Қыз бала"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Барлық қатыспау: {student.absences} · Себепсіз:{" "}
              <span className="text-red-300">
                {student.unexcusedAbsences || 0}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-sm"
          >
            ✕
          </button>
        </div>

        {history.length > 0 && (
          <div className="max-h-56 overflow-y-auto pr-2 space-y-3 border border-slate-700/70 rounded-xl p-3 bg-slate-900/60">
            <p className="text-sm font-semibold text-slate-200 mb-2">
              Алдыңғы жазбалар
            </p>

            <div className="relative space-y-4">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-600/40" />

              {history
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((n) => (
                  <div
                    key={n.id}
                    className="ml-6 bg-slate-800/60 border border-slate-600/50 rounded-xl p-3 shadow-md"
                  >
                    <div className="absolute -ml-5 mt-1.5 h-3 w-3 rounded-full bg-indigo-400 shadow" />

                    <p className="text-xs text-slate-400 mb-1">
                      {new Date(n.createdAt).toLocaleString("kk-KZ", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}

                      {n.meetingAt && (
                        <span className="text-indigo-300 ml-1">
                          · Кездесу:{" "}
                          {new Date(n.meetingAt).toLocaleString("kk-KZ", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </p>

                    {/* Текст заметки */}
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {n.note}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Новая консультация */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300">
              Кездесу уақыты (қаласаңыз):
            </label>
            <input
              type="datetime-local"
              value={meetingAt}
              onChange={(e) => setMeetingAt(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 p-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-slate-300">Жеке жазба:</label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 p-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              placeholder="Қысқаша байқау, эмоциялық жағдай, ұсыныстар..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Жабу
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Сақтау
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------ Main page ------------------------ */

export const PsychologistDashboardPage: React.FC = () => {
  const { setRole } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // список учеников, направленных к психологу через localStorage
  const focusStudents = useMemo(() => {
    const referrals = loadPsychReferrals();
    const referralIds = new Set(
      referrals.map((r: any) => r.studentId).filter(Boolean)
    );

    const filtered = STUDENTS.filter((s) => referralIds.has(s.id));

    return filtered
      .map((s) => ({
        s,
        riskScore: calculateRiskScore(s),
      }))
      .sort((a, b) => b.riskScore - a.riskScore);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">
            Панель психолога
          </h1>
          <p className="text-xs text-slate-400">
            Мұнда тек психологқа жазылған, бақылауды қажет ететін оқушылар
            көрсетіледі.
          </p>
        </div>
        <button
          onClick={() => setRole(null)}
          className="text-xs px-3 py-1.5 rounded-full border border-slate-600 hover:bg-slate-800"
        >
          Рөлді ауыстыру
        </button>
      </header>

      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 text-xs uppercase tracking-wide text-slate-400 bg-slate-900/80 border-b border-slate-800 grid grid-cols-12 gap-3">
          <div className="col-span-5">Оқушы</div>
          <div className="col-span-2 text-center">Сынып</div>
          <div className="col-span-2 text-center">Қатыспау</div>
          <div className="col-span-3 text-center">Психо-сигнал (демо)</div>
        </div>

        <div className="divide-y divide-slate-800">
          {focusStudents.map(({ s, riskScore }) => (
            <button
              key={s.id}
              onClick={() => setSelectedStudent(s as Student)}
              className="w-full text-left px-4 py-3 grid grid-cols-12 gap-3 items-center text-xs hover:bg-slate-800/40 transition cursor-pointer"
            >
              <div className="col-span-5">
                <p className="text-slate-50">{s.fullName}</p>
                <p className="text-slate-500">
                  {s.gender === "male" ? "Ұл бала" : "Қыз бала"}
                </p>
              </div>

              <div className="col-span-2 text-center text-slate-200">
                {s.className}
              </div>

              <div className="col-span-2 text-center text-slate-200">
                Барлығы: {s.absences}{" "}
                <span className="text-red-300">
                  · Себепсіз: {s.unexcusedAbsences}
                </span>
              </div>

              <div className="col-span-3 text-center text-slate-200">
                {riskScore >= 10
                  ? "Жоғары тәуекел, жеке консультация және мотивация мен көңіл-күйді тексеру қажет."
                  : "Орташа тәуекел, периодтық бақылау және жеңіл қолдау жеткілікті."}
              </div>
            </button>
          ))}

          {focusStudents.length === 0 && (
            <div className="px-4 py-6 text-center text-slate-400 text-sm">
              Қазіргі уақытта психологқа жазылған оқушылар тізімі бос.
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-slate-500 max-w-2xl">
        Ескерту: бұл демо-нұсқа. Кейін психологтың толық модулі (динамика,
        тесттер, ата-анамен жұмыс, т.б.) қосылуы мүмкін.
      </p>

      {selectedStudent && (
        <PsychStudentModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};
