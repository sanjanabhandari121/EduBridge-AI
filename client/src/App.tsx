import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { Login } from "./pages/Login";
import { StudentDashboardPage } from "./pages/StudentDashboard";
import { AiTutor } from "./pages/AiTutor";
import { Practice } from "./pages/Practice";
import { Progress } from "./pages/Progress";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { TeacherStudents } from "./pages/TeacherStudents";
import { TeacherStudentDetail } from "./pages/TeacherStudentDetail";
import { TeacherAlerts } from "./pages/TeacherAlerts";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "STUDENT" ? "/student" : "/teacher"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute role="STUDENT" />}>
            <Route element={<AppLayout role="STUDENT" />}>
              <Route path="/student" element={<StudentDashboardPage />} />
              <Route path="/student/tutor" element={<AiTutor />} />
              <Route path="/student/practice" element={<Practice />} />
              <Route path="/student/progress" element={<Progress />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute role="TEACHER" />}>
            <Route element={<AppLayout role="TEACHER" />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/students" element={<TeacherStudents />} />
              <Route path="/teacher/students/:id" element={<TeacherStudentDetail />} />
              <Route path="/teacher/alerts" element={<TeacherAlerts />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}