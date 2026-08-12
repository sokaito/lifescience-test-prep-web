import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface TableMCQProps {
  question: {
    id: string;
    question: string;
    options: string[];
    table?: {
      headers: string[];
      rows: string[][];
    };
  };
  selectedOption?: string;
  onSelectOption: (option: string) => void;
  isReview?: boolean;
  correctAnswer?: string;
  disabled?: boolean;
}

const TableMCQ: React.FC<TableMCQProps> = ({
  question,
  selectedOption,
  onSelectOption,
  isReview = false,
  correctAnswer,
  disabled = false,
}) => {
  const { table, options = [] } = question;

  if (!table) return null;

  return (
    <div className="w-full space-y-6">
      {/* Scrollable Table Container */}
      <div className="overflow-x-auto rounded-xl border border-border-subtle shadow-sm bg-bg-card">
        <table className="w-full border-collapse text-sm md:text-base">
          <thead>
            <tr className="bg-bg-main border-b border-border-subtle">
              {table.headers.map((header, idx) => (
                <th 
                  key={idx} 
                  className={`p-3 md:p-4 text-left font-black text-text-primary uppercase tracking-wider border-r border-border-subtle last:border-r-0`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIdx) => (
              <tr 
                key={rowIdx} 
                className={`border-b border-border-subtle last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}
              >
                {row.map((cell, cellIdx) => (
                  <td 
                    key={cellIdx} 
                    className={`p-3 md:p-4 text-text-secondary font-medium border-r border-border-subtle last:border-r-0`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-6">
        {options.map((opt, idx) => {
          const isSelected = selectedOption === opt;
          const isCorrect = isReview && opt === correctAnswer;
          const isWrong = isReview && isSelected && opt !== correctAnswer;

          let borderClass = "border-border-subtle";
          let bgClass = "bg-bg-card hover:border-text-secondary";
          let textClass = "text-text-secondary";

          if (isReview) {
            if (isCorrect) {
              borderClass = "border-emerald-500 shadow-sm shadow-emerald-500/10";
              bgClass = "bg-emerald-50 dark:bg-emerald-900/20";
              textClass = "text-emerald-700 dark:text-emerald-400";
            } else if (isWrong) {
              borderClass = "border-rose-500 shadow-sm shadow-rose-500/10";
              bgClass = "bg-rose-50 dark:bg-rose-900/20";
              textClass = "text-rose-700 dark:text-rose-400";
            } else {
              bgClass = "bg-bg-card opacity-50";
            }
          } else if (isSelected) {
            borderClass = "border-accent-main ring-2 ring-accent-main/20";
            bgClass = "bg-teal-50 dark:bg-teal-900/20";
            textClass = "text-accent-main font-bold";
          }

          return (
            <button
              key={idx}
              onClick={() => !disabled && onSelectOption(opt)}
              disabled={disabled || isReview}
              className={`w-full text-left p-4 md:p-5 rounded-xl md:rounded-2xl border-2 transition-all flex items-center justify-between ${borderClass} ${bgClass} ${textClass}`}
            >
              <span className="text-sm md:text-base leading-relaxed flex-1">
                {opt}
              </span>
              
              {isReview && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 ml-2" />
              )}
              {isReview && isWrong && (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 ml-2" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TableMCQ;
