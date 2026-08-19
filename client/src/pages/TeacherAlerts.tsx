import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../services/api";

interface Alert {
  id: string;
  studentId: string;
  studentName: string;
  severity: "INFO" | "WATCH" | "ATTENTION";
  message: string;
  createdAt: string;
}

const SEVERITY_STYLE: Record<Alert["severity"], string> = {
  INFO: "bg-paper-dim text-slate",
  WATCH: "bg-marigold-light text-[#8A5A12]",
  ATTENTION: "bg-coral-light text-coral",
};

export function TeacherAlerts() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);

  useEffect(() => {
    api.get<{ alerts: Alert[] }>("/teacher/alerts").then((d) => setAlerts(d.alerts)).catch(() => {});
  }, []);

  if (!alerts) return <div className="text-slate text-sm">Loading alerts…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="chapter-label mb-1">Recommendations</p>
        <h1 className="text-2xl font-display font-semibold text-ink">Alerts</h1>
        <p className="text-slate text-sm mt-1">Data-driven flags for you to review — not automatic judgments.</p>
      </div>

      {alerts.length === 0 ? (
        <div className="card p-6 text-sm text-slate text-center">No active alerts right now.</div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <Link
              key={a.id}
              to={`/teacher/students/${a.studentId}`}
              className="card p-4 flex items-center justify-between hover:shadow-none transition block"
            >
              <div>
                <p className="text-sm font-medium text-ink">{a.studentName}</p>
                <p className="text-xs text-slate mt-0.5">⚠️ {a.message}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${SEVERITY_STYLE[a.severity]}`}>
                {a.severity === "ATTENTION" ? "Needs attention" : a.severity === "WATCH" ? "Monitor" : "Info"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
