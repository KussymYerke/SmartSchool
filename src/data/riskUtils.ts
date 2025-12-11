// src/data/riskUtils.ts
import { STUDENTS } from "./students";

export type Student = (typeof STUDENTS)[number];

export type RiskLevel = "none" | "low" | "medium" | "high";

export function getRiskReasons(student: Student): string[] {
  const reasons: string[] = [];

  if (student.avgGrade < 3.0) {
    reasons.push("Орташа баға 3.0-ден төмен – үлгерім айқын қауіп аймағында.");
  } else if (student.avgGrade < 3.5) {
    reasons.push("Орташа баға 3.5-ке жақын – үлгерім шекті деңгейде.");
  }

  if (student.gradeTrend < -0.3) {
    reasons.push(
      "Соңғы тоқсандарда бағалар едәуір төмендеп жатыр (теріс тренд)."
    );
  }

  if (student.unexcusedAbsences >= 3) {
    reasons.push(
      "Себепсіз келмей қалу саны жоғары – мектепке қатынасында тәуекел бар."
    );
  } else if (student.unexcusedAbsences > 0) {
    reasons.push("Себепсіз келмей қалулар бар – профилактика қажет.");
  }

  if (student.lowActivity) {
    reasons.push(
      "Сабақтағы белсенділігі төмен – мотивация немесе уайым болуы мүмкін."
    );
  }

  if (student.teacherAlerts > 0) {
    reasons.push(
      "Мұғалім ескертулері тіркелген – тәртіп немесе эмоционалдық фонды бақылау керек."
    );
  }

  if (student.subjectsAtRisk.length > 0) {
    reasons.push(
      `Қиын пәндер: ${student.subjectsAtRisk.join(
        ", "
      )} – осы пәндер бойынша жүйелі қиындықтар байқалады.`
    );
  }

  if (!reasons.length) {
    reasons.push("Айқын тәуекел факторлары анықталған жоқ.");
  }

  return reasons;
}

export type Role = "teacher" | "deputy" | "parent" | "psychologist";

export type RoleRecommendations = Record<Role, string[]>;

export function getRoleRecommendations(student: Student): RoleRecommendations {
  const recs: RoleRecommendations = {
    teacher: [],
    deputy: [],
    parent: [],
    psychologist: [],
  };

  // Мұғалім
  if (student.avgGrade < 3.5 || student.subjectsAtRisk.length > 0) {
    recs.teacher.push(
      "2 аптаға тапсырмалардың күрделілігін сәл төмендетіп, базалық тақырыптарды бекіту.",
      "Сабақтағы белсенділік үшін қосымша 2 баға қою (ауызша жауап, мини-жоба)."
    );
  }
  if (student.lowActivity) {
    recs.teacher.push(
      "Топтық жұмыс пен рөлдік тапсырмалар арқылы оқушыны белсенділікке тарту."
    );
  }

  // Завуч
  if (student.unexcusedAbsences > 0 || student.teacherAlerts > 0) {
    recs.deputy.push(
      "Сынып жетекшісімен бірге қатыспау және ескертулер динамикасын 1 ай бойы бақылау.",
      "Қажет болған жағдайда ата-анамен бірлескен кездесу ұйымдастыру."
    );
  }
  if (student.gradeTrend < -0.3) {
    recs.deputy.push(
      "Пән мұғалімдерімен бірлесе оқу траекториясын қайта қарау (қосымша сабақтар, консультациялар)."
    );
  }

  // Ата-ана
  if (student.absences > 0) {
    recs.parent.push(
      "Қатыспау себептерін баламен және сынып жетекшісімен бірге тыныш форматта талқылау.",
      "Ұйқы және күн тәртібін тексеру: жатып ұйықтау уақыты, экран алдындағы уақыт."
    );
  }
  if (student.homeworkCompletion < 80) {
    recs.parent.push(
      "Үй тапсырмасын орындау үшін тұрақты уақыт пен тыныш орын белгілеу."
    );
  }

  // Психолог
  if (
    student.gradeTrend < -0.3 ||
    student.lowActivity ||
    student.teacherAlerts > 0
  ) {
    recs.psychologist.push(
      "Қысқа диагностикалық әңгіме өткізу (мотивация, уайым, сыныппен қарым-қатынас).",
      "Қажет болса, өзін-өзі реттеу және стресс басқару бойынша жаттығулар ұсыну."
    );
  }
  if (student.unexcusedAbsences >= 3) {
    recs.psychologist.push(
      "Мектепке қатысуға байланысты жасырын уайымдар немесе конфликттер бар-жоғын анықтау."
    );
  }

  // если где-то пусто — добавим общее
  if (!recs.teacher.length) {
    recs.teacher.push(
      "Үлгерім мен белсенділік динамикасын бақылауды жалғастыру, тұрақты кері байланыс беру."
    );
  }
  if (!recs.deputy.length) {
    recs.deputy.push(
      "Бұл оқушыға қатысты ерекше тәуекел байқалмайды, бірақ жалпы сынып мониторингінде ұстау жеткілікті."
    );
  }
  if (!recs.parent.length) {
    recs.parent.push(
      "Баламен оқу жоспары мен болашақ мақсаттары туралы позитивті әңгімелер жүргізуді жалғастыру."
    );
  }
  if (!recs.psychologist.length) {
    recs.psychologist.push(
      "Қажет болған жағдайда ғана, сынып жетекшісінің сұрауы бойынша консультация өткізу."
    );
  }

  return recs;
}

