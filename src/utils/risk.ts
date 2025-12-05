// src/utils/risk.ts
import type { RiskLevel, Student } from "../types/school";

export const calculateRiskScore = (s: Student): number => {
  let score = 0;

  // низкий средний балл
  if (s.avgGrade < 3.5) score += 3;
  else if (s.avgGrade < 4.0) score += 1;

  // падение оценок
  if (s.gradeTrend <= -0.5) score += 3;
  else if (s.gradeTrend < 0) score += 1;

  // пропуски
  if (s.absences >= 15) score += 3;
  else if (s.absences >= 8) score += 2;
  else if (s.absences >= 4) score += 1;

  // прогулы без уважительной
  if (s.unexcusedAbsences >= 5) score += 3;
  else if (s.unexcusedAbsences >= 2) score += 2;
  else if (s.unexcusedAbsences >= 1) score += 1;

  // домашки
  if (s.homeworkCompletion < 60) score += 3;
  else if (s.homeworkCompletion < 75) score += 2;
  else if (s.homeworkCompletion < 90) score += 1;

  // низкая активность
  if (s.lowActivity) score += 2;

  // комментарии учителей
  if (s.teacherAlerts >= 3) score += 3;
  else if (s.teacherAlerts >= 1) score += 1;

  return score;
};

export const riskLevelFromScore = (score: number): RiskLevel => {
  if (score >= 10) return "high";
  if (score >= 6) return "medium";
  return "low";
};
