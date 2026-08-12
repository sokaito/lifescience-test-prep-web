"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getTestAttemptById, TestAttempt } from "@/lib/testEngine";
import { normalizeString, compareAnswers, parseColumnMatchQuestion } from "@/lib/utils";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target, 
  ArrowLeft,
  BarChart3,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import MatchFollowingMCQ from "@/components/MatchFollowingMCQ";
import TableMCQ from "@/components/TableMCQ";
import ReportIssueButton from "@/components/ReportIssueButton";
import StructuredExplanation from "@/components/StructuredExplanation";

export default function ResultClient({ testId }: { testId: string }) {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSolutions, setShowSolutions] = useState(false);

  useEffect(() => {
    async function loadResult() {
      if (!attemptId) {
        setLoading(false);
        return;
      }

      // Check local storage fallback for guests first to avoid unnecessary Firestore errors
      if (attemptId.startsWith("guest_")) {
        const localData = sessionStorage.getItem(`last_result_${attemptId}`);
        if (localData) {
          try {
            setAttempt(JSON.parse(localData));
            setLoading(false);
            return;
          } catch (e) {
            console.error("Failed to parse local guest result:", e);
          }
        }
      }

      const data = await getTestAttemptById(attemptId);
      setAttempt(data);
      setLoading(false);
    }
    loadResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-main">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-accent-main rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-text-primary">Calculating Results...</h2>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-main p-6 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-2 uppercase">Result Not Found</h2>
        <p className="text-text-secondary mb-8">We couldn't find the results for this attempt.</p>
        <Link href="/" className="px-8 py-4 bg-accent-main text-white font-bold rounded-xl shadow-lg">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const correctQuestions = attempt.questionsData?.filter(q => {
    const userAnswer = attempt.answers[q.id];
    return userAnswer !== undefined && userAnswer.toString().trim() !== "" && compareAnswers(userAnswer, q.correctAnswer);
  }) || [];

  const incorrectQuestions = attempt.questionsData?.filter(q => {
    const userAnswer = attempt.answers[q.id];
    return userAnswer === undefined || userAnswer.toString().trim() === "" || !compareAnswers(userAnswer, q.correctAnswer);
  }) || [];

  return (
    <div className="min-h-screen bg-bg-main pb-12 transition-colors">
      {/* Header */}
      <div className="bg-bg-card border-b border-border-subtle sticky top-0 z-10 transition-colors">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-text-secondary hover:text-text-primary font-bold text-sm uppercase tracking-wider transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <div className="text-sm font-black text-text-primary uppercase tracking-tighter">
            Test: {testId.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
        {/* Main Score Card */}
        <div className="bg-bg-card rounded-[2.5rem] border border-border-subtle p-8 md:p-12 shadow-sm text-center mb-8 relative overflow-hidden transition-colors">
            <div className="absolute top-0 left-0 w-full h-2 bg-accent-main opacity-20"></div>
            
            <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-50 dark:bg-teal-900/20 rounded-full mb-6 text-accent-main">
                <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-2 uppercase tracking-tighter">Exam Done!</h1>
            <p className="text-text-secondary font-bold uppercase tracking-widest text-sm mb-10">Detailed Performance Breakdown</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-bg-main rounded-3xl p-6 border border-border-subtle transition-colors">
                    <div className="text-[10px] text-text-secondary font-black uppercase tracking-widest mb-2">Final Score</div>
                    <div className="text-4xl font-black text-text-primary">{attempt.score}<span className="text-lg text-text-secondary opacity-50 ml-1">/{attempt.totalQuestions}</span></div>
                </div>
                <div className="bg-bg-main rounded-3xl p-6 border border-border-subtle transition-colors">
                    <div className="text-[10px] text-text-secondary font-black uppercase tracking-widest mb-2">Accuracy</div>
                    <div className={`text-4xl font-black ${attempt.accuracy >= 70 ? 'text-teal-500' : attempt.accuracy >= 40 ? 'text-orange-500' : 'text-red-500'}`}>{attempt.accuracy}%</div>
                </div>
                <div className="bg-bg-main rounded-3xl p-6 border border-border-subtle transition-colors">
                    <div className="text-[10px] text-text-secondary font-black uppercase tracking-widest mb-2">Time Taken</div>
                    <div className="text-4xl font-black text-text-primary">{formatTime(attempt.timeTaken)}</div>
                </div>
            </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-bg-card rounded-3xl border border-border-subtle p-8 transition-colors">
                <h3 className="font-black text-text-primary uppercase tracking-tight mb-6 flex items-center space-x-2">
                    <Target className="w-5 h-5 text-accent-main" />
                    <span>Response Analysis</span>
                </h3>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-bg-main rounded-2xl border border-border-subtle">
                        <div className="flex items-center space-x-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-sm shadow-teal-500/50"></div>
                            <span className="text-sm font-bold text-text-secondary uppercase">Correct (+1 ea.)</span>
                        </div>
                        <span className="font-black text-teal-600 dark:text-teal-400">{attempt.correctCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-bg-main rounded-2xl border border-border-subtle">
                        <div className="flex items-center space-x-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></div>
                            <span className="text-sm font-bold text-text-secondary uppercase">Incorrect (-0.5 ea.)</span>
                        </div>
                        <span className="font-black text-red-600 dark:text-red-400">-{attempt.incorrectCount * 0.5}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-bg-main/50 rounded-2xl border border-border-subtle opacity-60">
                        <div className="flex items-center space-x-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                            <span className="text-sm font-bold text-text-secondary uppercase">Unattempted</span>
                        </div>
                        <span className="font-black text-text-primary">{attempt.unattemptedCount}</span>
                    </div>
                </div>
            </div>

            <div className="bg-bg-card rounded-3xl border border-border-subtle p-8 transition-colors flex flex-col justify-center text-center">
                <div className="mb-6">
                    <p className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-1">Performance Rank</p>
                    <div className={`text-5xl font-black uppercase tracking-tighter ${
                      attempt.accuracy >= 90 ? 'text-teal-500' :
                      attempt.accuracy >= 75 ? 'text-blue-500' :
                      attempt.accuracy >= 50 ? 'text-orange-500' :
                      'text-red-500'
                    }`}>
                      {attempt.accuracy >= 90 ? 'Elite' :
                       attempt.accuracy >= 75 ? 'Excellent' :
                       attempt.accuracy >= 50 ? 'Good' :
                       'Needs Work'}
                    </div>
                    <p className="text-xs text-text-secondary mt-2 font-bold uppercase opacity-60">
                      {attempt.accuracy >= 90 ? 'Top 1% Achievement' :
                       attempt.accuracy >= 75 ? 'Top 10% Achievement' :
                       attempt.accuracy >= 50 ? 'Above Average' :
                       'Keep Practicing'}
                    </p>
                </div>
                <Link href="/analytics" className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-bg-main hover:bg-bg-card border border-border-subtle rounded-xl font-bold text-text-primary transition-all">
                    <BarChart3 className="w-4 h-4" />
                    <span>View Your Progress</span>
                </Link>
            </div>
        </div>

        {/* Solution Toggle Button */}
        {attempt.questionsData && attempt.questionsData.length > 0 && (
          <div className="flex justify-center mb-12">
            <button 
              onClick={() => setShowSolutions(!showSolutions)}
              className="group flex items-center space-x-3 px-8 py-4 bg-bg-card hover:bg-bg-main border-2 border-accent-main/20 hover:border-accent-main rounded-2xl font-black text-accent-main tracking-widest uppercase transition-all shadow-sm hover:shadow-md"
            >
              <BookOpen className="w-5 h-5" />
              <span>{showSolutions ? "Hide Solutions" : "View Solutions"}</span>
            </button>
          </div>
        )}

        {/* Detailed Review Section */}
        {showSolutions && attempt.questionsData && attempt.questionsData.length > 0 && (
          <div className="space-y-12 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Incorrect & Unattempted Answers */}
            {incorrectQuestions.length > 0 && (
              <div>
                <h3 className="font-black text-red-500 uppercase tracking-tight mb-6 flex items-center space-x-2">
                  <XCircle className="w-6 h-6" />
                  <span>Areas for Improvement ({incorrectQuestions.length})</span>
                </h3>
                <div className="space-y-6">
                  {incorrectQuestions.map((q, idx) => {
                    const userAnswer = attempt.answers[q.id];
                    const isUnattempted = userAnswer === undefined || userAnswer.toString().trim() === "";
                    
                    return (
                      <div key={q.id} className="rounded-3xl border p-6 md:p-8 shadow-sm transition-all duration-300 bg-red-50/50 dark:bg-red-900/5 border-red-100 dark:border-red-900/20">
                        {(() => {
                          const parsedColumnMatch = parseColumnMatchQuestion(q.question);
                          return (
                            <>
                              <div className="flex items-start space-x-4 mb-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors bg-red-500 text-white">
                                  {idx + 1}
                                </span>
                                <h4 
                                  className="text-lg md:text-xl font-bold text-text-primary leading-snug w-full"
                                  dangerouslySetInnerHTML={{ __html: parsedColumnMatch ? parsedColumnMatch.preamble : q.question }}
                                />
                              </div>

                              <div className="space-y-3 md:pl-12">
                                {(() => {
                                  if (q.type === "match_following_mcq") {
                                    return (
                                      <div className="mt-4">
                                        <MatchFollowingMCQ
                                          question={q}
                                          selectedOption={userAnswer}
                                          onSelectOption={() => {}}
                                          isReview={true}
                                          correctAnswer={q.correctAnswer}
                                        />
                                      </div>
                                    );
                                  }
                                  if (parsedColumnMatch) {
                                    return (
                                      <div className="mt-4">
                                        <MatchFollowingMCQ
                                          question={{
                                            ...q,
                                            list_1: parsedColumnMatch.list_1,
                                            list_2: parsedColumnMatch.list_2,
                                          }}
                                          selectedOption={userAnswer}
                                          onSelectOption={() => {}}
                                          isReview={true}
                                          correctAnswer={q.correctAnswer}
                                          col1Header="Column I"
                                          col2Header="Column II"
                                        />
                                      </div>
                                    );
                                  }
                                  if (q.type === "table_mcq") {
                                    return (
                                      <div className="mt-4">
                                        <TableMCQ
                                          question={q as any}
                                          selectedOption={userAnswer}
                                          onSelectOption={() => {}}
                                          isReview={true}
                                          correctAnswer={q.correctAnswer}
                                          disabled={true}
                                        />
                                      </div>
                                    );
                                  }
                                  return (
                                    <>
                                      <div className="p-4 rounded-xl bg-bg-card/50 backdrop-blur-sm border border-red-500/10">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Your Answer</div>
                                        <div className="flex items-start space-x-2">
                                          {!isUnattempted && <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                                          <span className={`font-bold ${isUnattempted ? 'text-text-secondary opacity-60' : 'text-red-600 dark:text-red-400'}`}>
                                            {isUnattempted ? "Not Attempted" : userAnswer}
                                          </span>
                                        </div>
                                      </div>

                                      {q.correctAnswer && (
                                        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                                          <div className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-500 mb-1">Correct Answer</div>
                                          <div className="flex items-start space-x-2">
                                            <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                                            <span className="font-bold text-teal-700 dark:text-teal-400">{q.correctAnswer}</span>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}

                                {q.explanation && (
                                  <div className="p-5 mt-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                    <StructuredExplanation explanation={q.explanation} />
                                  </div>
                                )}

                                <ReportIssueButton
                                  questionId={q.id}
                                  questionNumber={idx + 1}
                                  examName={testId}
                                  year={null}
                                  questionText={q.question}
                                  correctAnswer={q.correctAnswer || ""}
                                  sourceType={
                                    testId.startsWith("dq") ? "daily" :
                                    testId.startsWith("wr") ? "weekly" :
                                    testId.startsWith("fm") ? "mock" :
                                    "practice"
                                  }
                                />
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Correct Answers */}
            {correctQuestions.length > 0 && (
              <div>
                <h3 className="font-black text-teal-500 uppercase tracking-tight mb-6 flex items-center space-x-2">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Correct Answers ({correctQuestions.length})</span>
                </h3>
                <div className="space-y-6">
                  {correctQuestions.map((q, idx) => (
                    <div key={q.id} className="rounded-3xl border p-6 md:p-8 shadow-sm transition-all duration-300 bg-teal-50/50 dark:bg-teal-900/5 border-teal-100 dark:border-teal-900/20">
                      {(() => {
                        const parsedColumnMatch = parseColumnMatchQuestion(q.question);
                        return (
                          <>
                            <div className="flex items-start space-x-4 mb-4">
                              <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors bg-teal-500 text-white">
                                {idx + 1}
                              </span>
                              <h4 
                                className="text-lg md:text-xl font-bold text-text-primary leading-snug w-full"
                                dangerouslySetInnerHTML={{ __html: parsedColumnMatch ? parsedColumnMatch.preamble : q.question }}
                              />
                            </div>

                            <div className="md:pl-12">
                              {(() => {
                                if (q.type === "match_following_mcq") {
                                  return (
                                    <div className="mt-4">
                                      <MatchFollowingMCQ
                                        question={q}
                                        selectedOption={attempt.answers[q.id]}
                                        onSelectOption={() => {}}
                                        isReview={true}
                                        correctAnswer={q.correctAnswer}
                                      />
                                    </div>
                                  );
                                }
                                if (parsedColumnMatch) {
                                  return (
                                    <div className="mt-4">
                                      <MatchFollowingMCQ
                                        question={{
                                          ...q,
                                          list_1: parsedColumnMatch.list_1,
                                          list_2: parsedColumnMatch.list_2,
                                        }}
                                        selectedOption={attempt.answers[q.id]}
                                        onSelectOption={() => {}}
                                        isReview={true}
                                        correctAnswer={q.correctAnswer}
                                        col1Header="Column I"
                                        col2Header="Column II"
                                      />
                                    </div>
                                  );
                                }
                                if (q.type === "table_mcq") {
                                  return (
                                    <div className="mt-4">
                                      <TableMCQ
                                        question={q as any}
                                        selectedOption={attempt.answers[q.id]}
                                        onSelectOption={() => {}}
                                        isReview={true}
                                        correctAnswer={q.correctAnswer}
                                        disabled={true}
                                      />
                                    </div>
                                  );
                                }
                                return (
                                  <div className="p-4 rounded-xl bg-bg-card/50 backdrop-blur-sm border border-teal-500/10">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-500 mb-1">Correct Answer</div>
                                    <div className="flex items-start space-x-2">
                                      <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                                      <span className="font-bold text-teal-700 dark:text-teal-400">{q.correctAnswer}</span>
                                    </div>
                                  </div>
                                );
                              })()}

                              <ReportIssueButton
                                questionId={q.id}
                                questionNumber={idx + 1}
                                examName={testId}
                                year={null}
                                questionText={q.question}
                                correctAnswer={q.correctAnswer || ""}
                                sourceType={
                                  testId.startsWith("dq") ? "daily" :
                                  testId.startsWith("wr") ? "weekly" :
                                  testId.startsWith("fm") ? "mock" :
                                  "practice"
                                }
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/test-series" className="w-full sm:flex-1 py-5 bg-text-primary text-bg-card font-black rounded-2xl text-center uppercase tracking-widest hover:opacity-90 transition-opacity">
                Try Another Test
            </Link>
            <Link href="/" className="w-full sm:flex-1 py-5 bg-bg-card border border-border-subtle text-text-primary font-black rounded-2xl text-center uppercase tracking-widest hover:bg-bg-main transition-colors">
                Back to Dashboard
            </Link>
        </div>
      </div>
    </div>
  );
}
