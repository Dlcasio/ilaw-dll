import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Toaster } from "sonner";
import {
  FileText,
  BookOpen,
  Library,
  Download,
  Loader2,
  FileSpreadsheet,
  FileType,
  Sparkles,
  Printer,
} from "lucide-react";
import { generateDll, type DllInput, type DllOutput } from "@/lib/dll.functions";
import { exportDocx, exportPdf, exportXlsx } from "@/lib/dll-export";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DepEd ILAW DLL Generator — AI-powered Daily Lesson Logs" },
      {
        name: "description",
        content:
          "Generate professional 5-day DepEd ILAW Daily Lesson Logs in minutes. Curriculum-aligned, classroom-ready, exportable to DOCX, PDF, and Excel.",
      },
      { property: "og:title", content: "DepEd ILAW DLL Generator" },
      { property: "og:description", content: "AI-powered 5-day DLL generator for Philippine teachers." },
    ],
  }),
  component: Index,
});

const SAMPLE: DllInput = {
  gradeLevel: "Grade 7",
  learningArea: "Computer",
  quarter: "1",
  week: "1",
  teachingDates: "June 22–26, 2026",
  sessions: "5",
  topic: "What is a Computer",
  competency: "Define a computer and identify its primary functions in everyday life.",
  contentStandard:
    "Introduction to Computers. A computer is an electronic device that manipulates information or data, following the four basic stages of the information processing cycle to assist human tasks.",
  performanceStandard:
    "The learners shall be able to describe what a computer is, identify its major components, and demonstrate safe, responsible, and ethical use of computer technology in school and daily life.",
};

