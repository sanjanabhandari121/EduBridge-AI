import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../hooks/useAuth";

export function AppLayout({ role }: { role: "STUDENT" | "TEACHER" }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex bg-paper">
      <Sidebar role={role} />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
          <Outlet />
        </div>
      </main>
      {!user && null}
    </div>
  );
}
