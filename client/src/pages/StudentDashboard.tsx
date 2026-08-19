import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  BookCheck,
  Target,
  ArrowRight,
} from "lucide-react";
import { api } from "../services/api";
import { StudentDashboard as Dashboard } from "../types";
import { MasteryRing } from "../components/MasteryRing";

function timeOfDayGreeting() {
  const h = new Date().getHours();

  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";

  return "Good evening";
}

export function StudentDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Dashboard>("/student/dashboard")
      .then(setData)
      .catch(() =>
        setError("Couldn't load your dashboard right now.")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-slate text-sm">
        Loading your dashboard…
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-coral text-sm">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-ink leading-tight">
          {timeOfDayGreeting()}, {data.name.split(" ")[0]}
        </h1>

        <p className="text-slate mt-1">
          Let's continue where you left off.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<Target size={18} />}
          label="Learning Score"
          value={`${data.overallScore}%`}
        />

        <StatCard
          icon={<Flame size={18} />}
          label="Current Streak"
          value={`${data.streakDays} day${
            data.streakDays === 1 ? "" : "s"
          }`}
        />

        <StatCard
          icon={<BookCheck size={18} />}
          label="Questions Solved"
          value={String(data.questionsSolved)}
        />

        <StatCard
          icon={<Target size={18} />}
          label="Topics Mastered"
          value={String(data.topicsMastered)}
        />
      </div>

      <section>
        <div className="ledger-heading mb-4">
          <p className="chapter-label">Ch. 01</p>

          <h2 className="text-lg font-display font-semibold text-ink">
            Continue Learning
          </h2>
        </div>

        {data.continueLearning.length === 0 ? (
          <EmptyState text="No topics started yet — ask the AI Tutor a question to begin." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.continueLearning.map((c) => (
              <div
                key={c.topic}
                className="card p-4 flex flex-col items-center text-center gap-3 min-w-0"
              >
                <MasteryRing
                  score={c.mastery}
                  size={72}
                />

                <div className="min-w-0 w-full">
                  <p className="font-medium text-sm text-ink truncate">
                    {c.topic}
                  </p>

                  <p className="text-xs text-slate truncate">
                    {c.subject}
                  </p>
                </div>

                <Link
                  to="/student/practice"
                  className="text-xs font-medium text-teal-dark hover:underline flex items-center gap-1"
                >
                  Continue
                  <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="ledger-heading mb-4">
          <p className="chapter-label">Ch. 02</p>

          <h2 className="text-lg font-display font-semibold text-ink">
            Your Weak Areas
          </h2>
        </div>

        {data.weakAreas.length === 0 ? (
          <EmptyState text="No weak areas detected yet — keep practicing to build your profile." />
        ) : (
          <div className="card divide-y divide-black/5">
            {data.weakAreas.map((w) => (
              <div
                key={w.topicId}
                className="px-4 md:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {w.topic}
                  </p>

                  <p className="text-xs text-slate truncate">
                    {w.subject}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="font-mono text-sm text-coral font-semibold">
                    {Math.round(w.score)}%
                  </span>

                  <Link
                    to="/student/practice"
                    state={{
                      topicId: w.topicId,
                      topicName: w.topic,
                    }}
                    className="text-xs font-medium bg-coral-light text-coral rounded-full px-3 py-1.5 hover:bg-coral/20 transition whitespace-nowrap"
                  >
                    Practice this
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="ledger-heading mb-4">
          <p className="chapter-label">Ch. 03</p>

          <h2 className="text-lg font-display font-semibold text-ink">
            Recommended For You
          </h2>
        </div>

        <div className="card p-4 md:p-5 bg-teal-light/60 border-teal/20">
          <p className="text-sm text-ink leading-relaxed">
            {data.weakAreas[0]
              ? `Your recent attempts suggest you need more practice with ${data.weakAreas[0].topic}. A short focused session now will help before it compounds.`
              : "Ask the AI Tutor a question about anything you're stuck on — it'll ground its answer in your textbook material."}
          </p>

          <Link
            to="/student/tutor"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-dark mt-3 hover:underline"
          >
            Ask AI Tutor
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-3 md:p-4 min-w-0">
      <div className="text-teal-dark mb-2">
        {icon}
      </div>

      <p className="font-mono text-lg md:text-xl font-semibold text-ink truncate">
        {value}
      </p>

      <p className="text-[11px] md:text-xs text-slate mt-0.5 leading-tight">
        {label}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="card p-5 md:p-6 text-sm text-slate text-center">
      {text}
    </div>
  );
}