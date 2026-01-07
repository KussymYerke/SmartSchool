// src/App.tsx
import React, { useEffect, useState } from "react";
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
import { ClassTeacherDashboardPage } from "./pages/ClassTeacherDashboardPage";

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

const AppInner: React.FC = () => {
  const { role, className } = useAuth();

  const [currentPage, setCurrentPage] = useState<PageKey>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [prevPage, setPrevPage] = useState<PageKey | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);
  const [riskInitialMode, setRiskInitialMode] = useState<"class" | "subject">("class");

  useEffect(() => {
    // When role changes, bring user back to dashboard (avoids "stuck" pages)
    setCurrentPage("dashboard");
    setPrevPage(null);
    setSelectedStudentId(null);
    setSelectedTeacherId(null);
    setSelectedClassName(null);
    setRiskInitialMode("class");
  }, [role]);

  const openRisk = (mode: "class" | "subject" = "class") => {
    setRiskInitialMode(mode);
    setCurrentPage("risk");
  };

  const handleBackFromStudent = () => setCurrentPage(prevPage ?? "risk");
  const handleBackFromTeacher = () => setCurrentPage(prevPage ?? "teachers");
  const handleBackFromClass = () => setCurrentPage(prevPage ?? "classes");

  const handleOpenStudentProfile = (id: string) => {
    setPrevPage(currentPage);
    setSelectedStudentId(id);
    setCurrentPage("studentProfile");
  };

  const handleOpenTeacherProfile = (id: number) => {
    setPrevPage(currentPage);
    setSelectedTeacherId(id);
    setCurrentPage("teacherProfile");
  };

  const handleOpenClassProfile = (cls: string) => {
    setPrevPage(currentPage);
    setSelectedClassName(cls);
    setCurrentPage("classProfile");
  };

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
        return (
          <RiskStudentsPage
            onSelectStudent={handleOpenStudentProfile}
            forcedClassName={role === "class_teacher" ? className : null}
            initialMode={riskInitialMode}
          />
        );
      case "studentProfile":
        return (
          selectedStudentId && (
            <StudentProfilePage
              studentId={String(selectedStudentId)}
              onBack={handleBackFromStudent}
              userRole={role as any}
            />
          )
        );
      case "teacherProfile":
        return (
          selectedTeacherId && (
            <TeacherProfilePage teacherId={selectedTeacherId} onBack={handleBackFromTeacher} />
          )
        );
      case "classProfile":
        return (
          selectedClassName && (
            <ClassProfilePage
              className={selectedClassName}
              onBack={handleBackFromClass}
              onOpenStudent={handleOpenStudentProfile}
            />
          )
        );
      case "dashboard":
      default:
        if (role === "deputy") {
          return (
            <DeputyDashboardPage
              onOpenStudent={handleOpenStudentProfile}
              onOpenRisk={() => openRisk("class")}
            />
          );
        }

        if (role === "teacher") {
          return <TeacherDashboardPage onOpenStudent={handleOpenStudentProfile} />;
        }

        if (role === "class_teacher") {
          return (
            <ClassTeacherDashboardPage
              onOpenStudent={handleOpenStudentProfile}
              onOpenRisk={(mode) => openRisk(mode)}
            />
          );
        }

        if (role === "psychologist") {
          return <PsychologistDashboardPage />;
        }

        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  if (!role) {
    return <RoleSelectPage />;
  }

  return (
    <div className="min-h-screen flex text-slate-50">
      <Sidebar
        currentPage={currentPage}
        onChangePage={(p) => {
          setCurrentPage(p);
          setMobileNavOpen(false);
        }}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <div className="flex-1 flex flex-col">
        <Topbar
          onToggleSidebar={() => setMobileNavOpen((v) => !v)}
          onOpenStudent={handleOpenStudentProfile}
          onResetNavigation={() => {
            setCurrentPage("dashboard");
            setMobileNavOpen(false);
          }}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
};

export default App;
