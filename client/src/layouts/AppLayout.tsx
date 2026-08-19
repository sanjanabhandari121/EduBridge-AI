import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";

export function AppLayout({ role }: { role: "STUDENT" | "TEACHER" }) {
  return (
    <div className="min-h-screen flex bg-paper">
      <Sidebar role={role} />

      <main className="flex-1 min-w-0 w-full">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-8 pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}