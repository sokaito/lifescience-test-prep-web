import Link from "next/link";
import { BookOpen, GraduationCap, Library } from "lucide-react";

export default function PYQDashboard() {
  const exams = [
    { id: "csir_net", name: "CSIR NET Life Sciences", icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
    { id: "dbt_bet", name: "DBT BET", icon: BookOpen, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-900/20", border: "border-teal-200 dark:border-teal-800" },
    { id: "gate", name: "GATE Life Sciences", icon: Library, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800" },
  ];

  return (
    <div className="max-w-screen-xl mx-auto space-y-10 px-4 md:px-8 py-8 md:py-12">
      <div className="text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight uppercase">
          Previous Year <span className="text-accent-main">Questions</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg font-bold mt-2 uppercase tracking-tight">
          Select an exam to explore past papers
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <Link 
            key={exam.id} 
            href={`/pyq/${exam.id}`}
            className="group flex flex-col items-center justify-center p-8 bg-bg-card rounded-[2rem] border border-border-subtle shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all text-center relative overflow-hidden"
          >
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border ${exam.border} ${exam.bg} group-hover:scale-110 transition-transform`}>
              <exam.icon className={`w-10 h-10 ${exam.color}`} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-text-primary uppercase tracking-tight mb-2">
              {exam.name}
            </h2>
            <div className="mt-4 px-6 py-2 bg-bg-main text-text-secondary text-xs font-black uppercase tracking-widest rounded-full group-hover:bg-accent-main group-hover:text-white transition-colors">
              Explore Papers
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
