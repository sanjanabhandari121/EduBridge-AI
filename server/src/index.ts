import express from "express";
import cors from "cors";
import { env } from "./utils/env";
import { errorHandler, notFound } from "./middleware/errorHandler";

import authRoutes from "./routes/authRoutes";
import studentRoutes from "./routes/studentRoutes";
import tutorRoutes from "./routes/tutorRoutes";
import practiceRoutes from "./routes/practiceRoutes";
import teacherRoutes from "./routes/teacherRoutes";
import knowledgeRoutes from "./routes/knowledgeRoutes";
import metaRoutes from "./routes/meta";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://edu-bridge-ai-three.vercel.app"
  ]
}));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", aiProvider: env.aiProvider }));

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api", metaRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`EduBridge AI server running on http://localhost:${env.port} (AI_PROVIDER=${env.aiProvider})`);
});
