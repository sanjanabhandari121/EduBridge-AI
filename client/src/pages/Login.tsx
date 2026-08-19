import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { useAuth, roleHome } from "../hooks/useAuth";
import { ApiError } from "../services/api";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(roleHome(user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't log in. Check the server is running.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role: "student" | "teacher") {
    setEmail(`${role}@edubridge.demo`);
    setPassword("Demo123!");
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <GraduationCap className="text-teal" size={30} strokeWidth={2.25} />
          <span className="font-display font-semibold text-2xl text-ink">EduBridge AI</span>
        </div>

        <div className="card p-7">
          <p className="chapter-label mb-1">Sign in</p>
          <h1 className="text-xl font-display font-semibold text-ink mb-1">Welcome back</h1>
          <p className="text-sm text-slate mb-6">Personalized learning, accessible to everyone.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate mb-1.5" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-paper-dim/40 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition"
                placeholder="you@edubridge.demo"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1.5" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-paper-dim/40 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-coral bg-coral-light rounded-lg px-3 py-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-ink text-white rounded-xl py-2.5 text-sm font-medium hover:bg-teal-dark transition disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <div className="mt-4 card p-4">
          <p className="text-xs text-slate mb-3 text-center">Try the demo — click to autofill</p>
          <div className="space-y-2">
            <button
              onClick={() => fillDemo("student")}
              className="w-full text-left px-3 py-2.5 rounded-xl bg-teal-light/60 hover:bg-teal/20 transition border border-teal/10"
            >
              <p className="text-xs font-semibold text-teal-dark">Student demo</p>
              <p className="text-[11px] text-slate mt-0.5 font-mono">student@edubridge.demo</p>
              <p className="text-[11px] text-slate font-mono">Demo123!</p>
            </button>
            <button
              onClick={() => fillDemo("teacher")}
              className="w-full text-left px-3 py-2.5 rounded-xl bg-marigold-light/60 hover:bg-marigold/20 transition border border-marigold/10"
            >
              <p className="text-xs font-semibold text-[#8A5A12]">Teacher demo</p>
              <p className="text-[11px] text-slate mt-0.5 font-mono">teacher@edubridge.demo</p>
              <p className="text-[11px] text-slate font-mono">Demo123!</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}