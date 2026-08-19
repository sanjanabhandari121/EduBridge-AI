import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2, XCircle, Sparkles, RefreshCcw } from "lucide-react";
import { api, ApiError } from "../services/api";
import { PracticeQuestion, Subject } from "../types";
import { MasteryRing } from "../components/MasteryRing";

interface SubmitResult {
  score: number;
  total: number;
  accuracy: number;
  results: { questionId: string; prompt: string; isCorrect: boolean; correctAnswer: string; explanation: string; newMasteryScore: number }[];
  newMasteryScore: number | null;
  recommendation: string;
}

export function Practice() {
  const location = useLocation() as { state?: { topicId?: string; topicName?: string } };
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topicId, setTopicId] = useState(location.state?.topicId || "");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<PracticeQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState<number>(0);

  useEffect(() => {
    api.get<{ subjects: Subject[] }>("/subjects").then((d) => setSubjects(d.subjects)).catch(() => {});
  }, []);

  const allTopics = subjects.flatMap((s) => s.topics.map((t) => ({ ...t, subjectName: s.name })));
  const activeTopicName = allTopics.find((t) => t.id === topicId)?.name || location.state?.topicName;

  async function startPractice() {
    if (!topicId) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post<{ questions: PracticeQuestion[] }>("/practice/generate", { topicId, count });
      setQuestions(res.questions);
      setAnswers({});
      setStartedAt(Date.now());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't generate a practice set for that topic yet.");
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!questions) return;
    setLoading(true);
    setError("");
    try {
      const durationSec = Math.round((Date.now() - startedAt) / 1000);
      const res = await api.post<SubmitResult>("/practice/submit", {
        topicId,
        durationSec,
        answers: questions.map((q) => ({ questionId: q.id, studentAnswer: answers[q.id] || "" })),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't submit your answers.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setQuestions(null);
    setResult(null);
    setAnswers({});
  }

  if (result) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <p className="chapter-label mb-1">Quiz Results</p>
          <h1 className="text-2xl font-display font-semibold text-ink">{activeTopicName}</h1>
        </div>

        <div className="card p-6 flex items-center gap-6">
          <MasteryRing score={result.newMasteryScore ?? (result.accuracy * 100)} size={96} label="Mastery" />
          <div>
            <p className="font-mono text-3xl font-semibold text-ink">{result.score}/{result.total}</p>
            <p className="text-sm text-slate mt-1">{Math.round(result.accuracy * 100)}% accuracy</p>
          </div>
        </div>

        <div className="card divide-y divide-black/5">
          {result.results.map((r) => (
            <div key={r.questionId} className="px-5 py-4">
              <div className="flex items-start gap-2.5">
                {r.isCorrect ? (
                  <CheckCircle2 className="text-teal-dark shrink-0 mt-0.5" size={18} />
                ) : (
                  <XCircle className="text-coral shrink-0 mt-0.5" size={18} />
                )}
                <div>
                  <p className="text-sm text-ink font-medium">{r.prompt}</p>
                  {!r.isCorrect && (
                    <p className="text-xs text-slate mt-1">Correct answer: <span className="font-mono">{r.correctAnswer}</span></p>
                  )}
                  <p className="text-xs text-slate mt-1">{r.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card p-5 bg-teal-light/60 border-teal/20">
          <div className="flex items-center gap-2 text-teal-dark font-medium text-sm mb-1.5">
            <Sparkles size={16} /> AI Recommendation
          </div>
          <p className="text-sm text-ink">{result.recommendation}</p>
        </div>

        <button
          onClick={reset}
          className="flex items-center gap-2 bg-ink text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-teal-dark transition"
        >
          <RefreshCcw size={16} /> Start Recommended Practice
        </button>
      </div>
    );
  }

  if (questions) {
    const allAnswered = questions.every((q) => answers[q.id]?.trim());
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <p className="chapter-label mb-1">Practice</p>
          <h1 className="text-2xl font-display font-semibold text-ink">{activeTopicName}</h1>
        </div>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="card p-5">
              <p className="text-sm text-ink font-medium mb-3">
                <span className="font-mono text-teal-dark mr-2">Q{i + 1}.</span>
                {q.prompt}
              </p>
              {q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label key={opt} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm cursor-pointer transition ${
                      answers[q.id] === opt ? "border-teal bg-teal-light/60" : "border-black/10 hover:bg-paper-dim/50"
                    }`}>
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className="accent-teal-600"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  placeholder="Your answer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-paper-dim/40 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition"
                />
              )}
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-coral bg-coral-light rounded-lg px-3 py-2">{error}</p>}
        <button
          onClick={submit}
          disabled={!allAnswered || loading}
          className="bg-ink text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-teal-dark transition disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit Answers"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <p className="chapter-label mb-1">Adaptive Practice</p>
        <h1 className="text-2xl font-display font-semibold text-ink">Start a practice session</h1>
        <p className="text-slate text-sm mt-1">Difficulty adapts as you answer — get a few right and it steps up.</p>
      </div>
      <div className="card p-5 space-y-4">
        <label className="block">
          <span className="block text-xs font-medium text-slate mb-1.5">Topic</span>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-white text-sm outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition"
          >
            <option value="">Select a topic</option>
            {allTopics.map((t) => (
              <option key={t.id} value={t.id}>{t.subjectName} — {t.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-slate mb-1.5">Number of questions</span>
          <input
            type="number"
            min={1}
            max={10}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-white text-sm outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition"
          />
        </label>
        {error && <p className="text-sm text-coral bg-coral-light rounded-lg px-3 py-2">{error}</p>}
        <button
          onClick={startPractice}
          disabled={!topicId || loading}
          className="w-full bg-ink text-white rounded-xl py-2.5 text-sm font-medium hover:bg-teal-dark transition disabled:opacity-50"
        >
          {loading ? "Generating…" : "Start Practice"}
        </button>
      </div>
    </div>
  );
}
