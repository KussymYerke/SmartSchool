// src/data/riskUtils.ts
import { STUDENTS } from "./students";

export type Student = (typeof STUDENTS)[number];

export type RiskLevel = "low" | "medium" | "high" | "none";

export function calculateRiskScore(student: Student): number {
  let score = 0;

  // Низкий средний балл
  if (student.avgGrade < 3) score += 3;
  else if (student.avgGrade < 3.5) score += 2;
  else if (student.avgGrade < 4) score += 1;

  // Падающий тренд
  if (student.gradeTrend < -0.3) score += 3;
  else if (student.gradeTrend < -0.1) score += 2;

  // Пропуски
  if (student.unexcusedAbsences >= 3) score += 3;
  else if (student.unexcusedAbsences >= 1) score += 2;

  if (student.absences >= 10) score += 2;
  else if (student.absences >= 5) score += 1;

  // Низкая активность
  if (student.lowActivity) score += 2;

  // Домашки
  if (student.homeworkCompletion < 60) score += 2;
  else if (student.homeworkCompletion < 75) score += 1;

  // Замечания учителя
  if (student.teacherAlerts >= 2) score += 3;
  else if (student.teacherAlerts === 1) score += 2;

  // Предметы в зоне риска
  if (student.subjectsAtRisk.length >= 3) score += 3;
  else if (student.subjectsAtRisk.length >= 1) score += 2;

  return score;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 10) return "high";
  if (score >= 5) return "medium";
  if (score > 0) return "low";
  return "none";
}

export function isAtRisk(student: Student): boolean {
  return getRiskLevel(calculateRiskScore(student)) !== "none";
}
