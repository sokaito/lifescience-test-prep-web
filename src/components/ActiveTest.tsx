"use client";

import { useState, useEffect } from "react";
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MatchFollowingMCQ from "./MatchFollowingMCQ";
import TableMCQ from "./TableMCQ";
import ReportIssueButton from "./ReportIssueButton";

import { useAuth } from "@/lib/AuthContext";
import { generateRandomTest, submitTestAttempt, saveTestProgress, getTestProgress, Question } from "@/lib/testEngine";
import { normalizeString, compareAnswers, parseColumnMatchQuestion } from "@/lib/utils";

export default function ActiveTest({ testId }: { testId: string }) {
  const { user, isGuest } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // Default 60 mins
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [score, setScore] = useState(0);
  const [initialTime, setInitialTime] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchQuestions() {
      if (user === undefined) return; // Wait for auth to initialize
      
      try {
        const userId = user?.email || user?.uid || "guest";

        // Check for existing progress
        if (userId !== "guest") {
          const queryIds = [user?.email, user?.uid].filter(Boolean) as string[];
          const progress = await getTestProgress(queryIds, testId);
          if (progress) {
            setQuestions(progress.questions);
            setAnswers(progress.answers || {});
            setCurrentQIndex(progress.currentQIndex || 0);
            setTimeLeft(progress.timeLeft || 3600);
            setLoading(false);
            return;
          }
        }

        let qBank: Question[] = [];
        let parsedTimeLimit = 3600; // default 60 mins
        
        // Check if this is a random procedural test
        if (testId.startsWith('random-')) {
          if (testId.startsWith('random-unit-') || testId.startsWith('unit-')) {
            // It's a unit test (e.g., random-unit-5 or unit-5)
            const unitId = parseInt(testId.replace('random-unit-', '').replace('unit-', ''));
            const count = 50; // Standardize unit tests to 50 questions
            qBank = await generateRandomTest(userId, count, unitId);
            parsedTimeLimit = 60 * 60; // 60 mins for 50 questions
          } else {
            // It's a general random test (e.g., random-10)
            const count = parseInt(testId.replace('random-', ''));
            qBank = await generateRandomTest(userId, count);
            
            // Adjust time dynamically based on selected length
            if (count === 10) parsedTimeLimit = 15 * 60;
            else if (count === 50) parsedTimeLimit = 60 * 60;
            else if (count === 150) parsedTimeLimit = 180 * 60;
          }
        } 
        // Standard Tests
        else if (testId.startsWith("dq")) {
          qBank = await generateRandomTest(userId, 10);
          parsedTimeLimit = 15 * 60;
        } else if (testId.startsWith("wr")) {
          qBank = await generateRandomTest(userId, 50);
          parsedTimeLimit = 60 * 60;
        } else if (testId.startsWith("fm")) {
          qBank = await generateRandomTest(userId, 150);
          parsedTimeLimit = 180 * 60;
        } else {
          qBank = await generateRandomTest(userId, 50);
          parsedTimeLimit = 60 * 60;
        }

        if (qBank.length === 0) {
           throw new Error("No questions available for this test configuration.");
        }

        setQuestions(qBank);
        setTimeLeft(parsedTimeLimit);
        setInitialTime(parsedTimeLimit);
        setLoading(false);
      } catch (err: any) {
        console.error("Test Generation Error:", err);
        let errorMsg = "Failed to load test questions.";
        
        if (err.message?.includes("permission")) {
          errorMsg = "Database Permission Error: Please ensure Firestore rules are published and try signing out/in.";
        } else if (err.message?.includes("index")) {
          errorMsg = "Database Index Error: This query requires a new index in Firebase Console.";
        } else if (err.message) {
          errorMsg = err.message;
        }

        setError(errorMsg);
        setLoading(false);
      }
    }
    
    fetchQuestions();
  }, [testId, user]);

  // Timer logic
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0 || loading) {
      if (timeLeft <= 0 && !isSubmitted && !loading && !isSubmitting) {
        handleSubmit(true);
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, loading, isSubmitting]);

  // Auto-save progress
  useEffect(() => {
    if (loading || isSubmitted || !user || user.uid === "guest" || questions.length === 0) return;
    
    // Use a small timeout to debounce saving slightly
    const saveTimeout = setTimeout(() => {
      saveTestProgress(user.uid, testId, {
        testTitle: testId.toUpperCase(),
        questions,
        answers,
        currentQIndex,
        timeLeft
      });
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [answers, currentQIndex]); // We trigger save on answer change or question change

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optString: string) => {
    if (isSubmitted) return;
    setAnswers({ ...answers, [questions[currentQIndex].id]: optString });
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if ((!user && !isGuest) || isSubmitting || isSubmitted) return;
    
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      // Calculate score locally for immediate UI feedback
      let localScore = 0;
      questions.forEach(q => {
        const userAnswer = answers[q.id];
        if (userAnswer !== undefined && userAnswer !== "") {
          if (compareAnswers(userAnswer, q.correctAnswer)) {
            localScore += 1;
          } else {
            localScore -= 0.5;
          }
        }
      });
      setScore(localScore);

      const timeTaken = initialTime - timeLeft;
      const attemptId = await submitTestAttempt(
        user?.uid || "guest", 
        questions, 
        answers, 
        testId,
        timeTaken
      );
      
      setIsSubmitted(true);
      // Small delay to show completion state or redirect
      setTimeout(() => {
        router.push(`/exam/${testId}/result?attemptId=${attemptId}`);
      }, 1500);
    } catch (err) {
      console.error("Submission failed:", err);
      setIsSubmitting(false);
      alert("Failed to submit test. Please try again.");
    }
  };

  const attemptedCount = Object.keys(answers).length;
  const unattemptedCount = questions.length - attemptedCount;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-accent-main rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-text-primary">Generating Test...</h2>
        <p className="text-text-secondary">Retrieving secure questions over network.</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 text-center max-w-lg transition-colors">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Error Generating Test</h2>
          <p className="text-red-600 dark:text-red-300 mb-6">{error || "No questions found."}</p>
          <Link href="/test-series" className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors">
            Return to Library
          </Link>
        </div>
      </div>
    );
  }

  const q = questions[currentQIndex];

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-bg-card p-10 rounded-3xl shadow-lg border border-border-subtle text-center max-w-md w-full transition-colors">
          <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-accent-main" />
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">Exam Complete</h2>
          <p className="text-text-secondary mb-8">Your attempt has been saved to your profile.</p>
          
          <div className="bg-bg-main rounded-2xl p-6 mb-8 border border-border-subtle transition-colors">
            <div className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-1">Your Score</div>
            <div className="text-4xl font-bold text-accent-main">{score} <span className="text-xl text-text-secondary">/ {questions.length}</span></div>
          </div>
          
          <Link href="/" className="block w-full py-4 rounded-xl bg-text-primary text-bg-card font-bold text-center hover:opacity-90 transition-opacity">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 px-4 md:px-0">
      {/* Test Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8 bg-bg-card p-4 md:p-5 rounded-2xl shadow-sm border border-border-subtle sticky top-4 z-10 transition-colors">
        <h1 className="text-lg md:text-xl font-bold text-text-primary truncate">Test: {testId.toUpperCase()}</h1>
        <div className="flex items-center justify-between sm:justify-end space-x-4 md:space-x-6 shrink-0">
          <div className={`flex items-center space-x-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold font-mono text-base md:text-lg border transition-colors ${timeLeft < 300 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 animate-pulse' : 'bg-bg-main text-text-primary border-border-subtle'}`}>
            <Clock className="w-4 h-4 md:w-5 md:h-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <button 
            onClick={() => setShowConfirmModal(true)} 
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-4 md:px-6 py-1.5 md:py-2 bg-accent-main hover:opacity-90 text-white font-bold rounded-lg text-sm md:text-base transition-colors shadow-sm shadow-teal-500/30 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit</span>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-card w-full max-w-sm rounded-3xl p-8 border border-border-subtle shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-text-primary mb-2 uppercase tracking-tight">Submit Test?</h3>
            <p className="text-text-secondary mb-6 font-medium">Are you sure you want to end the test and see your results?</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-bg-main p-4 rounded-2xl border border-border-subtle">
                <div className="text-[10px] text-teal-600 dark:text-teal-400 font-black uppercase tracking-widest mb-1">Attempted</div>
                <div className="text-2xl font-black text-text-primary">{attemptedCount}</div>
              </div>
              <div className="bg-bg-main p-4 rounded-2xl border border-border-subtle">
                <div className="text-[10px] text-orange-600 dark:text-orange-400 font-black uppercase tracking-widest mb-1">Left</div>
                <div className="text-2xl font-black text-text-primary">{unattemptedCount}</div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => handleSubmit()}
                className="w-full py-4 bg-accent-main hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20"
              >
                Yes, Submit Now
              </button>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-4 bg-bg-main hover:bg-bg-card text-text-secondary font-bold rounded-xl transition-all border border-border-subtle"
              >
                No, Continue Test
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        {/* Main Question Area */}
        <div className="lg:col-span-3">
          <div className="bg-bg-card p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-border-subtle transition-colors">
            <div className="flex items-center space-x-3 mb-6">
              <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-bg-main text-text-primary flex items-center justify-center font-bold text-xs md:text-sm border border-border-subtle">
                {currentQIndex + 1}
              </span>
              <span className="text-text-secondary font-medium text-sm md:text-base">of {questions.length} Questions</span>
            </div>
            
            {(() => {
              const parsedColumnMatch = parseColumnMatchQuestion(q.question);
              return (
                <>
                  <h2 
                    className="text-xl md:text-2xl font-bold text-text-primary leading-snug mb-6 md:mb-8"
                    dangerouslySetInnerHTML={{ __html: parsedColumnMatch ? parsedColumnMatch.preamble : q.question }}
                  />

                  {q.type === "match_following_mcq" ? (
                    <MatchFollowingMCQ
                      question={q}
                      selectedOption={answers[q.id]}
                      onSelectOption={handleSelectOption}
                    />
                  ) : parsedColumnMatch ? (
                    <MatchFollowingMCQ
                      question={{
                        ...q,
                        list_1: parsedColumnMatch.list_1,
                        list_2: parsedColumnMatch.list_2,
                      }}
                      selectedOption={answers[q.id]}
                      onSelectOption={handleSelectOption}
                      col1Header="Column I"
                      col2Header="Column II"
                    />
                  ) : q.type === "table_mcq" ? (
                    <TableMCQ
                      question={q as any}
                      selectedOption={answers[q.id]}
                      onSelectOption={handleSelectOption}
                    />
                  ) : (!q.options || q.options.length === 0) ? (
                    <div className="space-y-4">
                      <div className="p-1.5 rounded-2xl border-2 border-border-subtle bg-bg-main focus-within:border-accent-main transition-all shadow-sm">
                        <input
                          type="text"
                          value={answers[q.id] || ""}
                          onChange={(e) => handleSelectOption(e.target.value)}
                          placeholder={q.correctAnswer === "*" ? "Type your descriptive answer / notes here..." : "Type your numeric answer here..."}
                          className="w-full px-5 py-4 bg-transparent text-text-primary text-lg font-bold placeholder-text-secondary/50 focus:outline-none"
                        />
                      </div>
                      <p className="text-xs font-semibold text-text-secondary/60 uppercase tracking-widest pl-2">
                        {q.correctAnswer === "*" ? "Descriptive Answer: Self-assessed via explanation on submission" : "Numerical/Short Answer Type Question"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 md:space-y-4">
                      {q.options.map((opt, idx) => {
                        const isSelected = answers[q.id] === opt;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectOption(opt)}
                            className={`w-full text-left p-4 md:p-5 rounded-xl md:rounded-2xl border-2 transition-all flex items-center space-x-3 md:space-x-4 ${
                              isSelected 
                              ? 'border-accent-main bg-teal-50 dark:bg-teal-900/20 shadow-sm shadow-teal-500/10 text-teal-900 dark:text-teal-100' 
                              : 'border-border-subtle hover:border-text-secondary hover:bg-bg-main text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-accent-main' : 'border-border-subtle'}`}>
                              {isSelected && <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-accent-main rounded-full" />}
                            </div>
                            <span className="text-base md:text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: opt }} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
            <ReportIssueButton
              questionId={q.id}
              questionNumber={currentQIndex + 1}
              examName={testId}
              year={null}
              questionText={q.question}
              correctAnswer={q.correctAnswer}
              sourceType={
                testId.startsWith("dq") ? "daily" :
                testId.startsWith("wr") ? "weekly" :
                testId.startsWith("fm") ? "mock" :
                "practice"
              }
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-6 md:mt-8 gap-4">
            <button 
              onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
              disabled={currentQIndex === 0}
              className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 md:px-6 py-3 bg-bg-card border border-border-subtle rounded-xl font-bold text-sm md:text-base text-text-secondary hover:bg-bg-main hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span>Previous</span>
            </button>
            <button 
              onClick={() => setCurrentQIndex(Math.min(questions.length - 1, currentQIndex + 1))}
              disabled={currentQIndex === questions.length - 1}
              className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 md:px-6 py-3 bg-bg-card border border-border-subtle rounded-xl font-bold text-sm md:text-base text-text-secondary hover:bg-bg-main hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Sidebar Nav (Question Pallete) */}
        <div className="lg:block">
          <div className="bg-bg-card p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-border-subtle transition-colors lg:sticky lg:top-32">
            <h3 className="font-bold text-text-primary mb-4">Question Palette</h3>
            <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-4 gap-2">
              {questions.map((mockQ, i) => {
                const isAnswered = answers[mockQ.id] !== undefined;
                const isCurrent = i === currentQIndex;
                return (
                  <button
                    key={mockQ.id}
                    onClick={() => setCurrentQIndex(i)}
                    className={`h-9 md:h-10 rounded-lg font-bold text-xs md:text-sm transition-colors border ${
                      isCurrent ? 'ring-2 ring-accent-main ring-offset-2 ring-offset-bg-card' : ''
                    } ${
                      isAnswered 
                        ? 'bg-accent-main text-white border-accent-main' 
                        : 'bg-bg-main text-text-secondary border-border-subtle hover:border-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 pt-6 border-t border-border-subtle flex items-start space-x-3 text-xs md:text-sm text-text-secondary">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0 text-amber-500" />
              <p>Ensure you review all your portions before submitting.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
