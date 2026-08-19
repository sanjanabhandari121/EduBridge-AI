import { NavLink } from "react-router-dom";
import { LayoutDashboard, MessageCircleQuestion, Dumbbell, LineChart, Users, Bell, LogOut, GraduationCap } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const studentLinks = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/student/tutor", label: "Ask AI Tutor", icon: MessageCircleQuestion },
  { to: "/student/practice", label: "Practice", icon: Dumbbell },
  { to: "/student/progress", label: "My Progress", icon: LineChart },
];

const teacherLinks = [
  { to: "/teacher", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/teacher/students", label: "Students", icon: Users },
  { to: "/teacher/alerts", label: "Alerts", icon: Bell },
];

export function Sidebar({ role }: { role: "STUDENT" | "TEACHER" }) {
  const { user, logout } = useAuth();
  const links = role === "STUDENT" ? studentLinks : teacherLinks;

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/10 px-2 py-2 flex justify-around">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs ${
                isActive ? "text-teal-dark bg-teal-light" : "text-slate"
              }`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate"
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>

      <aside className="hidden md:flex w-60 shrink-0 border-r border-black/5 bg-white flex-col h-screen sticky top-0">
        <div className="px-5 py-6 flex items-center gap-2">
          <GraduationCap className="text-teal" size={26} strokeWidth={2.25} />
          <div>
            <p className="font-display font-semibold text-lg leading-none text-ink">EduBridge</p>
            <p className="font-mono text-[10px] tracking-widest text-slate uppercase mt-0.5">AI</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-teal-light text-teal-dark"
                    : "text-slate hover:bg-paper-dim hover:text-ink"
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-black/5">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
            <p className="text-xs text-slate truncate">{user?.email}</p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate hover:bg-paper-dim hover:text-coral transition-colors"
          >
            <LogOut size={18} strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}