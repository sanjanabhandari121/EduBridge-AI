import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { Users, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";

interface TeacherDashboardData {
  overview: { totalStudents: number; doingWell: number; improving: number; needsAttention: number };
  topicBreakdown: { topic: string; averageMastery: number }[];
  engagement: { day: string; quizzesTaken: number }[];
}

export function TeacherDashboard() {
  const [data, setData] = useState<TeacherDashboardData | null>(null);

  useEffect(() => {
    api.get<TeacherDashboardData>("/teacher/dashboard").then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="text-slate text-sm">Loading overview…</div>;

  return (
    <div className="space-y-8">
      <div>
        <p className="chapter-label mb-1">Overview</p>
        <h1 className="text-2xl font-display font-semibold text-ink">Which students need help, and why?</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users size={18} />} label="Total Students" value={data.overview.totalStudents} />
        <StatCard icon={<CheckCircle2 size={18} />} label="Doing Well" value={data.overview.doingWell} accent="teal" />
        <StatCard icon={<TrendingUp size={18} />} label="Improving" value={data.overview.improving} accent="marigold" />
        <StatCard icon={<AlertTriangle size={18} />} label="Needs Attention" value={data.overview.needsAttention} accent="coral" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="text-sm font-medium text-ink mb-4">Performance by Topic</h2>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data.topicBreakdown} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE7D9" vertical={false} />
                <XAxis dataKey="topic" tick={{ fontSize: 10, fill: "#5B6472" }} angle={-25} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11, fill: "#5B6472" }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#EDE7D9", fontSize: 12 }} />
                <Bar dataKey="averageMastery" fill="#157A6E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-medium text-ink mb-4">Weekly Engagement</h2>
          <div style={{ width: "100%", height: 240 }}>
            {data.engagement.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate">No quiz activity in the last 7 days.</div>
            ) : (
              <ResponsiveContainer>
                <LineChart data={data.engagement} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE7D9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#5B6472" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#5B6472" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#EDE7D9", fontSize: 12 }} />
                  <Line type="monotone" dataKey="quizzesTaken" stroke="#E8A33D" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: "teal" | "marigold" | "coral";
}) {
  const color = accent === "teal" ? "text-teal-dark" : accent === "marigold" ? "text-[#C78220]" : accent === "coral" ? "text-coral" : "text-ink";
  return (
    <div className="card p-4">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <p className={`font-mono text-xl font-semibold ${color}`}>{value}</p>
      <p className="text-xs text-slate mt-0.5">{label}</p>
    </div>
  );
}
