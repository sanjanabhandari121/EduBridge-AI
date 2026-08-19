import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { TeacherStudent } from "../types";
import { StatusBadge } from "../components/StatusBadge";

export function TeacherStudents() {
  const [students, setStudents] = useState<TeacherStudent[] | null>(null);

  useEffect(() => {
    api.get<{ students: TeacherStudent[] }>("/teacher/students").then((d) => setStudents(d.students)).catch(() => {});
  }, []);

  if (!students) return <div className="text-slate text-sm">Loading students…</div>;

  const needingAttention = students.filter((s) => s.status === "NEEDS_ATTENTION");
  const rest = students.filter((s) => s.status !== "NEEDS_ATTENTION");

  return (
    <div className="space-y-8">
      <div>
        <p className="chapter-label mb-1">Students</p>
        <h1 className="text-2xl font-display font-semibold text-ink">Student Performance</h1>
      </div>

      {needingAttention.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-coral mb-3">Students Needing Attention</h2>
          <div className="space-y-3">
            {needingAttention.map((s) => (
              <StudentRow key={s.id} s={s} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-ink mb-3">All Students</h2>
        <div className="card divide-y divide-black/5">
          {rest.map((s) => (
            <StudentRow key={s.id} s={s} compact />
          ))}
        </div>
      </section>
    </div>
  );
}

function StudentRow({ s, compact }: { s: TeacherStudent; compact?: boolean }) {
  return (
    <Link
      to={`/teacher/students/${s.id}`}
      className={compact ? "flex items-center justify-between px-5 py-3.5 hover:bg-paper-dim/40 transition" : "card p-4 flex items-center justify-between hover:shadow-none border-coral/20 bg-coral-light/30"}
    >
      <div>
        <p className="text-sm font-medium text-ink">{s.name}</p>
        {s.weakestTopic && <p className="text-xs text-slate">Weakest: {s.weakestTopic}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-ink">{s.overallMastery}%</span>
        <StatusBadge status={s.status} />
      </div>
    </Link>
  );
}
