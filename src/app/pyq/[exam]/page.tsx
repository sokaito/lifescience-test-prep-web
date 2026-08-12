import fs from "fs";
import path from "path";
import Link from "next/link";
import { ArrowLeft, Calendar, FileText } from "lucide-react";

interface PageProps {
  params: Promise<{ exam: string }>;
}

export function generateStaticParams() {
  return [
    { exam: 'csir_net' },
    { exam: 'dbt_bet' },
    { exam: 'gate' },
  ];
}

const formatYearName = (y: string) => {
  return y
    .split('_')
    .map(part => {
      const match = part.match(/^shift(\d+)$/i);
      if (match) {
        return `Shift ${match[1]}`;
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
};

export default async function ExamYearSelection(props: PageProps) {
  const { exam } = await props.params;
  
  const examNames: Record<string, string> = {
    csir_net: "CSIR NET Life Sciences",
    dbt_bet: "DBT BET",
    gate: "GATE Life Sciences"
  };

  const examName = examNames[exam] || exam.toUpperCase();

  // Read available JSON files from public/repository/pyq/[exam]
  let availableYears: string[] = [];
  try {
    const dirPath = path.join(process.cwd(), "public", "repository", "pyq", exam);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      availableYears = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
        .sort((a, b) => b.localeCompare(a)); // Sort descending
    }
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

      {availableYears.length === 0 ? (
        <div className="bg-bg-card p-12 rounded-[2rem] border border-border-subtle text-center shadow-sm">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-black text-text-primary uppercase tracking-tight mb-2">No Papers Available</h3>
          <p className="text-text-secondary font-medium">We are currently adding previous year papers for this exam. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {availableYears.map((year) => (
            <Link
              key={year}
              href={`/pyq/${exam}/${year}`}
              className="group flex flex-col items-center justify-center p-6 bg-bg-card rounded-2xl border border-border-subtle shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-125 transition-transform text-accent-main">
                <Calendar className="w-16 h-16" />
              </div>
              <Calendar className="w-8 h-8 text-text-secondary group-hover:text-accent-main transition-colors mb-3 relative z-10" />
              <h2 className="text-xl md:text-2xl font-black text-text-primary uppercase tracking-tight relative z-10">
                PYQ {formatYearName(year)}
              </h2>
              <div className="mt-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest relative z-10">
                Start Paper
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
