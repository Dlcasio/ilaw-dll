import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  gradeLevel: z.string().min(1),
  learningArea: z.string().min(1),
  quarter: z.string().min(1),
  week: z.string().min(1),
  teachingDates: z.string().min(1),
  sessions: z.string().min(1),
  topic: z.string().min(1),
  competency: z.string().min(1),
  contentStandard: z.string().min(1),
  performanceStandard: z.string().min(1),
});

export type DllInput = z.infer<typeof InputSchema>;

export interface DllDay {
  objective: string;
  preLesson: string;
  flow: string;
  activities: string;
  resources: string;
  assessment: string;
  waysForward: string;
}

export interface DllOutput {
  competencyRestated: string;
  learnerContext: {
    priorKnowledge: string;
    interests: string;
    strengths: string;
    misconceptions: string;
    learningBarriers: string;
    realLifeExperiences: string;
  };
  differentiatedInstruction: {
    advanced: string;
    average: string;
    struggling: string;
    disabilities: string;
  };
  integration: string;
  teacherReflection: string;
  days: DllDay[];
}

const SYSTEM_PROMPT = `You are a senior Philippine DepEd curriculum developer expert in DepEd DO 16, s. 2026 (ILAW Framework) and the K-12 curriculum. You write classroom-ready, professionally written, curriculum-aligned 5-day Daily Lesson Logs (DLL) following the official DepEd ILAW Format.

You ALWAYS respond with a single valid JSON object matching the exact schema requested. No markdown fences, no preamble, no commentary. Pure JSON only.`;

function buildPrompt(input: DllInput) {
  return `Generate a complete 5-Day Daily Lesson Log (DLL) in the DepEd ILAW Format for the following:

Grade Level: ${input.gradeLevel}
Learning Area: ${input.learningArea}
Quarter: ${input.quarter}
Week: ${input.week}
Teaching Dates: ${input.teachingDates}
Number of Sessions: ${input.sessions}
Topic/Lesson: ${input.topic}
Learning Competency: ${input.competency}
Content Standard: ${input.contentStandard}
Performance Standard: ${input.performanceStandard}

Return EXACTLY this JSON shape (fill every field with rich, classroom-ready Philippine context; no nulls, no empty strings):

{
  "competencyRestated": "string - restate the learning competency clearly",
  "learnerContext": {
    "priorKnowledge": "string",
    "interests": "string",
    "strengths": "string",
    "misconceptions": "string",
    "learningBarriers": "string",
    "realLifeExperiences": "string"
  },
  "differentiatedInstruction": {
    "advanced": "string - extension tasks for advanced learners",
    "average": "string - guided tasks for average learners",
    "struggling": "string - scaffolding and simplified instructions",
    "disabilities": "string - accessible activities and alternative assessments"
  },
  "integration": "string - meaningful integration with ICT, Values Education, Literacy, Numeracy, and relevant subjects",
  "teacherReflection": "string - possible reflections on learner engagement, misconceptions, needed adjustments, intervention strategies, recommendations",
  "days": [
    {
      "objective": "Day 1 SMART objective aligned to competency",
      "preLesson": "Motivation, Readiness Check, and Review for Day 1",
      "flow": "Engage, Explore, Explain (5E model) for Day 1",
      "activities": "Detailed learning activities for Day 1 (Pre-Lesson + Flow combined narrative)",
      "resources": "Digital, Print, and Emergency Learning Resources for Day 1",
      "assessment": "Formative assessment for Day 1 (e.g., Exit Ticket, Oral Questioning) with answer key and criteria",
      "waysForward": "Homework, enrichment, home-based learning for Day 1"
    },
    { "objective": "Day 2...", "preLesson": "Review for Day 2", "flow": "Guided Practice, Discussion for Day 2", "activities": "...", "resources": "...", "assessment": "Day 2 formative (Matching Type) with key", "waysForward": "..." },
    { "objective": "Day 3...", "preLesson": "...", "flow": "Deepening Understanding, Collaborative Activity, Critical Thinking Task", "activities": "...", "resources": "...", "assessment": "Day 3 formative (Graphic Organizer) with criteria", "waysForward": "..." },
    { "objective": "Day 4...", "preLesson": "...", "flow": "Application, Real-Life Connection, Independent Practice", "activities": "...", "resources": "...", "assessment": "Day 4 Short Quiz with key", "waysForward": "..." },
    { "objective": "Day 5...", "preLesson": "...", "flow": "Synthesis, Performance Task, Reflection Activity", "activities": "...", "resources": "...", "assessment": "Day 5 Summative Test with answer key and criteria", "waysForward": "..." }
  ]
}

All 5-day objectives must be SMART, measurable, and progressive. Use Philippine classroom context. Be specific and concrete — no vague filler.`;
}

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model response");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export const generateDll = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<DllOutput> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(apiKey);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(data),
    });

    const parsed = extractJson(text) as DllOutput;
    if (!parsed.days || parsed.days.length !== 5) {
      throw new Error("Model did not return 5 days");
    }
    return parsed;
  });