const GRADES = ["Kinder", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const QUARTERS = ["1", "2", "3", "4"];

const DAY_LABELS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"];

function Index() {
  const generate = useServerFn(generateDll);
  const [input, setInput] = useState<DllInput>(SAMPLE);
  const [dll, setDll] = useState<DllOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof DllInput>(k: K, v: DllInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setDll(null);
    try {
      const result = await generate({ data: input });
      setDll(result);
      toast.success("DLL generated successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      if (msg.includes("429")) toast.error("Rate limit reached — please retry in a moment.");
      else if (msg.includes("402")) toast.error("AI credits exhausted. Add credits in workspace billing.");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-cream-base font-sans text-zinc-900">
      <Toaster position="top-right" richColors />

      {/* Sidebar */}
      <nav className="w-64 bg-emerald-deep flex flex-col shrink-0 no-print">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-gold-prestige rounded-sm grid place-items-center">
              <span className="font-serif font-bold text-emerald-deep text-lg">i</span>
            </div>
            <div>
              <div className="font-serif text-cream-base font-semibold leading-tight">ILAW Portal</div>
              <div className="text-[10px] uppercase tracking-widest text-gold-prestige/70">DLL Generator</div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 space-y-1">
          <NavItem icon={<FileText className="size-4" />} label="Lesson Generator" active />
          <NavItem icon={<Library className="size-4" />} label="Lesson Archive" />
          <NavItem icon={<BookOpen className="size-4" />} label="Resources" />
        </div>

        <div className="p-6 border-t border-emerald-900/50">
          <div className="text-[10px] uppercase tracking-widest text-gold-prestige/50 mb-1">
            Republic of the Philippines
          </div>
          <div className="text-xs text-cream-base/80 font-medium">Department of Education</div>
          <div className="text-[10px] text-emerald-mid mt-2">DepEd DO 16, s. 2026</div>
        </div>
      </nav>

      {/* Split-screen */}
      <main className="flex-1 flex overflow-hidden">
        {/* Form panel */}
        <section className="w-[440px] shrink-0 border-r border-emerald-deep/10 bg-cream-soft overflow-y-auto px-8 py-10 no-print">
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-emerald-deep leading-tight">
              Lesson Parameters
            </h2>
            <p className="text-sm text-emerald-mid mt-2 text-pretty">
              Define the pedagogical scope for your five-day instructional sequence.
            </p>
          </div>

          <form onSubmit={onGenerate} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Grade Level">
                <select className={selectCls} value={input.gradeLevel} onChange={(e) => set("gradeLevel", e.target.value)}>
                  {GRADES.map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Quarter">
                <select className={selectCls} value={input.quarter} onChange={(e) => set("quarter", e.target.value)}>
                  {QUARTERS.map((q) => <option key={q} value={q}>Quarter {q}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Week">
                <input className={inputCls} value={input.week} onChange={(e) => set("week", e.target.value)} />
              </Field>
              <Field label="Sessions">
                <input className={inputCls} value={input.sessions} onChange={(e) => set("sessions", e.target.value)} />
              </Field>
            </div>

            <Field label="Learning Area">
              <input className={inputCls} value={input.learningArea} onChange={(e) => set("learningArea", e.target.value)} />
            </Field>

            <Field label="Teaching Dates">
              <input className={inputCls} value={input.teachingDates} onChange={(e) => set("teachingDates", e.target.value)} />
            </Field>

            <Field label="Topic / Lesson">
              <input className={inputCls} value={input.topic} onChange={(e) => set("topic", e.target.value)} />
            </Field>

            <Field label="Learning Competency">
              <textarea className={textareaCls} rows={3} value={input.competency} onChange={(e) => set("competency", e.target.value)} />
            </Field>

            <Field label="Content Standard">
              <textarea className={textareaCls} rows={3} value={input.contentStandard} onChange={(e) => set("contentStandard", e.target.value)} />
            </Field>

            <Field label="Performance Standard">
              <textarea className={textareaCls} rows={3} value={input.performanceStandard} onChange={(e) => set("performanceStandard", e.target.value)} />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-deep text-cream-base font-medium py-3 rounded-md ring-2 ring-emerald-deep transition-transform active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="size-4 animate-spin" /> Generating instructional plan…</>
              ) : (
                <><Sparkles className="size-4 text-gold-prestige" /> Generate Instructional Plan</>
              )}
            </button>
          </form>
        </section>

        {/* Preview panel */}
        <section className="flex-1 bg-zinc-50/40 overflow-y-auto p-10">
          <div className="flex items-start justify-between mb-8 no-print">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-emerald-deep leading-tight">
                Daily Lesson Log
              </h1>
              <p className="text-sm text-emerald-mid font-medium mt-1">
                DepEd ILAW Format • {input.learningArea} • Week {input.week}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton
                onClick={() => dll && exportPdf(input, dll)}
                disabled={!dll}
                icon={<FileType className="size-4" />}
                label="PDF"
              />
              <ExportButton
                onClick={() => dll && exportXlsx(input, dll)}
                disabled={!dll}
                icon={<FileSpreadsheet className="size-4" />}
                label="Excel"
              />
              <ExportButton
                onClick={() => dll && exportDocx(input, dll)}
                disabled={!dll}
                icon={<Download className="size-4" />}
                label="DOCX"
                primary
              />
              <button
                onClick={() => window.print()}
                disabled={!dll}
                className="flex items-center gap-2 text-sm py-2 px-3 bg-white ring-1 ring-emerald-deep/10 rounded-md text-emerald-deep hover:bg-emerald-soft transition-colors shadow-sm disabled:opacity-40"
              >
                <Printer className="size-4" /> Print
              </button>
            </div>
          </div>

          {/* Document */}
          <div className="bg-white ring-1 ring-emerald-deep/5 rounded-xl shadow-2xl shadow-emerald-deep/5 overflow-hidden">
            <header className="p-8 bg-cream-soft border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="size-14 rounded-full bg-gold-prestige/15 ring-1 ring-gold-prestige/40 grid place-items-center">
                  <span className="font-serif font-bold text-emerald-deep text-xl">DepEd</span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-deep/60">
                    Republic of the Philippines
                  </p>
                  <h3 className="font-serif text-lg font-semibold text-emerald-deep mt-0.5">
                    Department of Education
                  </h3>
                  <p className="text-[10px] text-emerald-mid mt-0.5">ILAW Framework • DO 16, s. 2026</p>
                </div>
              </div>
              <div className="text-right grid grid-cols-[auto_auto] gap-x-6 gap-y-1">
                <span className="text-[10px] font-semibold text-emerald-deep/40 uppercase">Grade</span>
                <span className="text-[11px] font-medium text-emerald-deep">{input.gradeLevel}</span>
                <span className="text-[10px] font-semibold text-emerald-deep/40 uppercase">Area</span>
                <span className="text-[11px] font-medium text-emerald-deep">{input.learningArea}</span>
                <span className="text-[10px] font-semibold text-emerald-deep/40 uppercase">Quarter</span>
                <span className="text-[11px] font-medium text-emerald-deep">{input.quarter} • Week {input.week}</span>
                <span className="text-[10px] font-semibold text-emerald-deep/40 uppercase">Dates</span>
                <span className="text-[11px] font-medium text-emerald-deep">{input.teachingDates}</span>
              </div>
            </header>

            {loading && <LoadingState />}
            {!loading && !dll && <EmptyState />}
            {!loading && dll && <DllTable input={input} dll={dll} />}
          </div>
        </section>
      </main>
    </div>
  );
}

const inputCls = "h-10 px-3 bg-white ring-1 ring-emerald-deep/10 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-mid";
const selectCls = inputCls;
const textareaCls = "p-3 bg-white ring-1 ring-emerald-deep/10 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-mid leading-relaxed";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-emerald-deep">{label}</label>
      {children}
    </div>
  );
}

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <a
      href="#"
      className={
        "flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium transition-colors " +
        (active
          ? "bg-emerald-mid/30 text-cream-base border-l-2 border-gold-prestige"
          : "text-cream-base/60 hover:bg-emerald-mid/10 hover:text-cream-base")
      }
    >
      {icon}
      {label}
    </a>
  );
}

