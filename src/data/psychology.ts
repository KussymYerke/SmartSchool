// src/data/psychology.ts

export type PsychAppointment = {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  datetime: string;
  note?: string;
};
