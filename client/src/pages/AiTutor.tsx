import { useEffect, useState } from "react";
import { Send, Loader2, BookOpen, Lightbulb, ListOrdered, AlertTriangle, Sparkles, Link as LinkIcon } from "lucide-react";
import { api, ApiError } from "../services/api";
import { Subject, TutorResponse, Language, ExplanationLevel } from "../types";

export function AiTutor() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [question, setQuestion] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [language, setLanguage] = useState<Language>("ENGLISH");
  const [level, setLevel] = useState<ExplanationLevel>("BEGINNER");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TutorResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ subjects: Subject[] }>("/subjects").then((d) => setSubjects(d.subjects)).catch(() => {});
  }, []);

  const activeSubject = subjects.find((s) => s.id === subjectId);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    setResponse(null);
    try {
      const res = await api.post<TutorResponse>("/tutor/ask", {
        question,
        subject: activeSubject?.name,
        topicId: topicId || undefined,
        language,
        level,
      });
      setResponse(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong asking the tutor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="chapter-label mb-1">AI Doubt Solver</p>
        <h1 className="text-2xl font-display font-semibold text-ink">Ask the AI Tutor</h1>
        <p className="text-slate mt-1 text-sm">
          Grounded in open textbook material. It explains at your level, cites its source, and never just gives a bare answer.
        </p>
      </div>

      <form onSubmit={handleAsk} className="card p-5 space-y-4">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder='e.g. "How do I factorise x² + 5x + 6?"'
          rows={3}
          className="w-full px-3.5 py-3 rounded-xl border border-black/10 bg-paper-dim/40 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition resize-none"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select
            label="Subject"
            value={subjectId}
            onChange={(v) => { setSubjectId(v); setTopicId(""); }}
            options={[{ value: "", label: "Any" }, ...subjects.map((s) => ({ value: s.id, label: s.name }))]}
          />
          <Select
            label="Topic"
            value={topicId}
            onChange={setTopicId}
            options={[{ value: "", label: "Any" }, ...(activeSubject?.topics || []).map((t) => ({ value: t.id, label: t.name }))]}
          />
          <Select
            label="Language"
            value={language}
            onChange={(v) => setLanguage(v as Language)}
            options={[
              { value: "ENGLISH", label: "English" },
              { value: "HINDI", label: "Hindi" },
              { value: "HINGLISH", label: "Hinglish" },
            ]}
          />
          <Select
            label="Level"
            value={level}
            onChange={(v) => setLevel(v as ExplanationLevel)}
            options={[
              { value: "BEGINNER", label: "Beginner" },
              { value: "INTERMEDIATE", label: "Intermediate" },
              { value: "ADVANCED", label: "Advanced" },
            ]}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-ink text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-teal-dark transition disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      {error && <p className="text-sm text-coral bg-coral-light rounded-lg px-3 py-2">{error}</p>}

      {response && (
        <div className="card p-6 space-y-5">
          <AnswerBlock icon={<Sparkles size={16} />} title="Short Answer" body={response.shortAnswer} accent />
          <AnswerBlock icon={<BookOpen size={16} />} title="Let's Understand" body={response.letsUnderstand} />
          {response.steps.length > 0 && (
            <div>
              <SectionTitle icon={<ListOrdered size={16} />} title="Step-by-Step" />
              <ol className="mt-2 space-y-2">
                {response.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-ink">
                    <span className="font-mono text-teal-dark shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {response.whyThisWorks && <AnswerBlock icon={<Lightbulb size={16} />} title="Why This Works" body={response.whyThisWorks} />}
          {response.commonMistake && (
            <AnswerBlock icon={<AlertTriangle size={16} />} title="Common Mistake" body={response.commonMistake} warn />
          )}
          {response.tryThis && <AnswerBlock icon={<Sparkles size={16} />} title="Try This" body={response.tryThis} />}

          <div className="pt-4 border-t border-black/5">
            <SectionTitle icon={<LinkIcon size={16} />} title="Source" />
            {response.citations.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {response.citations.map((c, i) => (
                  <li key={i} className="text-sm text-slate">
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-teal-dark hover:underline">
                        {c.source}
                      </a>
                    ) : (
                      <span>{c.source}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate italic">{response.sourceNote || "Source not found in the current knowledge base."}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-ink font-medium text-sm">
      <span className="text-teal-dark">{icon}</span>
      {title}
    </div>
  );
}

function AnswerBlock({
  icon,
  title,
  body,
  accent,
  warn,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className={accent ? "bg-teal-light/60 -mx-6 px-6 py-4 rounded-none" : ""}>
      <SectionTitle icon={icon} title={title} />
      <p className={`mt-1.5 text-sm leading-relaxed ${warn ? "text-coral" : "text-ink/90"}`}>{body}</p>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-slate mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-2 rounded-lg border border-black/10 bg-white text-xs outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
