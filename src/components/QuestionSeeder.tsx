"use client";

import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";
import { Upload, ChevronDown, ChevronUp } from "lucide-react";

import { ALL_UNITS } from "@/lib/questions";


export default function FirebaseQuestionSeeder() {
  const [loadingUnit, setLoadingUnit] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<number | null>(null);

  const targetTestId = "fm1";

  const handleSeedUnit = async (unitId: number, questions: any[], unitName: string) => {
    if (questions.length === 0) {
      setStatus('No questions inside ' + unitName + ' to upload.');
      return;
    }

    setLoadingUnit(unitId);
    setStatus('Preparing batch write for ' + unitName + '...');

    try {
      const batch = writeBatch(db);
      const questionsRef = collection(db, "questions");

      questions.forEach((q) => {
        const newDocRef = doc(questionsRef);
        batch.set(newDocRef, {
          ...q,
          unitId: unitId,
          unitName: unitName,
          testId: targetTestId,
          randomKey: Math.random(),
          createdAt: new Date().toISOString()
        });
      });

      setStatus('Committing batch to Firestore...');
      await batch.commit();

      setStatus('Success! Added ' + questions.length + ' questions for ' + unitName);
    } catch (error: any) {
      console.error("Error seeding documents: ", error);
      setStatus('Error: ' + error.message);
    } finally {
      setLoadingUnit(null);
    }
  };

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl md:rounded-3xl shadow-sm mb-12 overflow-hidden transition-colors">
      <div className="p-5 md:p-8 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-3 md:space-x-4 mb-2">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100/50 shrink-0">
            <Upload className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800">Unit-Wise Question Seeder</h2>
            <p className="text-xs md:text-sm text-slate-500">Upload organized questions into Firestore.</p>
          </div>
        </div>

        {status && (
          <div className={'mt-4 p-4 rounded-xl text-sm font-medium border ' + (
            status.startsWith("Error")
              ? "bg-red-50 text-red-700 border-red-100"
              : status.startsWith("Success")
                ? "bg-teal-50 text-teal-700 border-teal-100"
                : "bg-blue-50 text-blue-700 border-blue-100"
            )}>
            {status}
          </div>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {ALL_UNITS.map(unit => (
          <div key={unit.id} className="flex flex-col">
            <button
               onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
               className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-sm">
                  {unit.id}
                </span>
                <span className="font-medium text-slate-700 text-left">{unit.name}</span>
                <span className={'px-2.5 py-1 rounded-full text-xs font-bold ' + (unit.questions.length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400')}>
                  {unit.questions.length} Qs
                </span>
              </div>
              <div className="p-2 text-slate-400">
                {expandedUnit === unit.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>
            
            {expandedUnit === unit.id && (
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs md:text-sm text-slate-500">
                    This will tag the uploaded documents with <code className="bg-slate-200 px-1 rounded text-[10px] md:text-xs">unitId: {unit.id}</code>
                  </p>
                  <button
                    onClick={() => handleSeedUnit(unit.id, unit.questions, unit.name)}
                    disabled={loadingUnit !== null || unit.questions.length === 0}
                    className="w-full sm:w-auto flex justify-center py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    {loadingUnit === unit.id ? "Uploading..." : "Upload " + unit.name}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
