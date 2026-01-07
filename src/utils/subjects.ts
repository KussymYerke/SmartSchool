// src/utils/subjects.ts

/**
 * Demo data historically used `kazakh` as a single subject.
 * UX now splits it into:
 * - kazakh_lang (Қазақ тілі)
 * - kazakh_lit  (Қазақ әдебиеті)
 */
export function expandSubjectsAtRisk(codes: string[]): string[] {
  const out: string[] = [];
  const push = (v: string) => {
    if (!out.includes(v)) out.push(v);
  };

  for (const c of codes ?? []) {
    if (c === "kazakh") {
      push("kazakh_lang");
      push("kazakh_lit");
    } else {
      push(c);
    }
  }

  return out;
}

export function isSubjectInRisk(codes: string[] | undefined, subjectCode: string): boolean {
  if (!subjectCode) return false;
  const expanded = expandSubjectsAtRisk(codes ?? []);
  return expanded.includes(subjectCode);
}
