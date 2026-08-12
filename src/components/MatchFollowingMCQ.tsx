"use client";

import React from "react";
import { Question } from "@/lib/testEngine";

interface MatchFollowingMCQProps {
  question: Question;
  selectedOption: string | undefined;
  onSelectOption: (option: string) => void;
  disabled?: boolean;
  correctAnswer?: string;
  isReview?: boolean;
  col1Header?: string;
  col2Header?: string;
}

export default function MatchFollowingMCQ({
  question,
  selectedOption,
  onSelectOption,
  disabled = false,
  correctAnswer,
  isReview = false,
  col1Header,
  col2Header,
}: MatchFollowingMCQProps) {
  const { list_1 = [], list_2 = [], options = [] } = question;
  const h1 = col1Header || "List I";
  const h2 = col2Header || "List II";

  // Find the maximum length to iterate through rows
  const rowCount = Math.max(list_1.length, list_2.length);

  return (
    <div className="space-y-6">
      {/* Exam Style Table */}
      <div className="overflow-x-auto -mx-1 md:mx-0">
        <table className="w-full border-collapse border border-border-subtle dark:border-gray-700 text-sm md:text-base bg-bg-card transition-colors">
          <thead>
            <tr className="bg-bg-main dark:bg-gray-800/50 transition-colors">
              <th className="border border-border-subtle dark:border-gray-700 p-2 md:p-3 text-left font-bold text-text-primary w-12 md:w-16">#</th>
              <th className="border border-border-subtle dark:border-gray-700 p-2 md:p-3 text-left font-bold text-text-primary">{h1}</th>
              <th className="border border-border-subtle dark:border-gray-700 p-2 md:p-3 text-left font-bold text-text-primary w-12 md:w-16">#</th>
              <th className="border border-border-subtle dark:border-gray-700 p-2 md:p-3 text-left font-bold text-text-primary">{h2}</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }).map((_, idx) => (
              <tr key={idx} className="hover:bg-bg-main/50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="border border-border-subtle dark:border-gray-700 p-2 md:p-3 font-bold text-accent-main text-center bg-bg-main/30">
                  {String.fromCharCode(65 + idx)} {/* A, B, C, D */}
                </td>
                <td className="border border-border-subtle dark:border-gray-700 p-2 md:p-3 text-text-primary">
                  {list_1[idx] || ""}
                </td>
                <td className="border border-border-subtle dark:border-gray-700 p-2 md:p-3 font-bold text-teal-600 dark:text-teal-400 text-center bg-bg-main/30">
                  {romanize(idx + 1)} {/* i, ii, iii, iv */}
                </td>
                <td className="border border-border-subtle dark:border-gray-700 p-2 md:p-3 text-text-primary">
                  {list_2[idx] || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-6">
        {options.map((opt, idx) => {
          const isSelected = selectedOption === opt;
          const isCorrect = correctAnswer === opt;
          
          let borderClass = "border-border-subtle hover:border-text-secondary hover:bg-bg-main text-text-secondary hover:text-text-primary";
          let bgClass = "";
          
          if (isReview) {
            if (isCorrect) {
              borderClass = "border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-900 dark:text-teal-100";
            } else if (isSelected && !isCorrect) {
              borderClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100";
            } else {
              borderClass = "border-border-subtle opacity-50";
            }
          } else if (isSelected) {
            borderClass = "border-accent-main bg-teal-50 dark:bg-teal-900/20 shadow-sm shadow-teal-500/10 text-teal-900 dark:text-teal-100";
          }

          return (
            <button
              key={idx}
              onClick={() => !disabled && onSelectOption(opt)}
              disabled={disabled || isReview}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center space-x-3 ${borderClass} ${disabled && !isReview ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isReview ? (isCorrect ? "border-teal-500" : isSelected ? "border-red-500" : "border-border-subtle") : (isSelected ? "border-accent-main" : "border-border-subtle")
                }`}
              >
                {isReview ? (
                  isCorrect ? (
                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full" />
                  ) : isSelected ? (
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                  ) : null
                ) : (
                  isSelected && (
                    <div className="w-2.5 h-2.5 bg-accent-main rounded-full" />
                  )
                )}
              </div>
              <span className="text-sm md:text-base font-medium leading-relaxed">
                ({idx + 1}) {opt}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Helper to convert number to lowercase roman numerals
function romanize(num: number) {
  const lookup: Record<string, number> = {
    iv: 4,
    i: 1,
    v: 5,
    ix: 9,
    x: 10,
    xl: 40,
    l: 50,
    xc: 90,
    c: 100,
    cd: 400,
    d: 500,
    cm: 900,
    m: 1000,
  };
  let roman = "";
  const values = [
    { v: 10, s: "x" },
    { v: 9, s: "ix" },
    { v: 5, s: "v" },
    { v: 4, s: "iv" },
    { v: 1, s: "i" },
  ];
  let n = num;
  for (const { v, s } of values) {
    while (n >= v) {
      roman += s;
      n -= v;
    }
  }
  return roman;
}
