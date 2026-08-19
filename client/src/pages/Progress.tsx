import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { api } from "../services/api";

interface ProgressData {
  masteryBySubject: { subject: string; topic: string; score: number; trend: number }[];
  recentAttempts: { id: string; score: number; total: number; accuracy: number; date: string }[];
}

export function Progress() {
  const [data, setData] = useState<ProgressData | null>(null);

  useEffect(() => {
    api.get<ProgressData>("/student/progress").then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="text-slate text-sm">Loading progress…</div>;

  const chartData = data.masteryBySubject.map((m) => ({ name: m.topic, score: m.score }));

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="chapter-label mb-1">Learning History</p>
        <h1 className="text-2xl font-display font-semibold text-ink">My Progress</h1>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-medium text-ink mb-4">Mastery by Topic</h2>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE7D9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5B6472" }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#5B6472" }} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#EDE7D9", fontSize: 12 }} />
              <Bar dataKey="score" fill="#157A6E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-ink mb-3">Recent Quiz Attempts</h2>
        {data.recentAttempts.length === 0 ? (
          <div className="card p-6 text-sm text-slate text-center">No quiz attempts yet.</div>
        ) : (
          <div className="card divide-y divide-black/5">
            {data.recentAttempts.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-ink">{new Date(a.date).toLocaleDateString()}</span>
                <span className="font-mono text-sm text-ink">{a.score}/{a.total}</span>
                <span className="font-mono text-sm text-teal-dark">{Math.round(a.accuracy * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
