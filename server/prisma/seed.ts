import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function keywordize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2)
    )
  );
}

async function main() {
  console.log("Seeding EduBridge AI demo data...");

  // ---------- Subjects & Topics ----------
  const mathSubject = await prisma.subject.create({ data: { name: "Mathematics" } });
  const csSubject = await prisma.subject.create({ data: { name: "Computer Science" } });
  const sciSubject = await prisma.subject.create({ data: { name: "Science" } });

  const topics: Record<string, { id: string }> = {};
  const mathTopics = ["Algebra", "Linear Equations", "Quadratic Equations", "Factorisation", "Probability"];
  const csTopics = ["Arrays", "Linked Lists", "Recursion", "Sorting", "Searching"];
  const sciTopics = ["Force", "Motion", "Chemical Reactions", "Electricity"];

  for (const name of mathTopics) {
    topics[name] = await prisma.topic.create({ data: { name, subjectId: mathSubject.id } });
  }
  for (const name of csTopics) {
    topics[name] = await prisma.topic.create({ data: { name, subjectId: csSubject.id } });
  }
  for (const name of sciTopics) {
    topics[name] = await prisma.topic.create({ data: { name, subjectId: sciSubject.id } });
  }

  // ---------- Knowledge base (small, real-feeling grounded documents) ----------
  const knowledgeSeed = [
    {
      title: "NCERT Class 10 Mathematics — Polynomials",
      subject: "Mathematics",
      source: "NCERT Class 10 Mathematics, Chapter 2",
      url: "https://ncert.nic.in/textbook.php",
      topic: "Factorisation",
      chunks: [
        "To factorise a quadratic expression of the form x^2 + bx + c, find two numbers that multiply to c and add up to b. Rewrite the middle term using those two numbers, then group terms in pairs and factor out the common binomial.",
        "For example, to factorise x^2 + 5x + 6, look for two numbers that multiply to 6 and add to 5: those numbers are 2 and 3. Rewrite as x^2 + 2x + 3x + 6, group as (x^2 + 2x) + (3x + 6), factor each group to get x(x+2) + 3(x+2), then factor out (x+2) to get (x+2)(x+3).",
        "A common student error is choosing numbers that multiply correctly but do not add to the middle coefficient, or forgetting to check the sign of c when both factors must be negative or of opposite sign.",
      ],
    },
    {
      title: "NCERT Class 10 Mathematics — Quadratic Equations",
      subject: "Mathematics",
      source: "NCERT Class 10 Mathematics, Chapter 4",
      url: "https://ncert.nic.in/textbook.php",
      topic: "Quadratic Equations",
      chunks: [
        "A quadratic equation in the standard form ax^2 + bx + c = 0 can be solved by factorisation, completing the square, or the quadratic formula x = (-b ± sqrt(b^2 - 4ac)) / 2a.",
        "The discriminant b^2 - 4ac tells us the nature of the roots: positive means two distinct real roots, zero means one repeated real root, and negative means no real roots.",
      ],
    },
    {
      title: "Open CS Curriculum — Recursion Basics",
      subject: "Computer Science",
      source: "Open CS Foundations, Unit 6: Recursion",
      url: null,
      topic: "Recursion",
      chunks: [
        "Recursion is a technique where a function calls itself to solve a smaller instance of the same problem. Every recursive function needs a base case that stops the recursion and a recursive case that reduces the problem size.",
        "A classic example is computing factorial: factorial(n) returns 1 when n is 0 (base case), otherwise it returns n * factorial(n-1) (recursive case). Tracing through factorial(4) shows the calls stacking up until the base case is hit, then unwinding to multiply the results together.",
        "Common mistakes include forgetting the base case (causing infinite recursion and a stack overflow) or not actually reducing the problem size on each call.",
      ],
    },
    {
      title: "Open CS Curriculum — Sorting Algorithms",
      subject: "Computer Science",
      source: "Open CS Foundations, Unit 8: Sorting",
      url: null,
      topic: "Sorting",
      chunks: [
        "Bubble sort repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order, achieving O(n^2) time complexity in the worst case.",
        "Merge sort divides the array in half recursively until each piece has one element, then merges sorted halves back together, achieving O(n log n) time complexity.",
      ],
    },
    {
      title: "NCERT Class 9 Science — Force and Laws of Motion",
      subject: "Science",
      source: "NCERT Class 9 Science, Chapter 9",
      url: "https://ncert.nic.in/textbook.php",
      topic: "Force",
      chunks: [
        "Newton's First Law states that an object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an unbalanced external force. This property is called inertia.",
        "Newton's Second Law states that force equals mass times acceleration (F = ma). A larger force produces a larger acceleration for the same mass, and a larger mass needs more force for the same acceleration.",
      ],
    },
  ];

  for (const doc of knowledgeSeed) {
    const topicId = topics[doc.topic]?.id;
    await prisma.knowledgeDocument.create({
      data: {
        title: doc.title,
        subject: doc.subject,
        source: doc.source,
        url: doc.url,
        chunks: {
          create: doc.chunks.map((content) => ({
            content,
            topicId,
            keywords: JSON.stringify(keywordize(content)),
          })),
        },
      },
    });
  }

  // ---------- Question bank ----------
  await prisma.question.createMany({
    data: [
      // Factorisation
      { topicId: topics["Factorisation"].id, type: "SHORT_ANSWER", difficulty: 1, prompt: "Factorise: x^2 + 5x + 6", answer: "(x+2)(x+3)", explanation: "Find two numbers that multiply to 6 and add to 5: 2 and 3." },
      { topicId: topics["Factorisation"].id, type: "SHORT_ANSWER", difficulty: 2, prompt: "Factorise: x^2 - 7x + 12", answer: "(x-3)(x-4)", explanation: "Find two numbers that multiply to 12 and add to -7: -3 and -4." },
      { topicId: topics["Factorisation"].id, type: "SHORT_ANSWER", difficulty: 2, prompt: "Factorise: x^2 + x - 6", answer: "(x+3)(x-2)", explanation: "Find two numbers that multiply to -6 and add to 1: 3 and -2." },
      { topicId: topics["Factorisation"].id, type: "MCQ", difficulty: 1, prompt: "Which pair of numbers factorises x^2 + 9x + 20?", options: JSON.stringify(["4 and 5", "2 and 10", "1 and 20", "20 and -1"]), answer: "4 and 5", explanation: "4 x 5 = 20 and 4 + 5 = 9." },
      { topicId: topics["Factorisation"].id, type: "SHORT_ANSWER", difficulty: 3, prompt: "Factorise: 2x^2 + 7x + 3", answer: "(2x+1)(x+3)", explanation: "Split the middle term: 2x^2 + 6x + x + 3 = 2x(x+3) + 1(x+3)." },
      { topicId: topics["Factorisation"].id, type: "SHORT_ANSWER", difficulty: 4, prompt: "Factorise: 6x^2 - 5x - 6", answer: "(2x-3)(3x+2)", explanation: "Split the middle term: 6x^2 - 9x + 4x - 6, group and factor." },
      // Quadratic Equations
      { topicId: topics["Quadratic Equations"].id, type: "SHORT_ANSWER", difficulty: 1, prompt: "Solve: x^2 - 5x + 6 = 0", answer: "x=2,3", explanation: "Factorise to (x-2)(x-3)=0, so x=2 or x=3." },
      { topicId: topics["Quadratic Equations"].id, type: "SHORT_ANSWER", difficulty: 2, prompt: "Find the discriminant of x^2 + 4x + 4 = 0", answer: "0", explanation: "b^2-4ac = 16-16 = 0, so there is one repeated root." },
      { topicId: topics["Quadratic Equations"].id, type: "SHORT_ANSWER", difficulty: 3, prompt: "Solve using the quadratic formula: 2x^2 - 4x - 6 = 0", answer: "x=3,-1", explanation: "x = (4 ± sqrt(16+48))/4 = (4 ± 8)/4, giving x=3 or x=-1." },
      // Recursion
      { topicId: topics["Recursion"].id, type: "SHORT_ANSWER", difficulty: 1, prompt: "What is the base case needed to stop factorial(n) from calling itself forever?", answer: "n=0", explanation: "factorial(0) returns 1 without recursing further." },
      { topicId: topics["Recursion"].id, type: "SHORT_ANSWER", difficulty: 2, prompt: "What does factorial(4) evaluate to?", answer: "24", explanation: "4*3*2*1 = 24." },
      { topicId: topics["Recursion"].id, type: "CONCEPTUAL", difficulty: 3, prompt: "Why does a recursive function without a base case eventually crash?", answer: "stack overflow", explanation: "Each call adds a new frame to the call stack; without a base case it never stops, exhausting memory (stack overflow)." },
      // Sorting
      { topicId: topics["Sorting"].id, type: "MCQ", difficulty: 1, prompt: "What is the worst-case time complexity of bubble sort?", options: JSON.stringify(["O(n)", "O(n log n)", "O(n^2)", "O(log n)"]), answer: "O(n^2)", explanation: "Bubble sort compares and swaps adjacent elements repeatedly, giving quadratic time in the worst case." },
      { topicId: topics["Sorting"].id, type: "MCQ", difficulty: 2, prompt: "What is the time complexity of merge sort?", options: JSON.stringify(["O(n^2)", "O(n log n)", "O(n)", "O(2^n)"]), answer: "O(n log n)", explanation: "Merge sort splits the array in half recursively (log n levels) and merges in linear time at each level." },
      // Force
      { topicId: topics["Force"].id, type: "MCQ", difficulty: 1, prompt: "Which law explains why a passenger jerks forward when a bus stops suddenly?", options: JSON.stringify(["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Gravitation"]), answer: "Newton's First Law", explanation: "The passenger's body continues in motion due to inertia even as the bus stops." },
      { topicId: topics["Force"].id, type: "NUMERIC", difficulty: 2, prompt: "A 10 kg object accelerates at 2 m/s^2. What force acts on it (in Newtons)?", answer: "20", explanation: "F = ma = 10 x 2 = 20 N." },
    ],
  });

  // ---------- Teacher ----------
  const teacherPasswordHash = await bcrypt.hash("Demo123!", 10);
  await prisma.user.create({
    data: {
      name: "Ms. Anjali Sharma",
      email: "teacher@edubridge.demo",
      passwordHash: teacherPasswordHash,
      role: "TEACHER",
      preference: { create: {} },
      teacherProfile: { create: { school: "Demo Public School" } },
    },
  });

  // ---------- Students with different performance patterns ----------
  const studentPasswordHash = await bcrypt.hash("Demo123!", 10);

  const studentsSeed = [
    {
      name: "Rahul Verma", // primary demo account — matches spec's exact demo flow
      email: "student@edubridge.demo",
      streak: 5,
      mastery: [
        { topic: "Factorisation", score: 38, attempts: 6, correct: 2, trend: -3 },
        { topic: "Quadratic Equations", score: 61, attempts: 8, correct: 5, trend: 4 },
        { topic: "Linear Equations", score: 82, attempts: 10, correct: 9, trend: 1 },
        { topic: "Recursion", score: 44, attempts: 5, correct: 2, trend: -2 },
        { topic: "Probability", score: 51, attempts: 4, correct: 2, trend: 0 },
      ],
      daysAgoActive: 0,
    },
    {
      name: "Ishita Rao", // strong performer
      email: "ishita@edubridge.demo",
      streak: 12,
      mastery: [
        { topic: "Linear Equations", score: 91, attempts: 12, correct: 11, trend: 2 },
        { topic: "Quadratic Equations", score: 88, attempts: 10, correct: 9, trend: 3 },
        { topic: "Sorting", score: 85, attempts: 8, correct: 7, trend: 1 },
      ],
      daysAgoActive: 0,
    },
    {
      name: "Aman Khan", // weak mathematics
      email: "aman@edubridge.demo",
      streak: 1,
      mastery: [
        { topic: "Factorisation", score: 28, attempts: 7, correct: 2, trend: -6 },
        { topic: "Quadratic Equations", score: 33, attempts: 6, correct: 2, trend: -8 },
        { topic: "Algebra", score: 40, attempts: 5, correct: 2, trend: -4 },
      ],
      daysAgoActive: 1,
    },
    {
      name: "Priya Nair", // improving
      email: "priya@edubridge.demo",
      streak: 4,
      mastery: [
        { topic: "Recursion", score: 58, attempts: 6, correct: 4, trend: 12 },
        { topic: "Arrays", score: 66, attempts: 7, correct: 5, trend: 9 },
        { topic: "Sorting", score: 60, attempts: 5, correct: 3, trend: 8 },
      ],
      daysAgoActive: 0,
    },
    {
      name: "Sameer Joshi", // low engagement
      email: "sameer@edubridge.demo",
      streak: 0,
      mastery: [
        { topic: "Chemical Reactions", score: 48, attempts: 3, correct: 1, trend: -2 },
        { topic: "Force", score: 55, attempts: 2, correct: 1, trend: 0 },
      ],
      daysAgoActive: 8,
    },
    {
      name: "Divya Menon", // strong science, weak algebra
      email: "divya@edubridge.demo",
      streak: 6,
      mastery: [
        { topic: "Force", score: 89, attempts: 9, correct: 8, trend: 3 },
        { topic: "Motion", score: 84, attempts: 7, correct: 6, trend: 2 },
        { topic: "Algebra", score: 42, attempts: 6, correct: 2, trend: -5 },
      ],
      daysAgoActive: 0,
    },
  ];

  for (const s of studentsSeed) {
    const user = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        passwordHash: studentPasswordHash,
        role: "STUDENT",
        preference: { create: { language: "ENGLISH", level: "BEGINNER" } },
        studentProfile: {
          create: {
            streakDays: s.streak,
            lastActiveAt: new Date(Date.now() - s.daysAgoActive * 24 * 60 * 60 * 1000),
          },
        },
      },
      include: { studentProfile: true },
    });

    for (const m of s.mastery) {
      const topic = topics[m.topic];
      if (!topic) continue;
      await prisma.masteryScore.create({
        data: {
          studentId: user.studentProfile!.id,
          topicId: topic.id,
          score: m.score,
          attempts: m.attempts,
          correct: m.correct,
          trend: m.trend,
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("Demo student login: student@edubridge.demo / Demo123!");
  console.log("Demo teacher login: teacher@edubridge.demo / Demo123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
