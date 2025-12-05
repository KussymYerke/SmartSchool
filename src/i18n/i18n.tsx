import React, { createContext, useContext, useState, useMemo } from "react";
import type { ReactNode } from "react";

type Language = "ru" | "kk";

type I18nContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ru: {
    // --- Общие ---
    "app.brand": "Smart School Panel",
    "app.schoolLabel": "School",

    // --- Topbar ---
    "topbar.title": "Панель завуча",
    "topbar.subtitle": "Учебный год 2024–2025 · Реальное время аналитики",
    "topbar.role": "Завуч по учебной части",

    // --- Sidebar ---
    "nav.dashboard": "Дашборд",
    "nav.orders": "Приказы",
    "nav.classes": "Аналитика классов",
    "nav.teachers": "Педагоги",
    "nav.assessments": "СОР / СОЧ",
    "nav.risk": "Группа риска (AI)",
    "nav.footer": "© {year} School Analytics",

    // --- Dashboard ---
    "dashboard.overview.title": "Общий обзор школы",
    "dashboard.overview.subtitle":
      "Здесь завуч видит ключевые метрики: состав школы, успеваемость, риски и нагрузку учителей.",
    "dashboard.stat.students.label": "Ученики",
    "dashboard.stat.students.subtitle":
      "26 классов · 312 мальчиков · 312 девочек",
    "dashboard.stat.students.trendLabel": "с прошлого года",
    "dashboard.stat.students.trendValue": "+3.1%",
    "dashboard.stat.excellents.label": "Отличники",
    "dashboard.stat.excellents.subtitle": "Превышает норматив школы",
    "dashboard.stat.excellents.trendLabel": "динамика",
    "dashboard.stat.excellents.trendValue": "+1.4%",
    "dashboard.stat.teachers.label": "Учителя",
    "dashboard.stat.teachers.subtitle":
      "Профили и курсы повышения квалификации",
    "dashboard.stat.teachers.trendLabel": "новых",
    "dashboard.stat.teachers.trendValue": "+3",
    "dashboard.stat.risk.label": "Ученики в группе риска",
    "dashboard.stat.risk.subtitle": "По данным AI-мониторинга",
    "dashboard.stat.risk.trendLabel": "за месяц",
    "dashboard.stat.risk.trendValue": "+2",

    "dashboard.assessments.title": "Аналитика по СОР / СОЧ",
    "dashboard.assessments.subtitle":
      "Краткий обзор: по каким предметам больше всего низких оценок, где есть риск «провала» по параллелям.",
    "dashboard.assessments.placeholder":
      "Здесь позже сделаем графики: столбики по предметам, фильтр по четвертям и классам.",

    "dashboard.quickActions.title": "Быстрые действия",
    "dashboard.quickActions.orders": "Открыть список приказов",
    "dashboard.quickActions.classes": "Смотреть аналитику по классам",
    "dashboard.quickActions.risk": "Список учеников «в группе риска»",

    // --- Заглушки страниц ---

    "classes.title": "Аналитика по классам",
    "classes.subtitle":
      "Позже здесь сделаем таблицу/карточки по каждому классу: количество учеников, мальчиков/девочек, возрастной состав, отличники, ударники и т.д.",

    "teachers.title": "Педагоги",
    "teachers.subtitle":
      "Здесь будет список учителей. При клике — профиль учителя: стаж, предметы, курсы, нагрузка, успехи учеников.",

    "assessments.title": "СОР / СОЧ",
    "assessments.subtitle":
      "Разбор оценок по СОР и СОЧ: по всей школе, по предметам, по классам. Позже добавим фильтры и графики.",

    "orders.title": "Список приказов",
    "orders.subtitle":
      "Образцы учебных программ, приказы и документы школы, привязанные к AdiletZan.kz и внутренним приказам.",

    // ---------- Risk Students Page ----------
    "risk.title": "Ученики в группе риска",
    "risk.subtitle":
      "AI-мониторинг отмечает учеников с падающими оценками, пропусками, низкой активностью и другими тревожными сигналами.",
    "risk.classFilter": "Класс:",
    "risk.allClasses": "Все классы",

    "risk.count": "Группа риска",
    "risk.countHintAll": "По всей школе",
    "risk.countHintClass": "По выбранному классу",

    "risk.high": "Высокий риск",
    "risk.medium": "Средний риск",

    "risk.student": "Ученик",
    "risk.class": "Класс",
    "risk.avgGrade": "Средний балл",
    "risk.trend": "Динамика",
    "risk.absences": "Пропуски",
    "risk.subjects": "Сложные предметы",
    "risk.level": "Уровень риска",

    "risk.empty": "По этим фильтрам нет учеников, попавших в группу риска.",

    "risk.abs.total": "Всего",
    "risk.abs.unexcused": "Без уваж. причины",

    "risk.noSubjects": "Нет предметов в зоне риска",
    "student.back": "Назад",
    "student.notFound": "Ученик не найден.",
    "student.info": "Основная информация",
    "student.class": "Класс",
    "student.gender": "Пол",
    "student.absences": "Всего пропусков",
    "student.unexcusedAbsences": "Без уважительной причины",
    "student.homework": "Выполнение ДЗ",
    "student.teacherAlerts": "Замечания учителей",
    "student.aiTitle": "AI-рекомендации (для завуча)",
    "student.gradeChart": "Динамика успеваемости (по четвертям)",
    "student.absencesChart": "Динамика пропусков (по месяцам)",
    "student.avgGradeLabel": "Общий средний балл",

    "teacher.back": "Назад",
    "teacher.notFound": "Учитель не найден.",
    "teacher.info": "Основная информация",
    "teacher.subjects": "Предметы",
    "teacher.classes": "Классы",
    "teacher.avgGrade": "Средний балл по классам",
    "teacher.riskStudents": "Ученики в группе риска",
    "teacher.loadPerWeek": "Нагрузка за неделю",
    "teacher.lessons": "уроков",
    "teacher.experience": "Педагогический стаж",
    "teacher.years": "лет",
    "teacher.students": "Количество учеников",
    "teacher.weeklyLoadChart": "Недельная нагрузка (по дням)",
    "teacher.sorChart": "Средний балл СОР / СОЧ (по классам)",
    "teacher.aiHint": "AI-подсказка завучу по нагрузке учителя",
    "teachers.name": "Учитель",
    "teachers.subject": "Предмет",
    "teachers.classes": "Классы",
    "teachers.avgGrade": "Средний балл",
    "teachers.riskStudents": "В группе риска",
    "teachers.riskCount": "учеников",

    // RU
    "teacher.performance": "Успеваемость по четвертям",
    "teacher.performanceHint":
      "Средний балл по шкале 1–5, агрегированный по всем классам, где ведёт этот учитель.",
    "teacher.performanceLegend":
      "5.0 — максимум. В будущем данные будут автоматически подтягиваться из БЖБ/СОР, ТЖБ/СОЧ и журнала.",

    "teacher.classesHint":
      "Классы, в которых работает учитель, его предмет и примерная недельная нагрузка.",
    "teacher.col.class": "Класс",
    "teacher.col.subject": "Предмет",
    "teacher.col.hours": "Часов/нед",
    "teacher.classesPlaceholder":
      "Для этого учителя ещё не введена привязка к классам. В будущем она будет подтягиваться из расписания и тарификации.",
    "teachers.col.name": "Учитель",
    "teachers.col.subject": "Предмет / специальность",
    "teachers.col.langs": "Язык обучения",
    "teachers.col.experience": "Стаж / категория",
    "teachers.col.more": "Профиль",
  },

  kk: {
    // --- Общие ---
    "app.brand": "Ақылды Завуч Панелі",
    "app.schoolLabel": "Мектеп",

    // --- Topbar ---
    "topbar.title": "Завуч панелі",
    "topbar.subtitle": "2024–2025 оқу жылы · Нақты уақыттағы аналитика",
    "topbar.role": "Оқу ісі жөніндегі меңгеруші",

    // --- Sidebar ---
    "nav.dashboard": "Дашборд",
    "nav.orders": "Бұйрықтар",
    "nav.classes": "Сынып аналитикасы",
    "nav.teachers": "Педагогтар",
    "nav.assessments": "БЖБ / ТЖБ",
    "nav.risk": "Қауіп тобы (AI)",
    "nav.footer": "© {year} School Analytics",

    // --- Dashboard ---
    "dashboard.overview.title": "Мектептің жалпы көрінісі",
    "dashboard.overview.subtitle":
      "Мұнда завуч мектеп құрамы, үлгерім, тәуекелдер және мұғалім жүктемесі бойынша негізгі метрикаларды көреді.",
    "dashboard.stat.students.label": "Оқушылар",
    "dashboard.stat.students.subtitle": "26 сынып · 312 ұл · 312 қыз",
    "dashboard.stat.students.trendLabel": "өткен жылмен салыстырғанда",
    "dashboard.stat.students.trendValue": "+3.1%",
    "dashboard.stat.excellents.label": "Үздіктер",
    "dashboard.stat.excellents.subtitle": "Мектеп нормативінен жоғары",
    "dashboard.stat.excellents.trendLabel": "динамика",
    "dashboard.stat.excellents.trendValue": "+1.4%",
    "dashboard.stat.teachers.label": "Мұғалімдер",
    "dashboard.stat.teachers.subtitle":
      "Профильдер мен біліктілікті арттыру курстары",
    "dashboard.stat.teachers.trendLabel": "жаңалары",
    "dashboard.stat.teachers.trendValue": "+3",
    "dashboard.stat.risk.label": "Қауіп тобындағы оқушылар",
    "dashboard.stat.risk.subtitle": "AI мониторингі бойынша",
    "dashboard.stat.risk.trendLabel": "айына",
    "dashboard.stat.risk.trendValue": "+2",

    "dashboard.assessments.title": "БЖБ / ТЖБ аналитикасы",
    "dashboard.assessments.subtitle":
      "Қай пәндер бойынша төмен бағалар көп, қай параллельдерде «құлау» қаупі бар – қысқаша шолу.",
    "dashboard.assessments.placeholder":
      "Кейін мұнда пәндер бойынша диаграммалар және тоқсан/сынып бойынша фильтрлер жасаймыз.",

    "dashboard.quickActions.title": "Жылдам әрекеттер",
    "dashboard.quickActions.orders": "Бұйрықтар тізімін ашу",
    "dashboard.quickActions.classes": "Сынып аналитикасын көру",
    "dashboard.quickActions.risk": "«Қауіп тобындағы» оқушылар тізімі",

    "classes.title": "Сынып аналитикасы",
    "classes.subtitle":
      "Кейін әр сынып бойынша карточка/кесте: оқушылар саны, ұл/қыз, жас құрамы, үздіктер, жақсы оқушылар және т.б. көрсетіледі.",

    "teachers.title": "Педагогтар",
    "teachers.subtitle":
      "Мұнда мұғалімдер тізімі болады. Басқанда – мұғалім профилі: тәжірибесі, пәндері, курстары, жүктемесі, жетістіктері.",

    "assessments.title": "БЖБ / ТЖБ",
    "assessments.subtitle":
      "БЖБ және ТЖБ бағаларын талдау: бүкіл мектеп бойынша, пәндер бойынша, сыныптар бойынша. Кейін фильтрлер мен графиктер қосамыз.",

    "risk.title": "«Қауіп тобындағы» оқушылар",
    "risk.subtitle":
      "Мұнда AI мониторингі: төмендеп жатқан бағалар, көп босатулар, төмен белсенділік, мұғалім комментарийлері және назар аударатын оқушылар тізімі.",
    // ---------- Orders (Бұйрықтар) ----------
    "orders.title": "Бұйрықтар тізімі",
    "orders.subtitle":
      "Оқу бағдарламаларының үлгілері, мектеп бұйрықтары және AdiletZan.kz-пен байланысты құжаттар.",

    // ---------- Risk Students Page ----------
    "risk.classFilter": "Сынып:",
    "risk.allClasses": "Барлық сыныптар",

    "risk.count": "Тәуекел тобы",
    "risk.countHintAll": "Барлық сыныптар бойынша",
    "risk.countHintClass": "Таңдалған сынып бойынша",

    "risk.high": "Жоғары тәуекел",
    "risk.medium": "Орташа тәуекел",

    "risk.student": "Оқушы",
    "risk.class": "Сынып",
    "risk.avgGrade": "Орташа баға",
    "risk.trend": "Баға динамикасы",
    "risk.absences": "Қатыспау",
    "risk.subjects": "Қиын пәндер",
    "risk.level": "Тәуекел деңгейі",

    "risk.empty": "Бұл сүзгі бойынша тәуекел тобында оқушылар жоқ.",

    "risk.abs.total": "Барлығы",
    "risk.abs.unexcused": "Себепсіз",

    "risk.noSubjects": "Қиын пәндер жоқ",
    "student.back": "Артқа қайту",
    "student.notFound": "Оқушы табылмады.",
    "student.info": "Негізгі ақпарат",
    "student.class": "Сынып",
    "student.gender": "Жынысы",
    "student.absences": "Жалпы келмеген күн",
    "student.unexcusedAbsences": "Себепсіз келмеген",
    "student.homework": "Үй тапсырмаларын орындау",
    "student.teacherAlerts": "Мұғалім ескертулері",
    "student.aiTitle": "AI ұсыныстар (завуч үшін)",
    "student.gradeChart": "Үлгерім динамикасы (тоқсан бойынша)",
    "student.absencesChart": "Қатыспау динамикасы (айлар бойынша)",
    "student.avgGradeLabel": "Жалпы орташа баға",

    "teacher.back": "Артқа қайту",
    "teacher.notFound": "Мұғалім табылмады.",
    "teacher.info": "Негізгі ақпарат",
    "teacher.subjects": "Пәндері",
    "teacher.classes": "Сыныптар",
    "teacher.avgGrade": "Орта балл (сыныптар бойынша)",
    "teacher.riskStudents": "Қауіп тобындағы оқушылар",
    "teacher.loadPerWeek": "Апталық жүктеме",
    "teacher.lessons": "сабақ",
    "teacher.experience": "Педагогикалық өтілі",
    "teacher.years": "жыл",
    "teacher.students": "Оқушылар саны",
    "teacher.weeklyLoadChart": "Апталық жүктеме (күндер бойынша)",
    "teacher.sorChart": "БЖБ / ТЖБ орта балл (сыныптар бойынша)",
    "teacher.aiHint": "Завуч үшін AI-подсказка: мұғалім жүктемесі",
    "teachers.name": "Мұғалім",
    "teachers.subject": "Пәні",
    "teachers.classes": "Сыныптар",
    "teachers.avgGrade": "Орта балл",
    "teachers.riskStudents": "Қауіп тобындағы",
    "teachers.riskCount": "оқушы",
    // --- Teachers table columns (KK) ---
    "teachers.col.name": "Мұғалім",
    "teachers.col.subject": "Пәні / мамандығы",
    "teachers.col.langs": "Оқыту тілі",
    "teachers.col.experience": "Өтілі / санаты",
    "teachers.col.more": "Профиль",

    // KK
    "teacher.performance": "Тоқсандар бойынша үлгерім",
    "teacher.performanceHint":
      "1–5 шкаласы бойынша орташа баға. Бұл мұғалім өткізетін барлық сыныптардың жиынтық көрсеткіші.",
    "teacher.performanceLegend":
      "5.0 – ең жоғары баға. Кейін деректер БЖБ, ТЖБ және электрондық журналдан автоматты түрде алынады.",

    "teacher.classesHint":
      "Мұғалім жұмыс істейтін сыныптар, пәндер және апталық сағат саны.",
    "teacher.col.class": "Сынып",
    "teacher.col.subject": "Пән",
    "teacher.col.hours": "Сағат/апта",
    "teacher.classesPlaceholder":
      "Бұл мұғалім үшін сынып–пән байланысы әлі енгізілмеген. Кейін жүктеме мен оқу жоспарынан автоматты түрде толтырылады.",
  },
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("ru");

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: string, fallback?: string): string => {
      const dict = translations[language];
      return dict[key] ?? fallback ?? key;
    };

    return { language, setLanguage, t };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
};
