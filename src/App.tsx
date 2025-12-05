// src/App.tsx
import React, { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { DashboardPage } from "./pages/DashboardPage";
import { OrdersPage } from "./pages/OrdersPage";
import { ClassesAnalyticsPage } from "./pages/ClassesAnalyticsPage";
import { TeachersPage } from "./pages/TeachersPage";
import { AssessmentsPage } from "./pages/AssessmentsPage";
import { RiskStudentsPage } from "./pages/RiskStudentsPage";
import { StudentProfilePage } from "./pages/StudentProfilePage";
import { TeacherProfilePage } from "./pages/TeacherProfilePage";
import { ClassProfilePage } from "./pages/ClassProfilePage";

export type PageKey =
  | "dashboard"
  | "orders"
  | "classes"
  | "teachers"
  | "assessments"
  | "risk"
  | "studentProfile"
  | "teacherProfile"
  | "classProfile";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageKey>("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(
    null
  );
  const [selectedClassName, setSelectedClassName] = useState<string | null>(
    null
  );

  // студент
  const handleOpenStudentProfile = (id: number) => {
    setSelectedStudentId(id);
    setCurrentPage("studentProfile");
  };
  const handleBackFromStudent = () => setCurrentPage("risk");

  // учитель
  const handleOpenTeacherProfile = (id: number) => {
    setSelectedTeacherId(id);
    setCurrentPage("teacherProfile");
  };
  const handleBackFromTeacher = () => setCurrentPage("teachers");

  // класс
  const handleOpenClassProfile = (className: string) => {
    setSelectedClassName(className);
    setCurrentPage("classProfile");
  };
  const handleBackFromClass = () => setCurrentPage("classes");

  const renderPage = () => {
    switch (currentPage) {
      case "orders":
        return <OrdersPage />;
      case "classes":
        return <ClassesAnalyticsPage onSelectClass={handleOpenClassProfile} />;
      case "teachers":
        return <TeachersPage onSelectTeacher={handleOpenTeacherProfile} />;
      case "assessments":
        return <AssessmentsPage />;
      case "risk":
        return <RiskStudentsPage onSelectStudent={handleOpenStudentProfile} />;
      case "studentProfile":
        return (
          selectedStudentId && (
            <StudentProfilePage
              studentId={selectedStudentId}
              onBack={handleBackFromStudent}
            />
          )
        );
      case "teacherProfile":
        return (
          selectedTeacherId && (
            <TeacherProfilePage
              teacherId={selectedTeacherId}
              onBack={handleBackFromTeacher}
            />
          )
        );
      case "classProfile":
        return (
          selectedClassName && (
            <ClassProfilePage
              className={selectedClassName}
              onBack={handleBackFromClass}
            />
          )
        );
      case "dashboard":
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-50">
      <Sidebar currentPage={currentPage} onChangePage={setCurrentPage} />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="max-w-7xl mx-auto">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
};

export default App;