// Психологиялық сигналдар (для отдельного блока)
export function getPsychSignals(student: Student): string[] {
  const signals: string[] = [];

  if (student.gradeTrend <= -0.5) {
    signals.push("Соңғы уақытта бағалары күрт төмендеп кетті.");
  }
  if (student.lowActivity) {
    signals.push("Сабақта белсенділігі төмендеп, бастама көтермейді.");
  }
  if (student.teacherAlerts >= 2) {
    signals.push("Мұғалім тарапынан бірнеше ескерту тіркелген.");
  }
  if (student.unexcusedAbsences >= 3) {
    signals.push("Себепсіз келмей қалу саны жоғары.");
  }

  if (!signals.length) {
    signals.push("Қазіргі уақытта айқын психологиялық сигналдар тіркелмеген.");
  }

  return signals;
}

// -------- НОВАЯ, БОЛЕЕ МЯГКАЯ ФОРМУЛА РИСКА --------
export function calculateRiskScore(student: Student): number {
  let score = 0;

  // 1. Үлгерім (академический блок)
  if (student.avgGrade < 2.5) score += 40;
  else if (student.avgGrade < 3.0) score += 30;
  else if (student.avgGrade < 3.5) score += 20;
  else if (student.avgGrade < 4.0) score += 10;
  // 4+ – почти не штрафуем

  // Динамика бағасы
  if (student.gradeTrend < -0.5) score += 15;
  else if (student.gradeTrend < -0.2) score += 8;

  // 2. Қатыспау (посещаемость)
  // Себепсіз қатыспау — сильный триггер
  score += student.unexcusedAbsences * 4;
  if (student.unexcusedAbsences >= 5) score += 10; // совсем много

  // Себепті қатыспау — слабее
  const excused = Math.max(student.absences - student.unexcusedAbsences, 0);
  score += excused * 1.5;

  // 3. Үй тапсырмасы
  if (student.homeworkCompletion < 50) score += 25;
  else if (student.homeworkCompletion < 70) score += 18;
  else if (student.homeworkCompletion < 85) score += 8;
  // 85–100 — норм, почти без штрафа

  // 4. Мұғалімдердің ескертулері
  score += student.teacherAlerts * 10;

  // 5. Қиын пәндер саны
  score += (student.subjectsAtRisk?.length ?? 0) * 5;

  // 6. Сабақта төмен активтілік
  if (student.lowActivity) score += 8;

  return score;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 85) return "high"; // өте күрделі кейстер
  if (score >= 45) return "medium"; // негізгі «сары» фокус-топ
  if (score >= 25) return "low"; // жеңіл бақылау
  return "none";
}

export function isAtRisk(level: RiskLevel): boolean {
  return level === "medium" || level === "high";
}