function ExportButton({
  onClick, disabled, icon, label, primary,
}: { onClick: () => void; disabled?: boolean; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "flex items-center gap-2 text-sm py-2 px-3 rounded-md transition-colors shadow-sm disabled:opacity-40 " +
        (primary
          ? "bg-emerald-deep text-cream-base ring-1 ring-emerald-deep hover:bg-emerald-mid"
          : "bg-white ring-1 ring-emerald-deep/10 text-emerald-deep hover:bg-emerald-soft")
      }
    >
      {icon} {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="p-16 text-center">
      <div className="mx-auto size-14 rounded-2xl bg-gold-prestige/10 ring-1 ring-gold-prestige/30 grid place-items-center mb-5">
        <Sparkles className="size-6 text-gold-prestige" />
      </div>
      <h3 className="font-serif text-xl text-emerald-deep mb-2">Ready to generate</h3>
      <p className="text-sm text-zinc-500 max-w-md mx-auto">
        Fill the lesson parameters on the left and click <span className="font-semibold text-emerald-deep">Generate Instructional Plan</span> to produce a complete 5-day DepEd ILAW Daily Lesson Log.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-16 text-center">
      <Loader2 className="mx-auto size-8 animate-spin text-emerald-mid mb-4" />
      <p className="font-serif text-emerald-deep text-lg">Crafting your 5-day instructional plan…</p>
      <p className="text-xs text-zinc-500 mt-2">Aligning with competencies, standards, and ILAW Framework.</p>
    </div>
  );
}

