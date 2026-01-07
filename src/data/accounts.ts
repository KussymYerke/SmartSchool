// src/data/accounts.ts
// Demo teacher/class-teacher accounts (client-side only).

import { TEACHERS_RAW } from "./teachersRaw";

export type AccountRole = "teacher" | "class_teacher";

export type DemoAccount = {
  id: string;
  role: AccountRole;
  fullName: string;
  email: string;
  password: string;
  // Scope
  subjects: string[]; // subject codes from src/data/subjects.ts
  teachingClasses: string[]; // classes where the teacher teaches (for subject view)
  homeroomClasses: string[]; // only for class teachers
};

function byEmail(email: string) {
  const t = TEACHERS_RAW.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());
  return t;
}

// ⚠️ Passwords are demo-only. Change them anytime.
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "daniyal",
    role: "class_teacher",
    fullName: "Исатаев Даниял",
    email: byEmail("daniyal.issaa@gmail.com")?.email ?? "daniyal.issaa@gmail.com",
    password: "Daniyal#803",
    subjects: ["english"],
    teachingClasses: ["7A", "8A", "8B", "10A", "10B"],
    homeroomClasses: ["8A", "8B"],
  },
  {
    id: "baizhan",
    role: "class_teacher",
    fullName: "Исмаилов Байжан",
    email: byEmail("bayzhan1993@gmail.com")?.email ?? "bayzhan1993@gmail.com",
    password: "Baizhan#910",
    subjects: ["english"],
    teachingClasses: ["9A", "9B", "10A", "10B"],
    homeroomClasses: ["9A", "9B"],
  },
  {
    id: "bekzat",
    role: "class_teacher",
    fullName: "Жұмабай Бекзат",
    email: byEmail("bekzatzhumabaev10@gmail.com")?.email ?? "bekzatzhumabaev10@gmail.com",
    password: "Bekzat#789",
    subjects: ["math"],
    teachingClasses: ["7A", "8A", "8B", "9A", "9B"],
    homeroomClasses: ["7A"],
  },
  {
    id: "nazerke_math",
    role: "class_teacher",
    fullName: "Реджепбайқызы Назерке (математика)",
    email: byEmail("redzhepbaikyzy@gmail.com")?.email ?? "redzhepbaikyzy@gmail.com",
    password: "NazerkeM#1011",
    subjects: ["math"],
    teachingClasses: ["10A", "10B", "11A", "11B"],
    homeroomClasses: ["10A", "10B"],
  },
  {
    id: "arailym",
    role: "class_teacher",
    fullName: "Мәсуадин Арайлым",
    email: byEmail("arailym.masuadin@gmail.com")?.email ?? "arailym.masuadin@gmail.com",
    password: "Arailym#1110",
    subjects: ["chemistry", "biology"],
    teachingClasses: ["11A", "11B"],
    homeroomClasses: ["11A", "11B"],
  },

  // --- Subject teachers (not class teachers) ---
  {
    id: "nazerke_kaz",
    role: "teacher",
    fullName: "Шегебай Назерке (қазақ тілі/әдебиет)",
    email: byEmail("nazik_favourite@mail.ru")?.email ?? "nazik_favourite@mail.ru",
    password: "KazNazerke#710",
    subjects: ["kazakh_lang", "kazakh_lit"],
    teachingClasses: ["7A", "8A", "8B", "9A", "9B", "10A", "10B"],
    homeroomClasses: [],
  },
  {
    id: "asel_kaz",
    role: "teacher",
    fullName: "Сулейменова Асель (қазақ тілі/әдебиет)",
    email: byEmail("asel.kta@gmail.com")?.email ?? "asel.kta@gmail.com",
    password: "Asel#1111",
    subjects: ["kazakh_lang", "kazakh_lit"],
    teachingClasses: ["11A", "11B"],
    homeroomClasses: [],
  },
];

// -----------------------------
// Auto-generated subject-teacher accounts
// -----------------------------
// The raw teacher dataset contains many teachers. Only some have hand-crafted
// scope (classes/subjects). To make the demo feel complete, we generate
// teacher accounts for everyone else.

const ALL_CLASSES = ["7A", "8A", "8B", "9A", "9B", "10A", "10B", "11A", "11B"];

const KNOWN_EMAILS = new Set(DEMO_ACCOUNTS.map((a) => (a.email || "").toLowerCase()));

function slugifyId(fullName: string, id: number) {
  const base = (fullName || "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "teacher"}-${id}`;
}

function inferSubjects(t: (typeof TEACHERS_RAW)[number]): string[] {
  const txt = `${t.specialty || ""} ${(t.mainSubjects || []).join(" ")}`.toLowerCase();
  const out = new Set<string>();

  // Language/philology
  if (/(қазақ|казах)/.test(txt)) {
    out.add("kazakh_lang");
    out.add("kazakh_lit");
  }
  if (/(орыс|рус)/.test(txt)) out.add("russian");
  if (/(ағылшын|англ|шет тілі|екі шет тілі|english)/.test(txt)) out.add("english");

  // STEM
  if (/(матем|алгебр|геометр)/.test(txt)) out.add("math");
  if (/(информ|it|робот)/.test(txt)) out.add("informatics");
  if (/(физик)/.test(txt)) out.add("physics");
  if (/(хими)/.test(txt)) out.add("chemistry");
  if (/(биолог)/.test(txt)) out.add("biology");

  // Social studies
  if (/(географ)/.test(txt)) out.add("geography");
  if (/(тарих|истор)/.test(txt)) out.add("historyKZ");

  // Fallback
  if (out.size === 0) out.add("historyKZ");

  return Array.from(out);
}

function inferTeachingClasses(t: (typeof TEACHERS_RAW)[number]): string[] {
  const assigned = (t.classAssignments || []).map((a) => a.className).filter(Boolean);
  const uniq = Array.from(new Set(assigned));
  return uniq.length ? uniq : ALL_CLASSES;
}

function genPassword(t: (typeof TEACHERS_RAW)[number]) {
  // Demo-only unique password, stable across runs.
  return `Teacher#${t.id}`;
}

export const GENERATED_TEACHER_ACCOUNTS: DemoAccount[] = TEACHERS_RAW
  .filter((t) => !!t.email && !KNOWN_EMAILS.has((t.email || "").toLowerCase()))
  .map((t) => {
    return {
      id: slugifyId(t.fullName, t.id),
      role: "teacher" as const,
      fullName: t.fullName,
      email: t.email,
      password: genPassword(t),
      subjects: inferSubjects(t),
      teachingClasses: inferTeachingClasses(t),
      homeroomClasses: [],
    };
  });

export const ALL_DEMO_ACCOUNTS: DemoAccount[] = [...DEMO_ACCOUNTS, ...GENERATED_TEACHER_ACCOUNTS];

export const TEACHER_ACCOUNTS = ALL_DEMO_ACCOUNTS.filter((a) => a.role === "teacher");
export const CLASS_TEACHER_ACCOUNTS = ALL_DEMO_ACCOUNTS.filter(
  (a) => a.role === "class_teacher" && a.homeroomClasses.length > 0
);

// -----------------------------
// Helpers
// -----------------------------

export function findAccountById(accountId: string | null | undefined): DemoAccount | null {
  if (!accountId) return null;
  const id = String(accountId);
  return ALL_DEMO_ACCOUNTS.find((a) => a.id === id) ?? null;
}

export function findHomeroomTeacherForClass(className: string | null | undefined): DemoAccount | null {
  if (!className) return null;
  const cls = String(className).trim();
  return CLASS_TEACHER_ACCOUNTS.find((a) => a.homeroomClasses.includes(cls)) ?? null;
}
