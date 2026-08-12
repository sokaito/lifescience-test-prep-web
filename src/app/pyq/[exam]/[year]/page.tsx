"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2, List, FileText } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import MatchFollowingMCQ from "@/components/MatchFollowingMCQ";
import TableMCQ from "@/components/TableMCQ";
import ReportIssueButton from "@/components/ReportIssueButton";
import StructuredExplanation from "@/components/StructuredExplanation";
import { shuffleArray, compareAnswers, parseColumnMatchQuestion } from "@/lib/utils";

interface PYQQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  type?: string;
  list_1?: string[];
  list_2?: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
  section?: string;
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

export default function PYQTestEngine() {
  const params = useParams();
  const router = useRouter();
  const exam = params.exam as string;
  const year = params.year as string;

  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [showJumpGrid, setShowJumpGrid] = useState(false);

  const [activeSection, setActiveSection] = useState<string>("");
  const [sections, setSections] = useState<string[]>([]);

  const storageKey = `pyq_${exam}_${year}_progress`;

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/repository/pyq/${exam}/${year}.json`);
        if (!res.ok) throw new Error("Failed to load paper");
        const data = await res.json();
        
        // Shuffle options for each question
        const shuffledQuestions = data.map((q: PYQQuestion) => ({
          ...q,
          options: shuffleArray(q.options || [])
        }));
        
        setQuestions(shuffledQuestions);

        // Identify available sections
        const sectionsInQuestions = Array.from(
          new Set(shuffledQuestions.map((q: any) => q.section).filter(Boolean))
        ) as string[];
        
        const isCsirNet = exam === "csir_net";
        const finalSections = isCsirNet ? ["A", "B", "C"] : sectionsInQuestions.sort();
        setSections(finalSections);
        
        const defaultSection = finalSections.length > 0 ? finalSections[0] : "";
        let restoredSection = defaultSection;
        let restoredIndex = 0;
        
        // Restore progress
        const savedProgress = localStorage.getItem(storageKey);
        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);
            if (parsed.activeSection !== undefined) {
              restoredSection = parsed.activeSection;
              restoredIndex = parsed.lastIndex || 0;
            } else if (parsed.lastIndex !== undefined && parsed.lastIndex < shuffledQuestions.length) {
              const q = shuffledQuestions[parsed.lastIndex];
              if (q) {
                restoredSection = q.section || defaultSection;
                const secQuestions = shuffledQuestions.filter(
                  (item: any) => (item.section || defaultSection) === restoredSection
                );
                const idx = secQuestions.findIndex((item: any) => item.id === q.id);
                restoredIndex = idx !== -1 ? idx : 0;
              }
            }
            if (parsed.answers) {
              setSelectedOptions(parsed.answers);
              // Auto show explanation for already answered
              const explanations: Record<number, boolean> = {};
              Object.keys(parsed.answers).forEach(k => {
                explanations[parseInt(k)] = true;
              });
              setShowExplanation(explanations);
            }
          } catch (e) {
            console.error("Error parsing saved progress:", e);
          }
        }
        
        setActiveSection(restoredSection);
        setCurrentIndex(restoredIndex);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [exam, year, storageKey]);

  // Persist progress when index, activeSection, or answers change
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify({
        activeSection,
        lastIndex: currentIndex,
        answers: selectedOptions
      }));
    }
  }, [currentIndex, activeSection, selectedOptions, questions.length, storageKey]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-accent-main animate-spin mb-4" />
        <p className="text-text-secondary font-bold uppercase tracking-widest text-sm">Loading Paper...</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-12 text-center">
        <div className="bg-bg-card p-12 rounded-[2rem] border border-border-subtle shadow-sm max-w-2xl mx-auto">
          <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-2">Paper Not Found</h2>
          <p className="text-text-secondary mb-8">{error || "This paper has no questions."}</p>
          <button onClick={() => router.back()} className="px-8 py-3 bg-bg-main text-text-primary rounded-xl font-bold uppercase tracking-widest border border-border-subtle hover:bg-bg-card transition-all">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const filteredQuestions = sections.length > 0
    ? questions.filter(q => (q.section || "A") === activeSection)
    : questions;

  const question = filteredQuestions[currentIndex];
  const isAnswered = question ? showExplanation[question.id] : false;
  const userChoice = question ? selectedOptions[question.id] : undefined;
  const isCorrect = question ? compareAnswers(userChoice, question.correct_answer) : false;

  const handleOptionSelect = (option: string) => {
    if (!question || isAnswered) return; // Prevent changing answer
    
    setSelectedOptions(prev => ({ ...prev, [question.id]: option }));
    setShowExplanation(prev => ({ ...prev, [question.id]: true }));
  };

  const goNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSectionChange = (sec: string) => {
    setActiveSection(sec);
    setCurrentIndex(0);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-bg-card p-4 rounded-2xl border border-border-subtle shadow-sm">
        <div className="flex items-center space-x-3">
          <Link href={`/pyq/${exam}`} className="p-2 bg-bg-main rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-sm md:text-base font-black text-text-primary uppercase tracking-widest">
              {exam.replace('_', ' ')} <span className="text-accent-main">{formatYearName(year)}</span>
            </h1>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
              {sections.length > 0 ? `Section ${activeSection} • ` : ''}Question {filteredQuestions.length > 0 ? currentIndex + 1 : 0} of {filteredQuestions.length}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowJumpGrid(!showJumpGrid)}
            className={`p-2 rounded-xl border transition-all ${showJumpGrid ? 'bg-accent-main text-white border-accent-main' : 'bg-bg-main text-text-secondary border-border-subtle hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title="Jump to question"
            disabled={filteredQuestions.length === 0}
          >
            <List className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              if (confirm("Reset all progress for this paper?")) {
                localStorage.removeItem(storageKey);
                window.location.reload();
              }
            }}
            className="px-3 py-1.5 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      {sections.length > 0 && (
        <div className="flex space-x-2 p-1.5 bg-bg-card rounded-2xl border border-border-subtle shadow-sm max-w-md">
          {sections.map((sec) => {
            const isActive = sec === activeSection;
            return (
              <button
                key={sec}
                onClick={() => handleSectionChange(sec)}
                className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-accent-main text-white shadow-md"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-main"
                }`}
              >
                Section {sec}
              </button>
            );
          })}
        </div>
      )}

      {/* Progress Bar */}
      {filteredQuestions.length > 0 && (
        <div className="space-y-2">
          <div className="w-full bg-bg-card border border-border-subtle h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-main transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%` }}
            />
          </div>
          
          {/* Jump Grid Section */}
          {showJumpGrid && (
            <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-3">
                <h3 className="font-black text-text-primary uppercase tracking-tight text-sm">Question Navigator</h3>
                <div className="flex items-center space-x-4 text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>Correct</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span>Wrong</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-accent-main"></div>
                    <span>Current</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredQuestions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = showExplanation[q.id];
                  const userChoice = selectedOptions[q.id];
                  const isCorrect = compareAnswers(userChoice, q.correct_answer);

                  let stateClasses = "bg-bg-main border-border-subtle text-text-secondary hover:border-accent-main";
                  if (isCurrent) stateClasses = "bg-accent-main text-white border-accent-main shadow-md ring-2 ring-accent-main ring-offset-2 dark:ring-offset-bg-main";
                  else if (isAnswered) {
                    stateClasses = isCorrect 
                      ? "bg-emerald-500 text-white border-emerald-500" 
                      : "bg-rose-500 text-white border-rose-500";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowJumpGrid(false);
                      }}
                      className={`aspect-square flex items-center justify-center rounded-lg border text-xs font-black transition-all ${stateClasses}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-bg-card p-12 rounded-[2rem] border border-border-subtle text-center shadow-sm">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4 animate-pulse" />
          <h3 className="text-xl font-black text-text-primary uppercase tracking-tight mb-2">No Questions Available</h3>
          <p className="text-text-secondary font-medium">
            We are currently adding questions for Section {activeSection}. Check back soon!
          </p>
        </div>
      ) : (
        <>
          {/* Question Card */}
          <div className="bg-bg-card rounded-[2rem] border border-border-subtle shadow-lg overflow-hidden">
            <div className="p-6 md:p-8 border-b border-border-subtle bg-bg-main/50">
              {(() => {
                const parsedColumnMatch = parseColumnMatchQuestion(question.question);
                return (
                  <div className="flex items-start space-x-4">
                    <div className="shrink-0 w-10 h-10 bg-accent-main text-white rounded-full flex items-center justify-center font-black text-lg shadow-inner">
                      {question.id}
                    </div>
                    <div 
                      className="text-lg md:text-xl font-bold text-text-primary leading-relaxed mt-1 w-full"
                      dangerouslySetInnerHTML={{ __html: parsedColumnMatch ? parsedColumnMatch.preamble : question.question }}
                    />
                  </div>
                );
              })()}
            </div>

            <div className="p-6 md:p-8 space-y-4">
              {(() => {
                const parsedColumnMatch = parseColumnMatchQuestion(question.question);
                if ((question as any).type === "match_following_mcq") {
                  return (
                    <MatchFollowingMCQ
                      question={{
                        ...question,
                        id: question.id.toString(),
                        correctAnswer: question.correct_answer
                      } as any}
                      selectedOption={userChoice}
                      onSelectOption={handleOptionSelect}
                      disabled={isAnswered}
                      isReview={isAnswered}
                      correctAnswer={question.correct_answer}
                    />
                  );
                }
                if (parsedColumnMatch) {
                  return (
                    <MatchFollowingMCQ
                      question={{
                        ...question,
                        id: question.id.toString(),
                        list_1: parsedColumnMatch.list_1,
                        list_2: parsedColumnMatch.list_2,
                        correctAnswer: question.correct_answer
                      } as any}
                      selectedOption={userChoice}
                      onSelectOption={handleOptionSelect}
                      disabled={isAnswered}
                      isReview={isAnswered}
                      correctAnswer={question.correct_answer}
                      col1Header="Column I"
                      col2Header="Column II"
                    />
                  );
                }
                if ((question as any).type === "table_mcq") {
                  return (
                    <TableMCQ
                      question={{
                        ...question,
                        id: question.id.toString(),
                      } as any}
                      selectedOption={userChoice}
                      onSelectOption={handleOptionSelect}
                      disabled={isAnswered}
                      isReview={isAnswered}
                      correctAnswer={question.correct_answer}
                    />
                  );
                }
                if (!question.options || question.options.length === 0) {
                  return (
                    <div className="space-y-4">
                      <div className="p-1.5 rounded-2xl border-2 border-border-subtle bg-bg-main focus-within:border-accent-main transition-all shadow-sm">
                        <input
                          type="text"
                          value={selectedOptions[question.id] || ""}
                          disabled={isAnswered}
                          onChange={(e) => {
                            if (!isAnswered) {
                              setSelectedOptions(prev => ({ ...prev, [question.id]: e.target.value }));
                            }
                          }}
                          placeholder={question.correct_answer === "*" ? "Type your descriptive answer / notes here..." : "Type your numeric answer here..."}
                          className="w-full px-5 py-4 bg-transparent text-text-primary text-lg font-bold placeholder-text-secondary/50 focus:outline-none"
                        />
                      </div>
                      {!isAnswered && (
                        <button
                          onClick={() => {
                            const val = selectedOptions[question.id] || "";
                            if (val.trim() !== "") {
                              handleOptionSelect(val);
                            }
                          }}
                          disabled={!(selectedOptions[question.id] || "").trim()}
                          className="px-6 py-3 bg-accent-main hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl uppercase tracking-widest text-xs transition-opacity shadow-md shadow-teal-500/20"
                        >
                          Check Answer
                        </button>
                      )}
                      {isAnswered && (
                        <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/50 text-rose-700 dark:text-rose-400'} font-bold flex items-center space-x-3`}>
                          {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-rose-500" />}
                          <span>{isCorrect ? "Correct!" : "Incorrect"}</span>
                        </div>
                      )}
                      {isAnswered && question.correct_answer && (
                        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                          <div className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-500 mb-1">Correct Answer</div>
                          <div className="flex items-start space-x-2">
                            <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                            <span className="font-bold text-teal-700 dark:text-teal-400">{question.correct_answer}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div className="space-y-3 md:space-y-4">
                    {question.options.map((option, idx) => {
                      const isSelected = userChoice === option;
                      const isActualCorrect = compareAnswers(option, question.correct_answer);
                      
                      let btnStateClasses = "bg-bg-main border-border-subtle hover:border-accent-main text-text-primary";
                      
                      if (isAnswered) {
                        if (isActualCorrect) {
                          btnStateClasses = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold";
                        } else if (isSelected) {
                          btnStateClasses = "bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-700 dark:text-rose-400 font-bold";
                        } else {
                          btnStateClasses = "bg-bg-main border-border-subtle opacity-50";
                        }
                      } else if (isSelected) {
                        btnStateClasses = "bg-teal-50 dark:bg-teal-900/20 border-accent-main text-accent-main font-bold";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleOptionSelect(option)}
                          disabled={isAnswered}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${btnStateClasses} ${!isAnswered && 'hover:-translate-y-0.5 shadow-sm hover:shadow-md'}`}
                        >
                          <span className="flex-1" dangerouslySetInnerHTML={{ __html: option }} />
                          {isAnswered && isActualCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-2 shrink-0" />}
                          {isAnswered && isSelected && !isActualCorrect && <XCircle className="w-5 h-5 text-rose-500 ml-2 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <ReportIssueButton
              questionId={`${exam}_${year}_${question.id}`}
              questionNumber={currentIndex + 1}
              examName={exam}
              year={year}
              questionText={question.question}
              correctAnswer={question.correct_answer}
              sourceType="pyq"
            />
          </div>

          {/* Explanation Area */}
          {isAnswered && (
            <div className={`p-6 rounded-[2rem] border-2 animate-in slide-in-from-bottom-4 duration-300 ${isCorrect ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/50' : 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/50'}`}>
              <div className="flex items-center space-x-2 mb-3">
                {isCorrect ? (
                  <><CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /><h3 className="font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest text-sm">Correct!</h3></>
                ) : (
                  <><XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" /><h3 className="font-black text-rose-800 dark:text-rose-300 uppercase tracking-widest text-sm">Incorrect</h3></>
                )}
              </div>
              <div className="text-text-primary font-medium text-sm md:text-base leading-relaxed opacity-90 w-full">
                <StructuredExplanation explanation={question.explanation} />
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
            <button
              onClick={goBack}
              disabled={currentIndex === 0}
              className="flex items-center px-6 py-3 bg-bg-card border border-border-subtle rounded-xl font-bold uppercase tracking-widest text-xs disabled:opacity-50 hover:bg-bg-main transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </button>
            
            <button
              onClick={goNext}
              disabled={currentIndex === filteredQuestions.length - 1}
              className="flex items-center px-6 py-3 bg-text-primary text-bg-card rounded-xl font-black uppercase tracking-widest text-xs disabled:opacity-50 hover:opacity-90 transition-opacity shadow-md"
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
