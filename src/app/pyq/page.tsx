import fs from "fs";
import path from "path";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  FlaskConical,
  Microscope,
  ArrowRight,
  Layers,
  FileText,
} from "lucide-react";

function getExamStats(examId: string) {
  const dir = path.join(process.cwd(), "public", "repository", "pyq", examId);
  let totalFiles = 0;
  const groups = new Set<string>();
  let fullPapers = 0;

  function scan(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    for (const entry of fs.readdirSync(currentDir)) {
      const full = path.join(currentDir, entry);
      if (fs.statSync(full).isDirectory()) {
        scan(full);
      } else if (entry.endsWith(".json") && entry !== "manifest.json") {
        totalFiles++;
        const rel = path.relative(dir, full).replace(/\\/g, "/");
        if (rel.includes("/")) {
          groups.add(rel.split("/")[0]);
        } else {
          fullPapers++;
        }
      }
    }
  }

  scan(dir);
  return { totalFiles, sectionCount: groups.size, fullPapers };
}

export default function PYQDashboard() {
  const exams = [
    {
      id: "csir_net",
      name: "CSIR NET Life Sciences",
      description:
        "Official shift-wise question papers with Part A, B & C categorization.",
      icon: GraduationCap,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "hover:border-blue-500/40",
      stats: getExamStats("csir_net"),
    },
    {
      id: "gate",
      name: "GATE Life Sciences (XL)",
      description:
        "2010–2026 full papers with Sections A–G plus subject-wise modules.",
      icon: FlaskConical,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "hover:border-amber-500/40",
      stats: getExamStats("gate"),
    },
    {
      id: "dbt_bet",
      name: "DBT BET (JRF)",
      description:
        "Year-wise question papers with Part A & B solutions and concept notes.",
      icon: BookOpen,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500/10",
      border: "hover:border-teal-500/40",
      stats: getExamStats("dbt_bet"),
    },
    {
      id: "icmr_jrf",
      name: "ICMR JRF Life Sciences",
      description:
        "Topic-wise question bank organized neatly into 15 biological subjects.",
      icon: Microscope,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
      border: "hover:border-violet-500/40",
      stats: getExamStats("icmr_jrf"),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Previous Year Question Papers
        </h1>
        <p className="text-sm sm:text-base text-text-secondary mt-1">
          Select an examination to browse full-year papers or section-wise subjects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {exams.map((exam, idx) => (
          <Link
            key={exam.id}
            href={`/pyq/${exam.id}`}
            style={{ animationDelay: `${idx * 65}ms` }}
            className={`group bg-bg-card rounded-2xl border border-border-subtle ${exam.border} p-6 shadow-sm hover:shadow-xl card-pop animate-pop-in flex flex-col justify-between gap-5`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${exam.bg}`}
              >
                <exam.icon className={`w-6 h-6 ${exam.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-text-primary group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {exam.name}
                </h2>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  {exam.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-text-secondary">
                {exam.stats.fullPapers > 0 && (
                  <span className="inline-flex items-center gap-1 bg-bg-main px-2.5 py-1 rounded-lg border border-border-subtle">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    {exam.stats.fullPapers} Year Papers
                  </span>
                )}
                {exam.stats.sectionCount > 0 && (
                  <span className="inline-flex items-center gap-1 bg-bg-main px-2.5 py-1 rounded-lg border border-border-subtle">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    {exam.stats.sectionCount} Subject Sections
                  </span>
                )}
                {exam.stats.fullPapers === 0 && exam.stats.sectionCount === 0 && (
                  <span className="inline-flex items-center gap-1 bg-bg-main px-2.5 py-1 rounded-lg border border-border-subtle">
                    {exam.stats.totalFiles} Sets
                  </span>
                )}
              </div>

              <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                <span>Open</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
