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

// 👇 добавили
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RoleSelectPage } from "./pages/RoleSelectPage";
import { DeputyDashboardPage } from "./pages/DeputyDashboardPage";
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage";
import { PsychologistDashboardPage } from "./pages/PsychologistDashboardPage";

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

// Внутренний App, который уже знает про роль
const AppInner: React.FC = () => {
  const { role } = useAuth(); // 👈 кто сейчас залогинен: завуч / учитель / психолог / null

  const [currentPage, setCurrentPage] = useState<PageKey>("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(
    null
  );
  const [selectedClassName, setSelectedClassName] = useState<string | null>(
    null
  );

  const handleBackFromStudent = () => setCurrentPage("risk");

  const handleOpenStudentProfile = (id: string) => {
    setSelectedStudentId(id);
    setCurrentPage("studentProfile");
  };

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
              studentId={String(selectedStudentId)}
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
        return role === "deputy" ? (
          <DeputyDashboardPage />
        ) : role === "teacher" ? (
          <TeacherDashboardPage />
        ) : role === "psychologist" ? (
          <PsychologistDashboardPage />
        ) : (
          <DashboardPage onNavigate={setCurrentPage} />
        );
    }
  };

  // 👇 Если роль ещё не выбрана — показываем экран выбора роли вместо всей админки
  if (!role) {
    return <RoleSelectPage />;
  }

  // 👇 Когда роль выбрана — твоя обычная админка
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

// Внешний App, который оборачивает всё в AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
};

export default App;
