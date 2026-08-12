import ActiveTest from "@/components/ActiveTest";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Return a list of `params` to populate the [id] dynamic segment
export function generateStaticParams() {
  const unitParams = Array.from({ length: 13 }, (_, i) => [
    { id: `random-unit-${i + 1}` },
    { id: `unit-${i + 1}` }
  ]).flat();

  return [
    { id: 'dq1' },
    { id: 'dq2' },
    { id: 'dq3' },
    { id: 'dq4' },
    { id: 'wr1' },
    { id: 'wr2' },
    { id: 'fm1' },
    { id: 'fm2' },
    { id: 'random-10' },
    { id: 'random-50' },
    { id: 'random-150' },
    ...unitParams
  ];
}

export default async function ExamPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  return (
    <div className="bg-bg-main min-h-screen transition-colors">
      {/* Top minimal nav for getting out */}
      <div className="h-14 bg-bg-card border-b border-border-subtle flex items-center px-6 sticky top-0 z-20 transition-colors">
        <Link href="/" className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Exam</span>
        </Link>
      </div>
      
      {/* The actual test interface */}
      <ActiveTest testId={id} />
    </div>
  );
}
