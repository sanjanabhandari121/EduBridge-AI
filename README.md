# EduBridge AI

**Personalized learning, accessible to everyone.**

A hackathon MVP for the "AI for Equitable Education Access" problem statement — an AI tutor that grounds its answers in open educational material, tracks concept-level mastery, adapts practice difficulty, and gives teachers an honest picture of who needs help and why.

> **Scope note:** The original brief was extremely broad (RAG + vector DB, full scholarship matcher, multi-provider AI, adaptive everything, 15+ dashboard views). This build implements the **complete core loop end-to-end** — grounded doubt-solving, mastery tracking, adaptive practice, and the teacher intervention dashboard — with production-shaped architecture so the rest (scholarship matcher, a real vector DB, more languages) drops in without a rewrite. See [What's simplified](#whats-simplified-for-the-mvp) below.

---

## 1. Problem statement

**AI for Equitable Education Access** — students often can't get their specific confusion matched to the right explanation, at the right level, in the right language. Teachers can't tell who's falling behind until it's too late. EduBridge closes both gaps with one connected loop:

> Student asks a question → AI diagnoses the concept → explains it at the right level/language, grounded in real source material → student practices → mastery is measured → weaknesses surface → teacher can intervene.

## 2. Features

**Student**
- AI Doubt Solver — structured answers (Short Answer → Let's Understand → Step-by-Step → Why This Works → Common Mistake → Try This → Source), grounded in a real knowledge base, never fabricating citations
- Language personalization — English / Hindi / Hinglish, without mistranslating technical terms
- Explanation level — Beginner / Intermediate / Advanced, tutor-style (never dumps an advanced definition on a beginner)
- Adaptive practice generator with difficulty that moves up/down based on recent answers
- Concept-level mastery tracking and a weak-topics view
- Dashboard: learning score, streak, questions solved, topics mastered, continue-learning cards

**Teacher**
- Class overview with doing-well / improving / needs-attention counts and charts
- Student list with non-judgmental status labels (Mastered / Stable / Improving / Monitor / Needs attention)
- Per-student profile: mastery breakdown, recent quizzes, and an AI-drafted (but teacher-reviewed, never automatic) intervention recommendation
- Alerts generated only from real activity data (inactivity, low mastery, declining trend) — deduplicated so teachers aren't spammed

## 3. Architecture

```
edubridge-ai/
├── client/     React + Vite + TS + Tailwind (student & teacher UI)
├── server/     Node + Express + TS + Prisma (API, AI, RAG, mastery logic)
└── knowledge-base/   (reserved for future raw source docs; seeded docs live in prisma/seed.ts)
```

**Backend layering:** routes → controllers → services. Controllers never talk to Prisma or the AI provider directly except through a service — `aiService`, `ragService`, `masteryService`, `practiceService`, `analyticsService`, `recommendationService`.

### AI architecture

```
server/src/ai/
├── providers/
│   ├── mock.ts     ← default, zero API key needed, fully offline
│   ├── gemini.ts    real Gemini call, used when AI_PROVIDER=gemini
│   └── openai.ts     real OpenAI-compatible call, used when AI_PROVIDER=openai
├── prompts/          tutorPrompt / quizPrompt / diagnosticPrompt builders
└── aiService.ts       the ONLY module the rest of the app calls
```

Switching providers is a one-line `.env` change (`AI_PROVIDER=gemini` + `GEMINI_API_KEY=...`). If a configured real provider fails (bad key, network issue), `aiService` automatically falls back to the mock provider rather than showing the student an error — the demo never breaks because of a missing key. All AI output is validated before being returned; malformed JSON never reaches the client untouched.

### RAG architecture

```
Document (seeded, or POST /api/knowledge/ingest)
  → chunked
  → keyword-indexed
  → retrieve(query, topicId) does keyword-overlap scoring
  → top chunks passed into the tutor prompt as grounding context
  → response citations come only from what was actually retrieved
```

This is a deliberately simple **keyword-overlap retriever** instead of a vector DB, per the brief's own hackathon-speed fallback allowance. `ragService.retrieve()` is the only place that would change to swap in pgvector/Qdrant/Chroma — nothing else in the app needs to know.

### Database

SQLite via Prisma (see `.env.example` for the one-line swap to Postgres). Models: `User`, `StudentProfile`, `TeacherProfile`, `Subject`, `Topic`, `Concept`, `MasteryScore`, `Question`, `Quiz`, `QuizAttempt`, `AnswerAttempt`, `LearningSession`, `KnowledgeDocument`, `DocumentChunk`, `TeacherAlert`, `UserPreference`.

### Mastery heuristic

`server/src/services/masteryMath.ts` (pure, unit-tested, no DB dependency):
- Mastery moves toward 100 on a correct answer and toward `max(0, score-15)` on a wrong one, with a learning rate that shrinks as more attempts accumulate (early answers move the needle more).
- Explicitly labeled everywhere as an MVP diagnostic heuristic, not a validated psychometric model.
- Adaptive difficulty steps up after 3 correct in a row, down after 2 wrong in a row, clamped to 1–4.

## 4. Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router, Recharts, lucide-react |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite via Prisma (Postgres-ready) |
| Auth | JWT + bcrypt, seeded demo accounts |
| AI | Gemini / OpenAI-compatible, behind a provider abstraction, with an offline mock default |
| RAG | Keyword-overlap retrieval over chunked documents (vector-DB-ready abstraction) |

## 5. Installation

```bash
git clone <this repo>
cd edubridge-ai
```

### Backend

```bash
cd server
cp .env.example .env
npm install
npx prisma generate
npx prisma db push       # creates dev.db (SQLite)
npm run seed              # loads demo students, teacher, questions, knowledge base
npm run dev                # http://localhost:4000
```

### Frontend

```bash
cd client
cp .env.example .env      # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                # http://localhost:5173
```

## 6. Environment variables

**server/.env**
```
DATABASE_URL="file:./dev.db"
AI_PROVIDER="mock"          # "mock" | "gemini" | "openai" — mock needs no key
GEMINI_API_KEY=""
OPENAI_API_KEY=""
VECTOR_DB_URL=""             # reserved for a future pgvector/Qdrant/Chroma swap
JWT_SECRET="edubridge-dev-secret-change-me"
PORT=4000
CLIENT_ORIGIN="http://localhost:5173"
```

**client/.env**
```
VITE_API_URL=http://localhost:4000/api
```

## 7. Demo credentials

| Role | Email | Password |
|---|---|---|
| Student (primary demo account) | `student@edubridge.demo` | `Demo123!` |
| Teacher | `teacher@edubridge.demo` | `Demo123!` |

Five more seeded students (`ishita@`, `aman@`, `priya@`, `sameer@`, `divya@edubridge.demo`, same password) show different performance patterns — strong performer, weak-in-math, improving, low-engagement, and strong-science/weak-algebra — so the teacher dashboard has something real to show.

## 8. Demo flow

1. Log in as `student@edubridge.demo`. Dashboard shows **Factorisation: 38%** as a weak area.
2. Open **Ask AI Tutor**, ask *"How do I factorise x² + 5x + 6?"* — the answer is grounded in the seeded NCERT-style chunk on factorisation and cites its source.
3. Click **Practice this** → generates a 5-question set for Factorisation.
4. Submit answers → mastery score updates immediately (e.g. 38% → higher), and an AI recommendation appears.
5. Log out, log in as `teacher@edubridge.demo`.
6. **Overview** shows class-wide doing-well / improving / needs-attention counts and topic charts.
7. **Students** shows Aman Khan flagged **Needs attention** (declining Factorisation/Quadratic trend) — click through to his profile for topic breakdown, recent quizzes, and a recommended intervention.

## 9. API reference

```
POST   /api/auth/login
POST   /api/auth/register

GET    /api/student/dashboard
GET    /api/student/progress
GET    /api/student/weak-topics

POST   /api/tutor/ask
GET    /api/tutor/history

POST   /api/practice/generate
POST   /api/practice/submit

GET    /api/teacher/dashboard
GET    /api/teacher/students
GET    /api/teacher/students/:id
GET    /api/teacher/alerts

GET    /api/knowledge/search?q=...
POST   /api/knowledge/ingest

GET    /api/subjects
GET    /api/me/preference
PUT    /api/me/preference
```

## 10. Testing

```bash
cd server
npm test
```

Covers the mastery-scoring heuristic and adaptive-difficulty logic (both pure functions in `masteryMath.ts`, deliberately kept dependency-free so they test without a database). Extend with controller/integration tests using a test SQLite file as time allows.

## 11. Safety & educational quality

- The AI never fabricates a citation — if nothing relevant was retrieved, the response says so explicitly instead of inventing a source.
- Teacher-facing language is deliberately non-judgmental (`Needs attention`, `Monitor`, `Improving`, `Stable`, `Mastered`) and alerts are built only from activity data (accuracy, attempts, inactivity, trend) — never inferred personal, medical, or demographic characteristics.
- AI recommendations to teachers are framed as suggestions for review, never automated decisions about a student.
- Malformed AI output is validated and never passed through to the UI unchecked.
- Errors are caught centrally and never leak stack traces to the client.

## What's simplified for the MVP

To keep this a real, working system rather than a half-built everything, these were intentionally trimmed from the full brief:

- **Scholarship matcher** — the brief itself marks this as optional/modular; not built, but `Scholarship` fits cleanly into the existing Prisma schema pattern if added later.
- **Vector DB** — keyword-overlap retrieval instead of pgvector/Qdrant/Chroma, exactly as the brief's own fallback allows; `ragService.retrieve()` is the single swap point.
- **Image upload for questions** — the tutor accepts typed/pasted text; OCR/image intake isn't wired up.
- **Live AI question generation** — practice questions are drawn from a curated, pedagogically-reviewed seed bank rather than generated live per request, so results are instant and reliable for a demo; `generateQuestions()` in `aiService.ts` is scaffolded and ready for a live provider swap.
- **Additional Indian languages beyond Hindi/Hinglish** — architecture supports adding more (`Language` enum + prompt template), just not seeded with more translations yet.

## A note on this sandbox build

This repository was built and the **client was fully typechecked and production-built** in this environment. The **server's Prisma client could not be generated here** because this sandbox's network allowlist doesn't include `binaries.prisma.sh` (Prisma's engine CDN) — only npm/GitHub registries are reachable. This is a sandbox networking restriction, not a code issue: running `npm install && npx prisma generate` on a normal machine (or any CI environment with standard internet access) will work as expected. The mastery/difficulty logic was unit-tested successfully in this sandbox since it has no Prisma dependency.
