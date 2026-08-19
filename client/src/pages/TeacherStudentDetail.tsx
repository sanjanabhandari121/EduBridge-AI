import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { api } from "../services/api";
import { MasteryRing } from "../components/MasteryRing";

interface StudentDetail {
  id: string;
  name: string;
  email: string;
  overallMastery: number;
  subjectPerformance: { subject: string; topic: string; score: number; trend: number; attempts: number }[];
  recentQuizzes: { id: string; score: number; total: number; accuracy: number; date: string }[];
  alerts: { id: string; severity: string; message: string }[];
  recommendedIntervention: string;
}

export function TeacherStudentDetail() {
  const { id } = useParams();
  const [data, setData] = useState<StudentDetail | null>(null);

  useEffect(() => {
    if (id) api.get<StudentDetail>(`/teacher/students/${id}`).then(setData).catch(() => {});
  }, [id]);

  if (!data) return <div className="text-slate text-sm">Loading student profile…</div>;

  return (
    <div className="space-y-8 max-w-3xl">
      <Link to="/teacher/students" className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-ink transition">
        <ArrowLeft size={14} /> Back to students
      </Link>

      <div className="flex items-center gap-5">
        <MasteryRing score={data.overallMastery} size={90} label="Overall" />
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink">{data.name}</h1>
          <p className="text-slate text-sm">{data.email}</p>
        </div>
      </div>

      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-marigold-light text-[#8A5A12]">
              ⚠️ {a.message}
            </div>
          ))}
        </div>
      )}

      <section>
        <h2 className="text-sm font-medium text-ink mb-3">Topic Performance</h2>
        <div className="card divide-y divide-black/5">
          {data.subjectPerformance.map((t) => (
            <div key={t.topic} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-ink">{t.topic}</p>
                <p className="text-xs text-slate">{t.subject} · {t.attempts} attempts</p>
              </div>
              <span className="font-mono text-sm text-ink">{Math.round(t.score)}%</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-ink mb-3">Recent Quizzes</h2>
        <div className="card divide-y divide-black/5">
          {data.recentQuizzes.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate">No quizzes yet.</p>
          ) : (
            data.recentQuizzes.map((q) => (
              <div key={q.id} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-ink">{new Date(q.date).toLocaleDateString()}</span>
                <span className="font-mono text-sm text-ink">{q.score}/{q.total}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="card p-5 bg-teal-light/60 border-teal/20">
        <div className="flex items-center gap-2 text-teal-dark font-medium text-sm mb-1.5">
          <Sparkles size={16} /> Recommended Intervention
        </div>
        <p className="text-sm text-ink">{data.recommendedIntervention}</p>
      </div>
    </div>
  );
}
