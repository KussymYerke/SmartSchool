// src/services/ai.ts
// Сервис для получения AI-рекомендаций по ученику через Groq API

import type { Student } from "../types/student";
import { buildStudentRiskPrompt } from "./aiPrompt";

const API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function getStudentAIRecommendations(
  student: Student | any,
  locale: "kk" | "ru" = "kk"
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_GROQ_API_KEY is not set");
  }

  const systemPrompt =
    "Сен мектеп завучысының цифрлық ассистентісің. " +
    "Саған оқушы туралы деректер беріледі. " +
    "Сен завуч пен сынып жетекшіге арналған нақты, түсінікті кеңестер жазасың. " +
    "Мәтін 2–4 шағын абзацтан тұрсын. " +
    "Абзацтарда сынып жетекшісіне және завучқа не істеу керектігін нақты, практикалық түрде түсіндір. " +
    "Ешқандай маркерленген тізім, нөмірленген тізім қолданба. Тек қарапайым мәтін жаз. " +
    "Бір ойды әртүрлі сөздермен қайталама, әр абзацта жаңа аспект немесе жаңа қадам айт. " +
    (locale === "kk"
      ? "Қазақ тілінде жаз."
      : "Пиши на русском языке, просто и понятно.");

  const userPrompt = `
Оқушы: ${student.fullName}, сыныбы: ${student.className}.
Жынысы: ${student.gender === "male" ? "ұл" : "қыз"}.

Орташа баға: ${student.avgGrade}.
Үлгерім тренді (теріс болса – нашарлау): ${student.gradeTrend}.

Барлық келмеген күндер: ${student.absences}.
Себепсіз келмеген: ${student.unexcusedAbsences}.

Үй тапсырмаларын орындау: ${student.homeworkCompletion}%.
Мұғалім ескертулері: ${student.teacherAlerts}.
Сабақтағы белсенділік: ${
    student.lowActivity ? "төмен" : "қалыпты немесе жоғары"
  }.

Қиын пәндер: ${
    student.subjectsAtRisk?.length ? student.subjectsAtRisk.join(", ") : "жоқ"
  }.

Міндет:
- Қысқа емес, бірақ түсінікті 2–4 абзац жаз;
- Әр абзацты кеңес стилінде жаз: неге назар аудару керек және нақты не істеу керек;
- Маркерленген немесе нөмірленген тізім қолданба;
- Бірдей кеңесті басқа сөздермен қайталама, әр абзац жаңа ой немесе жаңа қадам болсын.
`;

  const body = {
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq error:", errorText);
    throw new Error(`Groq HTTP ${response.status}`);
  }

  const data = await response.json();

  const text: string =
    data?.choices?.[0]?.message?.content?.trim() ??
    "AI ұсынысын жасау мүмкін болмады.";

  return text;
}

/* ------------------------------------------------------------------ */
/*                 AI-рекомендации для целого класса                  */
/* ------------------------------------------------------------------ */

export type ClassAIContext = {
  className: string;
  totals: {
    total: number;
    girls: number;
    boys: number;
    avgGrade: number;
    riskCount: number;
    absences: number;
  };
  students: any[]; // достаточно shape, не строго типизируем
};

