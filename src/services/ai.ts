// src/services/ai.ts
// Сервис для получения AI-рекомендаций по ученику через Groq API

import type { Student } from "../types/student";

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
    "Сен завуч пен сынып жетекшіге арналған нақты, қысқа ұсыныстар жазасың. " +
    "Ұсыныстар 3–6 тармақтан тұрсын. " +
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
- завуч пен сынып жетекшіге арналған ұсыныстар жаз;
- неге назар аудару керек;
- ата-анамен/мұғалімдермен қандай жұмыс жүргізу керек;
- қай пәндерге/құзыреттерге басымдық беру керек.
`;

  // Модель Groq (Llama 3.1, быстрая и дешёвая)
  const body = {
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
  };

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    }
  );

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
