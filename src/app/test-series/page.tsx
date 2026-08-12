"use client";

import { FullMockTest, UnitMockTest } from "@/components/TestCards";
import { ALL_UNITS } from "@/lib/questions";
import { useAuth } from "@/lib/AuthContext";

export default function TestSeriesPage() {
  const { isGuest } = useAuth();
  
  const handleLockedClick = () => {
    window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"));
  };

  const mockTests = Array.from({ length: 20 }, (_, i) => ({
    id: `fm${i + 1}`,
    title: `CSIR NET Life Sciences Mock Test ${i + 1}`,
    questions: 150,
    minutes: 180,
    tags: i % 2 === 0 ? ["Standard Pattern", "High Yield"] : ["Advanced Level", "Deep Review"]
  }));

  return (
    <div className="space-y-12 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Test Series Library</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Explore our comprehensive unit-wise and full-length mock tests.</p>
      </div>

      <section className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Unit-Wise Mock Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Array.isArray(ALL_UNITS) ? ALL_UNITS : []).slice(0, 13).map(unit => (
             <UnitMockTest 
               key={unit.id}
               id={`random-unit-${unit.id}`}
               unitId={unit.id}
               title={unit.name}
               questions={50}
               minutes={60}
               isLocked={isGuest}
               onLockedClick={handleLockedClick}
             />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Complete Mock Test Series</h2>
        <div className="space-y-8">
          {mockTests.map((test) => (
            <FullMockTest 
              key={test.id}
              id={test.id}
              title={test.title} 
              questions={test.questions} 
              minutes={test.minutes} 
              tags={test.tags}
              isLocked={isGuest && test.id !== "fm1"}
              onLockedClick={handleLockedClick}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
