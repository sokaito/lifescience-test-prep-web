import fs from "fs";
import path from "path";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ExamYearListClient, { PaperItem } from "@/components/ExamYearListClient";

interface PageProps {
  params: Promise<{ exam: string }>;
}

export function generateStaticParams() {
  return [
    { exam: "csir_net" },
    { exam: "dbt_bet" },
    { exam: "gate" },
    { exam: "icmr_jrf" },
  ];
}

export default async function ExamYearSelection(props: PageProps) {
  const { exam } = await props.params;

  const examNames: Record<string, string> = {
    csir_net: "CSIR NET Life Sciences",
    dbt_bet: "DBT BET (JRF)",
    gate: "GATE Life Sciences (XL)",
    icmr_jrf: "ICMR JRF Life Sciences",
  };

  const examName = examNames[exam] || exam.toUpperCase();
  const papers: PaperItem[] = [];

  function scanDirectory(dir: string, baseDir: string) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDirectory(fullPath, baseDir);
      } else if (item.endsWith(".json") && item !== "manifest.json") {
        const relativePath = path.relative(baseDir, fullPath);
        const normalizedPath = relativePath
          .replace(/\\/g, "/")
          .replace(/\.json$/, "");
        const parts = normalizedPath.split("/");
        const group = parts.length > 1 ? parts[0] : "";

        let questionCount: number | undefined;
        try {
          const parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
          if (Array.isArray(parsed)) {
            questionCount = parsed.length;
          }
        } catch {
          questionCount = undefined;
        }

        papers.push({
          id: normalizedPath,
          name: parts[parts.length - 1],
          group,
          questionCount,
        });
      }
    });
  }

  try {
    const dirPath = path.join(process.cwd(), "public", "repository", "pyq", exam);
    scanDirectory(dirPath, dirPath);
    papers.sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return b.name.localeCompare(a.name);
    });
  } catch (error) {
    console.error("Error reading PYQ directory:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/pyq"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-text-secondary hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Exams</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          {examName}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Choose a year paper or pick a subject section below to start practicing.
        </p>
      </div>

      <ExamYearListClient exam={exam} initialPapers={papers} />
    </div>
  );
}
