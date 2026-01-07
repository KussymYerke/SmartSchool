// src/data/teachers.ts

export type TeacherQuarterPerformance = {
  label: string;
  avgGrade: number;
};

export type TeacherClassAssignment = {
  className: string; // '7A', '8A'
  subject: string; // 'Информатика', 'Математика'
  hoursPerWeek?: number;
};

export type Teacher = {
  id: number;
  fullName: string;
  iin: string;
  birthDate: string;
  nationality: string;
  email?: string;
  phones?: string;
  education?: string;
  specialty?: string;
  category?: string;
  attestationYear?: string;
  mainLanguages: string[];
  mainSubjects?: string[];
  totalExperience?: string;
  degree?: string;
  courses?: string;
  sorCourses?: string;

  performanceByQuarter?: TeacherQuarterPerformance[];
  classAssignments?: TeacherClassAssignment[];
};

export const TEACHERS: Teacher[] = [
  {
    id: 1,
    fullName: "Азирбай Нурила Мырзақасқызы",
    iin: "************",
    birthDate: "**.**.****",
    nationality: "қазақ",
    email: "***",
    phones: "***",
    education: "***",
    specialty: "***",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Орыс"],
    mainSubjects: ["Тарих"],
    totalExperience: "***",
    degree: "***",
    courses: "***",
    sorCourses: "***",
    performanceByQuarter: [
      { label: "1 четверть", avgGrade: 4.2 },
      { label: "2 четверть", avgGrade: 4.1 },
      //   { label: "3 четверть", avgGrade: 4.0 },
      //   { label: "4 четверть", avgGrade: 4.3 },
    ],
    classAssignments: [
      // 7 классы
      { className: "7A", subject: "История Казахстана", hoursPerWeek: 2 },
      { className: "7A", subject: "Всемирная история", hoursPerWeek: 1 },
      { className: "7B", subject: "История Казахстана", hoursPerWeek: 2 },
      { className: "7B", subject: "Всемирная история", hoursPerWeek: 1 },

      // 8 классы
      { className: "8A", subject: "История Казахстана", hoursPerWeek: 2 },
      { className: "8A", subject: "Всемирная история", hoursPerWeek: 1 },
      { className: "8B", subject: "История Казахстана", hoursPerWeek: 2 },
      { className: "8B", subject: "Всемирная история", hoursPerWeek: 1 },

      // 9 классы
      { className: "9A", subject: "История Казахстана", hoursPerWeek: 2 },
      { className: "9A", subject: "Всемирная история", hoursPerWeek: 1 },
      { className: "9B", subject: "История Казахстана", hoursPerWeek: 2 },
      { className: "9B", subject: "Всемирная история", hoursPerWeek: 1 },

      // 10 классы
      { className: "10A", subject: "История Казахстана", hoursPerWeek: 2 },
      { className: "10A", subject: "Всемирная история", hoursPerWeek: 1 },
      { className: "10B", subject: "История Казахстана", hoursPerWeek: 2 },
      { className: "10B", subject: "Всемирная история", hoursPerWeek: 1 },

      // 11 классы
      { className: "11A", subject: "История Казахстана", hoursPerWeek: 2 },
      { className: "11A", subject: "Всемирная история", hoursPerWeek: 1 },
      { className: "11B", subject: "История Казахстана", hoursPerWeek: 2 },
      { className: "11B", subject: "Всемирная история", hoursPerWeek: 1 },
    ],
  },
  {
    id: 2,
    fullName: "Бақытжанқызы Нұрайым",
    iin: "************",
    birthDate: "**.**.****",
    nationality: "қазақ",
    email: "***",
    phones: "***",
    education: "***",
    specialty: "***",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Орыс"],
    mainSubjects: ["География"],
    totalExperience: "***",
    degree: "***",
    courses: "***",
    sorCourses: "***",
  },
  {
    id: 3,
    fullName: "Жұмабай Бекзат Берікұлы",
    iin: "************",
    birthDate: "**.**.****",
    nationality: "қазақ",
    email: "***",
    phones: "***",
    education: "***",
    specialty: "***",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Орыс", "Ағылшын"],
    mainSubjects: ["Физика"],
    totalExperience: "***",
    degree: "***",
    courses: "***",
    sorCourses: "***",
  },
  {
    id: 4,
    fullName: "Имамусенова Асал Абилкосим кизи",
    iin: "************",
    birthDate: "**.**.****",
    nationality: "қазақ",
    email: "***",
    phones: "***",
    education: "***",
    specialty: "***",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Ағылшын"],
    mainSubjects: ["Химия"],
    totalExperience: "***",
    degree: "***",
    courses: "***",
    sorCourses: "***",
  },
  {
    id: 5,
    fullName: "Исатаев Даниял Темиржанович",
    iin: "************",
    birthDate: "**.**.****",
    nationality: "қазақ",
    email: "***",
    phones: "***",
    education: "***",
    specialty: "***",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Орыс"],
    mainSubjects: ["Ағылшын тілі"],
    totalExperience: "***",
    degree: "***",
    courses: "***",
    sorCourses: "***",
  },
  {
    id: 6,
    fullName: "Исмаилов Байжан Орунбасарович",
    iin: "************",
    birthDate: "**.**.****",
    nationality: "қазақ",
    email: "***",
    phones: "***",
    education: "***",
    specialty: "***",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Ағылшын тілі"],
    mainSubjects: ["Ағылшын тілі"],
    totalExperience: "***",
    degree: "***",
    courses: "***",
    sorCourses: "***",
  },
  {
    id: 7,
    fullName: "Құсым Еркебұлан Асылбекұлы",
    iin: "************",
    birthDate: "**.**.****",
    nationality: "қазақ",
    email: "***",
    phones: "***",
    education: "***",
    specialty: "***",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Орыс", "Ағылшын"],
    mainSubjects: ["Информатика", "Робототехника"],
    totalExperience: "***",
    degree: "***",
    courses: "***",
    sorCourses: "***",
    performanceByQuarter: [
      { label: "1 четверть", avgGrade: 4.5 },
      { label: "2 четверть", avgGrade: 4.4 },
      { label: "3 четверть", avgGrade: 4.6 },
      { label: "4 четверть", avgGrade: 4.7 },
    ],
    classAssignments: [
      { className: "7A", subject: "Информатика", hoursPerWeek: 2 },
      { className: "8A", subject: "Информатика", hoursPerWeek: 2 },
      { className: "9A", subject: "Информатика", hoursPerWeek: 3 },
    ],
  },
  {
    id: 8,
    fullName: "Мәсуадин Арайлым Тұрғанбайқызы",
    iin: "************",
    birthDate: "**.**.****",
    nationality: "қазақ",
    email: "***",
    phones: "***",
    education: "***",
    specialty: "***",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Орыс", "Ағылшын"],
    mainSubjects: ["Химия", "Биология"],
    totalExperience: "***",
    degree: "***",
    courses: "***",
    sorCourses: "***",
  },
  {
    id: 9,
    fullName: "Реджепбайқызы Назерке",
    iin: "************",
    birthDate: "**.**.****",
    nationality: "қазақ",
    email: "***",
    phones: "***",
    education: "***",
    specialty: "***",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Орыс", "Ағылшын"],
    mainSubjects: ["Математика"],
    totalExperience: "***",
    degree: "***",
    courses: "***",
    sorCourses: "***",
  },
  {
    id: 10,
    fullName: "Сулейменова Асель Оразалиевна",
    iin: "************",
    birthDate: "**.**.****",
    nationality: "қазақ",
    email: "***",
    phones: "***",
    education: "***",
    specialty: "***",
    category: "Педагог-сарапшы",
    attestationYear: "2021",
    mainLanguages: ["Қазақ", "Орыс"],
    mainSubjects: ["Қазақ тілі", "Қазақ әдебиеті"],
    totalExperience: "***",
    degree: "***",
    courses: "***",
    sorCourses: "***",
  },
  {
    id: 11,
    fullName: "Шегебай Назерке Болатбекқызы",
    iin: "************",
    birthDate: "**.**.****",
    nationality: "қазақ",
    email: "***",
    phones: "***",
    education: "***",
    specialty: "***",
    category: "Педагог-модератор",
    attestationYear: "2023",
    mainLanguages: ["Қазақ", "Орыс"],
    mainSubjects: ["Қазақ тілі", "Қазақ әдебиеті"],
    totalExperience: "***",
    degree: "***",
    courses: "***",
    sorCourses: "***",
  },
  {
    id: 12,
    fullName: "Жеткен Қарақат Арманқызы",
    iin: "************",
    birthDate: "**.**.****",
    nationality: "қазақ",
    email: "***",
    phones: "***",
    education: "***",
    specialty: "***",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Орыс"],
    mainSubjects: ["Орыс тілі", "Орыс әдебиеті"],
    totalExperience: "***",
    degree: "***",
    courses: "***",
    sorCourses: "***",
  },
];
