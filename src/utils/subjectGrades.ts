// src/utils/subjectGrades.ts
import type { Student } from "../data/riskUtils";
import { isSubjectInRisk } from "./subjects";

// deterministic string hash (fast, good enough for demo)
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    // FNV-1a-ish
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// For demo/presentation: keep a realistic minimum, but avoid identical 2.6 everywhere.
// If grade drops below 2.6 we lift it into the 2.6–3.0 band with a deterministic per-student-per-subject jitter.
function floorWithJitter(grade: number, seed: number): number {
  if (grade >= 2.6) return grade;
  // lift into 2.6..3.4 with 0.1 step (deterministic, per-student-per-subject)
  // so we don't end up with "2.6" repeated across all subjects.
  const jitter = ((seed >>> 17) % 9) / 10; // 0.0..0.8
  return 2.6 + jitter;
}

/**
 * Generates a subject-specific grade from the student's global signals.
 * This is demo-only (no backend), but it gives consistent per-student, per-subject values.
 */
export function getSubjectGrade(student: Student, subjectCode: string): number {
  // stable per-student-per-subject "profile"
  const h = hashString(`${student.id}:${subjectCode}`);
  const r1 = ((h % 1000) / 1000) * 2 - 1;      // -1..1
  const r2 = (((h >> 10) % 1000) / 1000) * 2 - 1;

  // baseline ability: tied to avgGrade but nudged by behavior signals
  // (absences/alerts push it down slightly)
  const behaviorPenalty =
    clamp(student.unexcusedAbsences * 0.08 + student.teacherAlerts * 0.12, 0, 1.2);

  let base = student.avgGrade - behaviorPenalty;

  // subject affinity: some subjects are naturally stronger/weaker for a student (±0.45)
  const affinity = r1 * 0.45;

  // volatility/noise: small, so grades look realistic (±0.20)
  const noise = r2 * 0.20;

  let grade = base + affinity + noise;

  // If explicitly in risk for this subject — lower and slightly more unstable
  if (isSubjectInRisk(student.subjectsAtRisk, subjectCode)) {
    grade -= 0.6 + Math.abs(r1) * 0.4; // 0.6..1.0
  }

  // Absences matter for specific subjects too
  if (student.unexcusedAbsences >= 3) grade -= 0.2;
  if (student.absences >= 10) grade -= 0.1;

  // For demo/presentation: keep the minimum realistic (no 2.0 values),
  // but don't let everything collapse to the same 2.6.
  grade = floorWithJitter(grade, h);
  grade = clamp(grade, 2.6, 5.0);

  // Make it look like real grading: one decimal is ok for demo
  return Math.round(grade * 10) / 10;
}

export function getSubjectTrend(student: Student, subjectCode: string): number {
  const h = hashString(`trend:${student.id}:${subjectCode}`);
  const r = ((h % 1000) / 1000) * 2 - 1; // -1..1

  // trend follows global trend, but each subject can diverge a bit
  let trend = student.gradeTrend * 0.7 + r * 0.35;

  // if the subject is in risk, trend is more likely negative
  if (isSubjectInRisk(student.subjectsAtRisk, subjectCode)) {
    trend -= 0.25 + Math.abs(r) * 0.15;
  }

  // spikes: lots of unexcused absences -> downward trend
  if (student.unexcusedAbsences >= 4) trend -= 0.2;

  trend = clamp(trend, -1.2, 1.2);
  return Math.round(trend * 10) / 10;
}

export function calculateSubjectRiskScore(student: Student, subjectCode: string): number {
  const grade = getSubjectGrade(student, subjectCode);
  const trend = getSubjectTrend(student, subjectCode);
  let score = 0;

  if (grade < 2.5) score += 50;
  else if (grade < 3.0) score += 38;
  else if (grade < 3.5) score += 26;
  else if (grade < 4.0) score += 12;

  if (trend < -0.5) score += 12;
  else if (trend < -0.2) score += 6;

  if (isSubjectInRisk(student.subjectsAtRisk, subjectCode)) score += 12;

  score += student.unexcusedAbsences * 2;
  score += student.teacherAlerts * 6;
  if (student.lowActivity) score += 5;

  return Math.round(score);
}
