// src/pages/StudentProfilePage.tsx
import React, { useMemo, useEffect, useState } from "react";
import { STUDENTS } from "../data/students";
import { useI18n } from "../i18n/i18n";
import {
  calculateRiskScore,
  getRiskLevel,
  type RiskLevel,
  getRiskReasons,
  getRoleRecommendations,
  getPsychSignals,
} from "../data/riskUtils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  getStudentAIRecommendations,
  getStudentAIRiskAnalysis,
  type AIRiskAnalysis,
} from "../services/ai";

type StudentProfilePageProps = {
  studentId: string;
  onBack: () => void;
  // роль можно подставить из auth-контекста
  userRole?: UserRole;
};

type UserRole = "deputy" | "teacher" | "psychologist" | "parent" | "admin";

const riskColorClass: Record<RiskLevel, string> = {
  none: "bg-slate-500/10 text-slate-300 border border-slate-600/40",
  low: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40",
  medium: "bg-amber-500/10 text-amber-300 border border-amber-500/40",
  high: "bg-red-500/10 text-red-300 border border-red-500/40",
};

const riskLabel: Record<RiskLevel, string> = {
  none: "Норма",
  low: "Низкий риск",
  medium: "Орташа риск",
  high: "Жоғары риск",
};

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({
  studentId,
  onBack,
  userRole = "deputy", // по умолчанию завуч / админ
}) => {
  const { t } = useI18n();

  const student = STUDENTS.find((s) => s.id === studentId);

  // ---------- RISK SCORE ----------
  const { riskScore, riskLevel } = useMemo(() => {
    if (!student) return { riskScore: 0, riskLevel: "none" as RiskLevel };
    const score = calculateRiskScore(student);
    const level = getRiskLevel(score);
    return { riskScore: score, riskLevel: level };
  }, [student]);

  // ---------- AI state: текст для завуча ----------
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // ---------- AI state: структурированный риск-анализ ----------
  const [aiRisk, setAiRisk] = useState<AIRiskAnalysis | null>(null);
  const [aiRiskLoading, setAiRiskLoading] = useState(false);

  // ---------- Rule-based fallback (old logic) ----------
  const ruleBased = useMemo(() => {
    if (!student) {
      return {
        reasons: [] as string[],
        roleRecs: null as ReturnType<typeof getRoleRecommendations> | null,
        psychSignals: [] as string[],
      };
    }
    return {
      reasons: getRiskReasons(student),
      roleRecs: getRoleRecommendations(student),
      psychSignals: getPsychSignals(student),
    };
  }, [student]);

  // ---------- Финальные данные риска: AI -> fallback ----------
  const riskData = useMemo(() => {
    if (!student) {
      return {
        reasons: [] as string[],
        roleRecs: null as ReturnType<typeof getRoleRecommendations> | null,
        psychSignals: [] as string[],
      };
    }

    return {
      reasons: aiRisk?.reasons?.length ? aiRisk.reasons : ruleBased.reasons,
      roleRecs:
        aiRisk?.roleRecs &&
        Object.values(aiRisk.roleRecs).some((arr) => arr.length > 0)
          ? aiRisk.roleRecs
          : ruleBased.roleRecs,
      psychSignals: aiRisk?.psychSignals?.length
        ? aiRisk.psychSignals
        : ruleBased.psychSignals,
    };
  }, [student, aiRisk, ruleBased]);

  // ---------- Старые rule-based рекомендации как fallback для AI блока ----------
  const aiRecommendationsFallback = useMemo(() => {
    if (!student) return [];

    const recs: string[] = [];

    if (student.avgGrade < 3.5) {
      recs.push(
        "Орташа баға төмен – пән мұғалімдерімен жеке жоспар құру ұсынылады."
      );
    } else if (student.avgGrade < 4) {
      recs.push(
        "Бағалар тұрақсыз, үлгерімді тұрақтандыру үшін қосымша бақылау қажет."
      );
    }

    if (student.gradeTrend < -0.2) {
      recs.push(
        "Соңғы тоқсандарда үлгерімі төмендеп жатыр – себептерін (мотивация, қиын пәндер, отбасылық жағдай) анықтау керек."
      );
    }

    if (student.unexcusedAbsences > 0) {
      recs.push(
        "Себепсіз келмеулер бар – сынып жетекшісі мен ата-анамен бірге профилактикалық әңгіме өткізу ұсынылады."
      );
    }

    if (student.lowActivity) {
      recs.push(
        "Сабақтағы белсенділігі төмен – топтық жұмыс, жобалар, сынып ішіндегі рөлдерді беріп көру керек."
      );
    }

    if (student.subjectsAtRisk.length > 0) {
      recs.push(
        `Қиын пәндер: ${student.subjectsAtRisk.join(
          ", "
        )}. Репетитор, факультатив немесе консультация сағаттарын ұсыну керек.`
      );
    }

    if (recs.length === 0) {
      recs.push(
        "Қазіргі уақытта айқын тәуекелдер жоқ. Динамиканы бақылауды жалғастыру жеткілікті."
      );
    }

    return recs;
  }, [student]);

  // ---------- AI: длинный текст рекомендаций ----------
  useEffect(() => {
    if (!student) return;

    let cancelled = false;

    const run = async () => {
      try {
        setAiLoading(true);
        setAiText(null);

        const text = await getStudentAIRecommendations(student, "kk");

        if (!cancelled) {
          setAiText(text);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) {
          setAiLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [student]);

  // ---------- AI: структурированный риск-анализ (причины, сигналы, роли) ----------
  useEffect(() => {
    if (!student) return;

    let cancelled = false;

    const run = async () => {
      try {
        setAiRiskLoading(true);
        setAiRisk(null);

        const data = await getStudentAIRiskAnalysis(student, "kk");

        if (!cancelled) {
          setAiRisk(data);
        }
      } catch (e) {
        console.error("AI risk analysis error:", e);
        // Ничего страшного — просто останемся на rule-based
      } finally {
        if (!cancelled) {
          setAiRiskLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [student]);

  // ---------- Синтетическая история оценок ----------
  const gradeHistory = useMemo(() => {
    if (!student) return [];
    const base = student.avgGrade;
    const trend = student.gradeTrend;

    const q1 = Math.min(5, Math.max(2, base - trend * 1.5));
    const q2 = Math.min(5, Math.max(2, base - trend * 0.5));

    return [
      { quarter: "Q1", grade: Number(q1.toFixed(1)) },
      { quarter: "Q2", grade: Number(q2.toFixed(1)) },
    ];
  }, [student]);

  // ---------- Имитация пропусков по месяцам ----------
  const absencesHistory = useMemo(() => {
    if (!student) return [];
    const total = student.absences;
    const unexcused = student.unexcusedAbsences;

    const m1 = Math.round(total * 0.25);
    const m2 = Math.round(total * 0.25);
    const m3 = Math.round(total * 0.25);
    const m4 = total - m1 - m2 - m3;

    const u1 = Math.min(unexcused, Math.round(unexcused * 0.3));
    const u2 = Math.min(unexcused - u1, Math.round(unexcused * 0.3));
    const u3 = Math.min(unexcused - u1 - u2, Math.round(unexcused * 0.2));
    const u4 = Math.max(0, unexcused - u1 - u2 - u3);

    return [
      { month: "Қыркүйек", abs: m1, unexcused: u1 },
      { month: "Қазан", abs: m2, unexcused: u2 },
      { month: "Қараша", abs: m3, unexcused: u3 },
      { month: "Желтоқсан", abs: m4, unexcused: u4 },
    ];
  }, [student]);

  // ---------- Если ученик не найден ----------
  if (!student) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm text-slate-300 hover:text-slate-100"
        >
          ← {t("student.back", "Артқа қайту")}
        </button>
        <p className="text-slate-300">
          {t("student.notFound", "Оқушы табылмады.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center text-sm text-slate-300 hover:text-slate-100 mb-2"
      >
        ← {t("student.back", "Артқа қайту")}
      </button>

      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90 border border-slate-800/80 p-4 md:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
              {student.fullName}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {student.className} ·{" "}
              {student.gender === "male" ? "Ұл бала" : "Қыз бала"}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <span
              className={
                "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium " +
                riskColorClass[riskLevel]
              }
            >
              {riskLabel[riskLevel]}
              <span className="ml-2 text-[10px] text-slate-300/80">
                score: {riskScore}
              </span>
            </span>
            <p className="text-xs text-slate-400">
              {t("student.avgGradeLabel", "Жалпы орташа баға:")}{" "}
              <span className="font-semibold text-slate-100">
                {student.avgGrade.toFixed(1)} / 5.0
              </span>
            </p>
          </div>
        </div>

        {/* Причины риска, компактно (AI -> fallback) */}
        {riskData.reasons.length > 0 && (
          <div className="mt-2">
            <div className="max-w-3xl text-[11px] text-slate-300/90">
              <p className="font-semibold text-slate-200 mb-1">
                Причина риска:
              </p>
              {aiRiskLoading && (
                <p className="text-[10px] text-slate-500 mb-1">
                  AI талдау жүктелуде...
                </p>
              )}
              <ul className="flex flex-wrap gap-1.5">
                {riskData.reasons.map((r, idx) => (
                  <li
                    key={idx}
                    className="px-2 py-1 rounded-full bg-slate-800/80 text-[11px] text-slate-100 border border-slate-700/70"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Основная сетка: 2 колонки, чтобы не было пустоты справа/слева */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Левая колонка: инфо + график оценок */}
        <div className="space-y-4">
          {/* Основная информация */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-700/70 p-4 md:p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">
              {t("student.info", "Негізгі ақпарат")}
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">
                  {t("student.class", "Сынып")}
                </dt>
                <dd className="text-slate-100">{student.className}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">
                  {t("student.gender", "Жынысы")}
                </dt>
                <dd className="text-slate-100">
                  {student.gender === "male" ? "Ұл бала" : "Қыз бала"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">
                  {t("student.absences", "Жалпы келмеген күн")}
                </dt>
                <dd className="text-slate-100">{student.absences}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">
                  {t("student.unexcusedAbsences", "Себепсіз келмеген")}
                </dt>
                <dd className="text-red-300">{student.unexcusedAbsences}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">
                  {t("student.homework", "Үй тапсырмаларын орындау")}
                </dt>
                <dd className="text-slate-100">
                  {student.homeworkCompletion}%
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">
                  {t("student.teacherAlerts", "Мұғалім ескертулері")}
                </dt>
                <dd className="text-slate-100">{student.teacherAlerts}</dd>
              </div>
            </dl>
          </div>

          {/* График успеваемости */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-700/70 p-4 md:p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">
              {t("student.gradeChart", "Үлгерім динамикасы (тоқсан бойынша)")}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={gradeHistory}
                  margin={{ left: -20, right: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="quarter" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    domain={[2, 5]}
                    stroke="#9ca3af"
                    fontSize={12}
                    tickCount={7}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid #1f2937",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="grade"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2, stroke: "#a5b4fc" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Правая колонка: AI + психосигналы + график пропусков */}
        <div className="space-y-4">
          {/* AI рекомендации */}
          <div className="rounded-2xl bg-indigo-950/60 border border-indigo-500/40 p-4 md:p-5">
            <h3 className="text-sm font-semibold text-indigo-100 mb-3">
              {t("student.aiTitle", "AI ұсыныстар (завуч үшін)")}
            </h3>

            {aiLoading && (
              <p className="text-xs text-indigo-100/80">
                AI ұсыныстарын есептеу жүріп жатыр...
              </p>
            )}

            {!aiLoading && aiText && (
              <div className="text-xs text-indigo-100/90 whitespace-pre-line max-h-48 overflow-y-auto pr-1 custom-scroll-thin leading-relaxed">
                {aiText}
              </div>
            )}

            {!aiLoading && !aiText && (
              <ul className="space-y-2 text-xs text-indigo-100/90 leading-relaxed">
                {aiRecommendationsFallback.map((rec, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Психологические сигналы */}
          <div className="rounded-2xl bg-slate-950/70 border border-rose-500/40 p-4 md:p-5">
            <h3 className="text-sm font-semibold text-rose-100 mb-2">
              Психологиялық сигналдар (тек завуч пен психолог үшін)
            </h3>
            <ul className="text-xs text-rose-50 space-y-1.5 leading-relaxed">
              {riskData.psychSignals.map((s, idx) => (
                <li key={idx}>• {s}</li>
              ))}
            </ul>
            <p className="text-[10px] text-rose-200/70 mt-2">
              Ескерту: бұл ақпарат болашақта рөлдік қолжетімділік арқылы ғана
              көрінеді (завуч / психолог).
            </p>
          </div>

          {/* График пропусков */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-700/70 p-4 md:p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">
              {t(
                "student.absencesChart",
                "Қатыспау динамикасы (айлар бойынша)"
              )}
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={absencesHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid #1f2937",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="abs" name="Барлығы" fill="#38bdf8" />
                  <Bar dataKey="unexcused" name="Себепсіз" fill="#f97373" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Рекомендации по ролям – во всю ширину, ниже основной сетки */}
      {riskData.roleRecs && (
        <RoleRecommendationsSection
          roleRecs={riskData.roleRecs}
          userRole={userRole}
        />
      )}
    </div>
  );
};

/* ---------- Блок рекомендаций по ролям с фильтрацией по userRole ---------- */

type RoleKey = "teacher" | "deputy" | "parent" | "psychologist";

const userRoleLabel = (role?: UserRole): string => {
  switch (role) {
    case "teacher":
      return "Мұғалім";
    case "psychologist":
      return "Психолог";
    case "parent":
      return "Ата-ана";
    case "admin":
      return "Админ";
    case "deputy":
    default:
      return "Завуч";
  }
};

const RoleRecommendationsSection: React.FC<{
  roleRecs:
    | NonNullable<ReturnType<typeof getRoleRecommendations>>
    | AIRiskAnalysis["roleRecs"];
  userRole?: UserRole;
}> = ({ roleRecs, userRole }) => {
  // Приводим к единому виду (на случай rule-based или AI)
  const normalized = roleRecs as any;

  const visibleRoles: RoleKey[] = (() => {
    switch (userRole) {
      case "teacher":
        return ["teacher"];
      case "psychologist":
        // психолог видит советы себе и родителям
        return ["psychologist", "parent"];
      case "parent":
        return ["parent"];
      case "admin":
      case "deputy":
      default:
        // завуч / админ видит все
        return ["teacher", "deputy", "parent", "psychologist"];
    }
  })();

  const config: { key: RoleKey; label: string; accent: string; bg: string }[] =
    [
      {
        key: "teacher",
        label: "Мұғалімге",
        accent: "text-indigo-300",
        bg: "bg-slate-900/80",
      },
      {
        key: "deputy",
        label: "Завучқа",
        accent: "text-sky-300",
        bg: "bg-slate-900/80",
      },
      {
        key: "parent",
        label: "Ата-анаға",
        accent: "text-emerald-300",
        bg: "bg-slate-900/80",
      },
      {
        key: "psychologist",
        label: "Психологқа",
        accent: "text-rose-300",
        bg: "bg-slate-900/80",
      },
    ];

  const hasAnyVisible = visibleRoles.some((key) => normalized[key]?.length > 0);

  if (!hasAnyVisible) return null;

  return (
    <section className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-4 lg:p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            Ұсыныстар по ролям
          </h3>
          <p className="text-[11px] text-slate-400">
            Блок автоматически фильтруется под роль вошедшего пользователя.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[11px] bg-slate-900/80 border border-slate-700/70 text-slate-300">
          Роль:{" "}
          <span className="font-semibold text-slate-100">
            {userRoleLabel(userRole)}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {config.map(({ key, label, accent, bg }) => {
          if (!visibleRoles.includes(key)) return null;
          const items: string[] = normalized[key] ?? [];
          if (!items.length) return null;

          return (
            <div
              key={key}
              className={`rounded-2xl border border-slate-800/80 ${bg} p-3`}
            >
              <p className={`text-xs font-semibold mb-2 ${accent}`}>{label}</p>
              <ul className="space-y-1.5 text-[11px] text-slate-100/90">
                {items.map((text, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-slate-300/80 shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
};