function DllTable({ input, dll }: { input: DllInput; dll: DllOutput }) {
  const rows = [
    { section: "I. Intentions", label: "Learning Competency", values: Array(5).fill(dll.competencyRestated), span: true },
    { section: "I. Intentions", label: "Content Standard", values: Array(5).fill(input.contentStandard), span: true },
    { section: "I. Intentions", label: "Performance Standard", values: Array(5).fill(input.performanceStandard), span: true },
    { section: "I. Intentions", label: "Daily Objective", values: dll.days.map((d) => d.objective) },
    { section: "II. Learning Experience", label: "Pre-Lesson", values: dll.days.map((d) => d.preLesson) },
    { section: "II. Learning Experience", label: "Learning Flow (5E)", values: dll.days.map((d) => d.flow) },
    { section: "II. Learning Experience", label: "Activities", values: dll.days.map((d) => d.activities) },
    { section: "II. Learning Experience", label: "Resources", values: dll.days.map((d) => d.resources) },
    { section: "III. Assessment", label: "Formative / Summative", values: dll.days.map((d) => d.assessment) },
    { section: "IV. Ways Forward", label: "Extended Learning", values: dll.days.map((d) => d.waysForward) },
  ];

  let lastSection = "";

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-emerald-deep">
            <th className="w-48 py-4 px-6 text-left text-[10px] font-semibold text-gold-prestige uppercase tracking-widest">
              Components
            </th>
            {DAY_LABELS.map((d) => (
              <th key={d} className="py-4 px-6 text-left text-[10px] font-semibold text-cream-base uppercase tracking-widest border-l border-emerald-900/40">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((r, i) => {
            const showSection = r.section !== lastSection;
            lastSection = r.section;
            return (
              <>
                {showSection && (
                  <tr key={`sec-${i}`} className="bg-emerald-soft">
                    <td colSpan={6} className="px-6 py-2 text-[10px] font-bold text-emerald-deep uppercase tracking-tight">
                      {r.section}
                    </td>
                  </tr>
                )}
                <tr key={i} className="align-top">
                  <td className="px-6 py-4 font-medium text-emerald-deep bg-cream-soft/40 w-48">
                    {r.label}
                  </td>
                  {r.span ? (
                    <td colSpan={5} className="px-6 py-4 text-zinc-600 text-pretty leading-relaxed text-sm italic">
                      {r.values[0]}
                    </td>
                  ) : (
                    r.values.map((v, j) => (
                      <td key={j} className="px-6 py-4 text-zinc-700 text-xs leading-relaxed text-pretty">
                        {v}
                      </td>
                    ))
                  )}
                </tr>
              </>
            );
          })}

          {/* Appendix rows */}
          <AppendixRow label="Learner Context">
            <ul className="space-y-1.5 text-xs text-zinc-700">
              <li><b>Prior Knowledge:</b> {dll.learnerContext.priorKnowledge}</li>
              <li><b>Interests:</b> {dll.learnerContext.interests}</li>
              <li><b>Strengths:</b> {dll.learnerContext.strengths}</li>
              <li><b>Misconceptions:</b> {dll.learnerContext.misconceptions}</li>
              <li><b>Learning Barriers:</b> {dll.learnerContext.learningBarriers}</li>
              <li><b>Real-Life Experiences:</b> {dll.learnerContext.realLifeExperiences}</li>
            </ul>
          </AppendixRow>
          <AppendixRow label="Differentiated Instruction">
            <ul className="space-y-1.5 text-xs text-zinc-700">
              <li><b>Advanced:</b> {dll.differentiatedInstruction.advanced}</li>
              <li><b>Average:</b> {dll.differentiatedInstruction.average}</li>
              <li><b>Struggling:</b> {dll.differentiatedInstruction.struggling}</li>
              <li><b>With Disabilities:</b> {dll.differentiatedInstruction.disabilities}</li>
            </ul>
          </AppendixRow>
          <AppendixRow label="Opportunities for Integration">
            <p className="text-xs text-zinc-700 leading-relaxed">{dll.integration}</p>
          </AppendixRow>
          <AppendixRow label="Teacher Reflection">
            <p className="text-xs text-zinc-700 leading-relaxed">{dll.teacherReflection}</p>
          </AppendixRow>
        </tbody>
      </table>
    </div>
  );
}

function AppendixRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="px-6 py-4 font-medium text-emerald-deep bg-cream-soft/40 align-top">{label}</td>
      <td colSpan={5} className="px-6 py-4">{children}</td>
    </tr>
  );
}
