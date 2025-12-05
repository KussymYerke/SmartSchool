// src/data/riskUtils.ts
import { STUDENTS } from "./students";

export type Student = (typeof STUDENTS)[number];

export type RiskLevel = "none" | "low" | "medium" | "high";

export function calculateRiskScore(student: any): number {
  let score = 0;

  if (student.avgGrade < 3.5) score += 40;
  else if (student.avgGrade < 4) score += 20;

  if (student.gradeTrend < -0.2) score += 20;
  if (student.unexcusedAbsences > 0) score += 25;
  if (student.lowActivity) score += 15;
  if (student.subjectsAtRisk.length > 0) score += 30;

  return score;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  if (score >= 15) return "low";
  return "none";
}

export function isAtRisk(level: RiskLevel): boolean {
  return level === "medium" || level === "high";
}
