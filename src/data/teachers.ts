// src/data/teachers.ts

export type TeacherQuarterPerformance = {
  label: string; // '1 четверть'
  avgGrade: number; // 1–5
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
  mainSubjects: string[];
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
    iin: "040727601374",
    birthDate: "27.07.2004",
    nationality: "қазақ",
    email: "azirbaynurila@gmail.com",
    phones: "87773559065",
    education: "ҚазҰПУ, 2021–2025",
    specialty: "Тарих",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Орыс"],
    mainSubjects: ["Тарих"],
    totalExperience: "-",
    degree: "",
    courses: "",
    sorCourses: "",
    performanceByQuarter: [
      { label: "1 четверть", avgGrade: 4.2 },
      { label: "2 четверть", avgGrade: 4.1 },
      { label: "3 четверть", avgGrade: 4.0 },
      { label: "4 четверть", avgGrade: 4.3 },
    ],
    classAssignments: [
      { className: "7A", subject: "Тарих", hoursPerWeek: 2 },
      { className: "8A", subject: "Тарих", hoursPerWeek: 2 },
    ],
  },
  {
    id: 2,
    fullName: "Бақытжанқызы Нұрайым",
    iin: "031228600601",
    birthDate: "28.12.2003",
    nationality: "қазақ",
    email: "03nuraiym@mail.ru",
    phones: "",
    education: "ҚазҰПУ, 2021–2025",
    specialty: "География",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Орыс"],
    mainSubjects: ["География"],
    totalExperience: "-",
    degree: "",
    courses:
      '«НЗМ» ДББҰ ПШО, "Жас педагог мектебі: жетістікке қадам", 80 акад. сағат (Алматы, 04–15.04.2022)',
    sorCourses: "",
  },
  {
    id: 3,
    fullName: "Жұмабай Бекзат Берікұлы",
    iin: "031024501083",
    birthDate: "24.10.2003",
    nationality: "қазақ",
    email: "bekzatzhumabaev10@gmail.com",
    phones: "87079723902",
    education: "Тараз Университеті, 2021–2025",
    specialty: "Физика",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Орыс", "Ағылшын"],
    mainSubjects: ["Физика"],
    totalExperience: "-",
    degree: "",
    courses: "",
    sorCourses: "",
  },
  {
    id: 4,
    fullName: "Имамусенова Асал Абилкосим кизи",
    iin: "000819601496",
    birthDate: "19.08.2000",
    nationality: "қазақ",
    email: "assal.imamussenova@gmail.com",
    phones: "87074709279",
    education: "Әл-Фараби ат. ҚазҰУ, 2017–2021",
    specialty: "Химия",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Ағылшын"],
    mainSubjects: ["Химия"],
    totalExperience: "-",
    degree: "Магистр",
    courses: "",
    sorCourses: "",
  },
  {
    id: 5,
    fullName: "Исатаев Даниял Темиржанович",
    iin: "030822551081",
    birthDate: "22.08.2003",
    nationality: "қазақ",
    email: "daniyal.issaa@gmail.com",
    phones: "77058726641",
    education: "БҚУ, 2020–2024",
    specialty: "Екі шет тілі",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Орыс"],
    mainSubjects: ["Ағылшын тілі"],
    totalExperience: "-",
    degree: "",
    courses: "",
    sorCourses: "",
  },
  {
    id: 6,
    fullName: "Исмаилов Байжан Орунбасарович",
    iin: "020205550067",
    birthDate: "05.02.2002",
    nationality: "қазақ",
    email: "bayzhan1993@gmail.com",
    phones: "17",
    education: "SDU, 2019–2023",
    specialty: "Екі шет тілі",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Ағылшын тілі"],
    mainSubjects: ["Ағылшын тілі"],
    totalExperience: "-",
    degree: "",
    courses:
      '«НЗМ» ДББҰ ПШО, "Жас педагог мектебі: жетістікке қадам", 80 акад. сағат (Алматы, 29.09–10.10.2025)',
    sorCourses: "",
  },
  {
    id: 7,
    fullName: "Құсым Еркебұлан Асылбекұлы",
    iin: "031125501188",
    birthDate: "25.11.2003",
    nationality: "қазақ",
    email: "kusumerkebulan@gmail.com",
    phones: "87055766163",
    education: "КБТУ, 2021–2025",
    specialty: "IT",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Орыс", "Ағылшын"],
    mainSubjects: ["Информатика", "Робототехника"],
    totalExperience: "-",
    degree: "",
    courses: "",
    sorCourses: "",
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
    iin: "000712650978",
    birthDate: "12.07.2000",
    nationality: "қазақ",
    email: "arailym.masuadin@gmail.com",
    phones: "87711872953",
    education: "SDU, 2018–2022",
    specialty: "Химия және биология",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Орыс", "Ағылшын"],
    mainSubjects: ["Химия", "Биология"],
    totalExperience: "3 жыл",
    degree: "Магистр",
    courses:
      '«НЗМ» ДББҰ ПШО, "Жас педагог мектебі: жетістікке қадам", 80 акад. сағат (Алматы, 04–15.04.2022)',
    sorCourses: "",
  },
  {
    id: 9,
    fullName: "Реджепбайқызы Назерке",
    iin: "040427600741",
    birthDate: "27.04.2004",
    nationality: "қазақ",
    email: "redzhepbaikyzy@gmail.com",
    phones: "87004878499",
    education: "СДУ, 2021–2025",
    specialty: "Математика",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Орыс", "Ағылшын"],
    mainSubjects: ["Математика"],
    totalExperience: "-",
    degree: "",
    courses: "",
    sorCourses: "",
  },
  {
    id: 10,
    fullName: "Сулейменова Асель Оразалиевна",
    iin: "951016401100",
    birthDate: "16.10.1995",
    nationality: "қазақ",
    email: "asel.kta@gmail.com",
    phones: "877502764450",
    education: "І.Жансүгіров ат. ЖМУ, 2013–2017",
    specialty: "Қазақ тілі мен әдебиеті",
    category: "Педагог-сарапшы",
    attestationYear: "2021",
    mainLanguages: ["Қазақ", "Орыс"],
    mainSubjects: ["Қазақ тілі", "Қазақ әдебиеті"],
    totalExperience: "8 жыл",
    degree: "",
    courses:
      '2022, Өрлеу (Алматы): "Қазақ тілі, Қазақ әдебиеті пәні мұғалімдерінің құзыреттілігін арттыру"; 2023, Өрлеу: «Білім берудегі менеджмент»; 2024, Білім институты: «Әдістемелік портфель»',
    sorCourses: '2019, ПШО, "БЖБ, ТЖБ құрастыру" (Талдықорған)',
  },
  {
    id: 11,
    fullName: "Шегебай Назерке Болатбекқызы",
    iin: "950809400268",
    birthDate: "09.08.1995",
    nationality: "қазақ",
    email: "nazik_favourite@mail.ru",
    phones: "87768682003",
    education: "ҚазҰПУ, 2013–2017",
    specialty: "Қазақ тілі мен әдебиеті",
    category: "Педагог-модератор",
    attestationYear: "2023",
    mainLanguages: ["Қазақ", "Орыс"],
    mainSubjects: ["Қазақ тілі", "Қазақ әдебиеті"],
    totalExperience: "7 жыл",
    degree: "Магистр",
    courses:
      '«НЗМ» ДББҰ ПШО, "Педагогтердің пәндік құзіреттілігін дамыту: қазақ тілі мен әдебиетін оқытудың тиімді тәжірибесі", 80 акад. сағат (Алматы, 07.03.2025)',
    sorCourses: "",
  },
  {
    id: 12,
    fullName: "Жеткен Қарақат Арманқызы",
    iin: "050829600491",
    birthDate: "29.08.2005",
    nationality: "қазақ",
    email: "zhetkenova05@gmail.com",
    phones: "87002723056",
    education: "ҚазҰПУ, 2022–2026",
    specialty: "Орыс тілі және әдебиеті",
    category: "-",
    attestationYear: "-",
    mainLanguages: ["Қазақ", "Орыс"],
    mainSubjects: ["Орыс тілі", "Орыс әдебиеті"],
    totalExperience: "-",
    degree: "",
    courses: "",
    sorCourses: "",
  },
];