export async function getClassAIRecommendations(
  ctx: ClassAIContext,
  locale: "kk" | "ru" = "kk"
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_GROQ_API_KEY is not set");
  }

  const systemPrompt =
    "Сен мектеп завучысының цифрлық ассистентісің. " +
    "Саған бір сынып туралы агрегатталған деректер беріледі. " +
    "Сен завуч пен сынып жетекшіге арналған нақты, практикалық кеңестер жазасың. " +
    "Жауап 2–4 қысқа абзацтан тұрсын. " +
    "Әр абзацта сыныппен жұмыс істеудің нақты бағыты немесе қадамы жазылсын. " +
    "Ешқандай маркерленген (•, -) немесе нөмірленген (1., 2.) тізім қолданба. " +
    "Кеңестерді жай мәтінмен бер. " +
    "Бірдей ойды қайталама, әр абзац жаңа аспект немесе жаңа әрекет ұсынсын. " +
    (locale === "kk"
      ? "Қазақ тілінде, қысқа және түсінікті етіп жаз."
      : "Пиши на русском языке, простым и понятным языком.");

  // Берем топ-5 “проблемных” по себепсіз келмеу + үлгерім
  const topStudents = (ctx.students || [])
    .slice()
    .sort(
      (a, b) =>
        (b.unexcusedAbsences ?? 0) - (a.unexcusedAbsences ?? 0) ||
        (a.avgGrade ?? 0) - (b.avgGrade ?? 0)
    )
    .slice(0, 5);

  const topStudentsText =
    topStudents.length === 0
      ? "Маңызды жеке оқушылар тізімі жоқ."
      : topStudents
          .map((s: any) => {
            const subs = s.subjectsAtRisk?.length
              ? s.subjectsAtRisk.join(", ")
              : "жоқ";
            return `- ${s.fullName}, орташа баға: ${s.avgGrade}, себепсіз келмеген: ${s.unexcusedAbsences}, қиын пәндер: ${subs}`;
          })
          .join("\n");

  const userPrompt =
    locale === "kk"
      ? `
Сынып: ${ctx.className}

Құрамы:
- Барлығы: ${ctx.totals.total} оқушы
- Қыздар: ${ctx.totals.girls}
- Ұлдар: ${ctx.totals.boys}

Академиялық жағдай:
- Орташа баға: ${ctx.totals.avgGrade} / 5.0
- Қауіп тобындағы оқушылар саны (AI): ${ctx.totals.riskCount}

Қатысу:
- Барлық қатыспау саны (жыл бойы шамамен): ${ctx.totals.absences}

Фокус-оқушылар (мысалдар):
${topStudentsText}

Міндет:
Сынып жетекші мен завучқа арналған 2–4 абзац кеңес жаз.
Әр абзацта нақты не істеу керек екенін түсіндір (мысалы: қандай пәндерге қосымша қолдау беру, ата-анамен қандай форматта сөйлесу, қандай бақылау енгізу).
Маркерленген немесе нөмірленген тізімдер жазба, жай ғана абзац түріндегі мәтін жаз.
Бірдей ойды қайталама, әр абзац жаңа қадам немесе жаңа фокус болсын.
`
      : `
Класс: ${ctx.className}

Состав:
- Всего: ${ctx.totals.total} учеников
- Девочки: ${ctx.totals.girls}
- Мальчики: ${ctx.totals.boys}

Академическая ситуация:
- Средний балл: ${ctx.totals.avgGrade} / 5.0
- Количество учеников в группе риска (по данным AI): ${ctx.totals.riskCount}

Посещаемость:
- Общее количество пропусков (за год, примерно): ${ctx.totals.absences}

Фокус-ученики (примеры):
${topStudentsText}

Задача:
Сформулируй 2–4 абзаца советов для завуча и классного руководителя.
Каждый абзац — это отдельный вектор действий (например: работа с родителями, поддержка по конкретным предметам, организация доп. занятий, контроль посещаемости).
Не используй маркеры, не пиши списки и нумерацию — только сплошной текст.
Не повторяй одну и ту же мысль по-разному, каждый абзац должен добавлять что-то новое.
`;

  const body = {
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq error (class):", errorText);
    throw new Error(`Groq HTTP ${response.status}`);
  }

  const data = await response.json();
  const text: string =
    data?.choices?.[0]?.message?.content?.trim() ??
    "AI сынып бойынша ұсыныс жасай алмады.";

  return text;
}

export type AIRoleRecs = {
  teacher: string[];
  deputy: string[];
  parent: string[];
  psychologist: string[];
};

export type AIRiskAnalysis = {
  reasons: string[];
  psychSignals: string[];
  roleRecs: AIRoleRecs;
};

export async function getStudentAIRiskAnalysis(
  student: Student,
  lang: "kk" | "ru"
): Promise<AIRiskAnalysis> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_GROQ_API_KEY is not set");
  }

  const systemPrompt =
    "Сен мектептің цифрлық психо-педагогикалық ассистентісің. " +
    "Саған бір оқушы туралы деректер беріледі. " +
    "Сен тек JSON форматында аналитика қайтаруың керек. " +
    "ЕШҚАНДАЙ түсіндірме мәтін, комментарий, Markdown, ```json``` блоктары жазба. " +
    "Тек таза JSON-object қайтар. " +
    "JSON құрылымы қатаң түрде мынадай болу керек:\n" +
    "{\n" +
    '  "reasons": [ "…", "…" ],\n' +
    '  "psychSignals": [ "…", "…" ],\n' +
    '  "roleRecs": {\n' +
    '    "teacher": [ "…", "…" ],\n' +
    '    "deputy": [ "…", "…" ],\n' +
    '    "parent": [ "…", "…" ],\n' +
    '    "psychologist": [ "…", "…" ]\n' +
    "  }\n" +
    "}\n" +
    (lang === "kk"
      ? "Барлық жолдарды қазақ тілінде жаз. Қысқа, нақты, практикалық кеңестер бер."
      : "Все строки пиши на русском языке. Коротко, конкретно, практично.");

  const userPrompt = buildStudentRiskPrompt(student, lang);

  const body = {
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq error (student risk):", errorText);
    throw new Error(`Groq HTTP ${response.status}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error("Empty response from Groq for student risk analysis");
  }

  let parsed: AIRiskAnalysis;
  try {
    // На всякий случай обрежем пробелы
    parsed = JSON.parse(raw.trim());
  } catch (e) {
    console.error("Failed to parse AI JSON:", raw);
    throw new Error("AI JSON parse error");
  }

  return parsed;
}
