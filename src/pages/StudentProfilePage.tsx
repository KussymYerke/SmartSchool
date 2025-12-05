import { React, useMemo } from "react";
import { STUDENTS } from "../data/students";
import { useI18n } from "../i18n/i18n";
import {
  calculateRiskScore,
  getRiskLevel,
  type RiskLevel,
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

type StudentProfilePageProps = {
  studentId: number;
  onBack: () => void;
};

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
}) => {
  const { t } = useI18n();

  const student = STUDENTS.find((s) => s.id === studentId);

  const { riskScore, riskLevel } = useMemo(() => {
    if (!student) return { riskScore: 0, riskLevel: "none" as RiskLevel };
    const score = calculateRiskScore(student);
    const level = getRiskLevel(score);
    return { riskScore: score, riskLevel: level };
  }, [student]);

  // 🔹 Синтетическая история оценок по четвертям,
  // опираемся на avgGrade и тренд
  const gradeHistory = useMemo(() => {
    if (!student) return [];
    const base = student.avgGrade;
    const trend = student.gradeTrend;

    // делаем 4 точки: Q1..Q4
    const q1 = Math.min(5, Math.max(2, base - trend * 1.5));
    const q2 = Math.min(5, Math.max(2, base - trend * 0.5));
    const q3 = Math.min(5, Math.max(2, base + trend * 0.5));
    const q4 = Math.min(5, Math.max(2, base + trend * 1.0));

    return [
      { quarter: "Q1", grade: Number(q1.toFixed(1)) },
      { quarter: "Q2", grade: Number(q2.toFixed(1)) },
      { quarter: "Q3", grade: Number(q3.toFixed(1)) },
      { quarter: "Q4", grade: Number(q4.toFixed(1)) },
    ];
  }, [student]);

  // 🔹 Имитация пропусков по месяцам
  const absencesHistory = useMemo(() => {
    if (!student) return [];
    const total = student.absences;
    const unexcused = student.unexcusedAbsences;

    // грубо делим на 4 месяца
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

  // 🔹 Простые AI-рекомендации
  const aiRecommendations = useMemo(() => {
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

      {/* Верхний блок: инфо + AI блок + график оценок */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка: инфо + AI */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-700/70 p-4">
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

          <div className="rounded-2xl bg-indigo-950/50 border border-indigo-500/40 p-4">
            <h3 className="text-sm font-semibold text-indigo-100 mb-3">
              {t("student.aiTitle", "AI ұсыныстар (завуч үшін)")}
            </h3>
            <ul className="space-y-2 text-xs text-indigo-100/90">
              {aiRecommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Правая часть: график оценок */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-700/70 p-4">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">
            {t("student.gradeChart", "Үлгерім динамикасы (тоқсан бойынша)")}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gradeHistory} margin={{ left: -20, right: 10 }}>
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

      {/* Нижний блок: график пропусков */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-700/70 p-4">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">
          {t("student.absencesChart", "Қатыспау динамикасы (айлар бойынша)")}
        </h3>
        <div className="h-64">
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
  );
};
