import { Suspense } from "react";
import ResultClient from "./ResultClient";

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

export default async function TestResultPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<div>Loading Results...</div>}>
      <ResultClient testId={id} />
    </Suspense>
  );
}
