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
    { exam: 'csir_net' },
    { exam: 'dbt_bet' },
    { exam: 'gate' },
    { exam: 'icmr_jrf' },
  ];
}

export default async function ExamYearSelection(props: PageProps) {
  const { exam } = await props.params;
  
  const examNames: Record<string, string> = {
    csir_net: "CSIR NET Life Sciences",
    dbt_bet: "DBT BET",
    gate: "GATE Life Sciences",
    icmr_jrf: "ICMR JRF Life Sciences"
  };

  const examName = examNames[exam] || exam.toUpperCase();

  // Read available JSON files from public/repository/pyq/[exam]
  let papers: PaperItem[] = [];
  
  function scanDirectory(dir: string, baseDir: string) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDirectory(fullPath, baseDir);
      } else if (item.endsWith('.json') && item !== 'manifest.json') {
        const relativePath = path.relative(baseDir, fullPath);
        const normalizedPath = relativePath.replace(/\\/g, '/').replace(/\.json$/, '');
        const parts = normalizedPath.split('/');
        
        const group = parts.length > 1 ? parts[0] : "";
        papers.push({
          id: normalizedPath,
          name: parts[parts.length - 1],
          group: group
        });
      }
    });
  }

  try {
    const dirPath = path.join(process.cwd(), "public", "repository", "pyq", exam);
    scanDirectory(dirPath, dirPath);
    // Sort: first by group, then by name
    papers.sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return b.name.localeCompare(a.name);
    });
  } catch (error) {
    console.error("Error reading PYQ directory:", error);
  }

  return (
    <div className="max-w-screen-xl mx-auto space-y-10 px-4 md:px-8 py-8 md:py-12">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Link href="/pyq" className="p-2 bg-bg-card rounded-full hover:bg-bg-main transition-colors border border-border-subtle">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <span className="text-sm font-bold text-accent-main uppercase tracking-widest">Previous Year Questions</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight uppercase">
            {examName}
          </h1>
        </div>
      </div>

      <ExamYearListClient exam={exam} initialPapers={papers} />
    </div>
  );
}
