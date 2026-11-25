"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bookmark,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
  LayoutGrid,
  X,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MatchFollowingMCQ from "./MatchFollowingMCQ";
import TableMCQ from "./TableMCQ";
import ReportIssueButton from "./ReportIssueButton";

import { useAuth } from "@/lib/AuthContext";
import {
  generateRandomTest,
  submitTestAttempt,
  saveTestProgress,
  getTestProgress,
  Question,
} from "@/lib/testEngine";
import { compareAnswers, parseColumnMatchQuestion } from "@/lib/utils";

export default function ActiveTest({ testId }: { testId: string }) {
  const { user, isGuest } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [initialTime, setInitialTime] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchQuestions() {
      if (user === undefined) return;

      try {
        const userId = user?.email || user?.uid || "guest";

        if (userId !== "guest") {
          const queryIds = [user?.email, user?.uid].filter(Boolean) as string[];
          const progress = await getTestProgress(queryIds, testId);
          if (progress) {
            setQuestions(progress.questions);
            setAnswers(progress.answers || {});
            setCurrentQIndex(progress.currentQIndex || 0);
            setTimeLeft(progress.timeLeft || 3600);
            setInitialTime(3600);
            setLoading(false);
            return;
          }
        }

        let qBank: Question[] = [];
        let parsedTimeLimit = 3600;

        if (testId.startsWith("random-")) {
          if (testId.startsWith("random-unit-") || testId.startsWith("unit-")) {
            const unitId = parseInt(
              testId.replace("random-unit-", "").replace("unit-", "")
            );
            qBank = await generateRandomTest(userId, 50, unitId);
            parsedTimeLimit = 60 * 60;
          } else {
            const count = parseInt(testId.replace("random-", ""));
            qBank = await generateRandomTest(userId, count);
            if (count === 10) parsedTimeLimit = 15 * 60;
            else if (count === 50) parsedTimeLimit = 60 * 60;
            else if (count === 150) parsedTimeLimit = 180 * 60;
          }
        } else if (testId.startsWith("dq")) {
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
          errorMsg =
            "Database Permission Error: Please ensure Firestore rules are published and try signing out/in.";
        } else if (err.message?.includes("index")) {
          errorMsg =
            "Database Index Error: This query requires a new index in Firebase Console.";
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
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, loading, isSubmitting]);

  // Auto-save progress
  useEffect(() => {
    if (
      loading ||
      isSubmitted ||
      !user ||
      user.uid === "guest" ||
      questions.length === 0
    )
      return;

    const saveTimeout = setTimeout(() => {
      saveTestProgress(user.uid, testId, {
        testTitle: testId.toUpperCase(),
        questions,
        answers,
        currentQIndex,
        timeLeft,
      });
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [answers, currentQIndex]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const min = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${min.toString().padStart(2, "0")}:${sec
        .toString()
        .padStart(2, "0")}`;
    }
    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  const formatTestTitle = (id: string) => {
    if (id.startsWith("dq")) return `Daily Practice Set ${id.replace("dq", "")}`;
    if (id.startsWith("wr")) return `Weekly Revision ${id.replace("wr", "")}`;
    if (id.startsWith("fm")) return `CSIR NET Mock Test ${id.replace("fm", "")}`;
    if (id.startsWith("random-unit-"))
      return `Unit ${id.replace("random-unit-", "")} Practice Test`;
    if (id.startsWith("unit-"))
      return `Unit ${id.replace("unit-", "")} Practice Test`;
    return id.toUpperCase();
  };

  const handleSelectOption = (optString: string) => {
    if (isSubmitted) return;
    setAnswers({ ...answers, [questions[currentQIndex].id]: optString });
  };

  const handleClearResponse = () => {
    if (isSubmitted || !q) return;
    const copy = { ...answers };
    delete copy[q.id];
    setAnswers(copy);
  };

  const handleToggleMark = () => {
    if (!q) return;
    setMarkedForReview((prev) => ({ ...prev, [q.id]: !prev[q.id] }));
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if ((!user && !isGuest) || isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      let localScore = 0;
      questions.forEach((item) => {
        const userAnswer = answers[item.id];
        if (userAnswer !== undefined && userAnswer !== "") {
          if (compareAnswers(userAnswer, item.correctAnswer)) {
            localScore += 1;
          } else {
            localScore -= 0.5;
          }
        }
      });
      setScore(localScore);

      const timeTaken = Math.max(0, initialTime - timeLeft);
      const attemptId = await submitTestAttempt(
        user?.uid || "guest",
        questions,
        answers,
        testId,
        timeTaken
      );

      setIsSubmitted(true);
      setTimeout(() => {
        router.push(`/exam/${testId}/result?attemptId=${attemptId}`);
      }, 1200);
    } catch (err) {
      console.error("Submission failed:", err);
      setIsSubmitting(false);
      alert("Failed to submit test. Please try again.");
    }
  };

  const attemptedCount = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== ""
  ).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const unattemptedCount = questions.length - attemptedCount;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-600 rounded-full animate-spin mb-3" />
        <h2 className="text-lg font-semibold text-text-primary">
          Preparing your test...
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Loading questions and timer.
        </p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-900/30 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-red-800 dark:text-red-400 mb-1">
            Unable to Load Test
          </h2>
          <p className="text-sm text-red-600 dark:text-red-300 mb-5">
            {error || "No questions found."}
          </p>
          <Link
            href="/test-series"
            className="inline-block px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Return to Test Library
          </Link>
        </div>
      </div>
    );
  }

  const q = questions[currentQIndex];
  const isCurrentAnswered =
    answers[q.id] !== undefined && answers[q.id] !== "";
  const isCurrentMarked = Boolean(markedForReview[q.id]);

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-pop-in">
        <div className="bg-bg-card p-8 rounded-2xl shadow-lg border border-border-subtle text-center max-w-md w-full">
          <div className="w-16 h-16 bg-teal-500/12 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-1">
            Exam Submitted
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            Redirecting to your detailed scorecard...
          </p>

          <div className="bg-bg-main rounded-xl p-5 mb-6 border border-border-subtle">
            <div className="text-xs font-medium text-text-secondary mb-1">
              Estimated Score
            </div>
            <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
              {score}{" "}
              <span className="text-base text-text-secondary font-normal">
                / {questions.length}
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="block w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold text-center transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const PaletteBody = ({ onPick }: { onPick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Status Legend */}
      <div className="grid grid-cols-3 gap-2 p-3.5 bg-bg-main/60 border-b border-border-subtle text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
          <span className="text-text-secondary truncate">
            Answered ({attemptedCount})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-text-secondary truncate">
            Review ({markedCount})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
          <span className="text-text-secondary truncate">
            Left ({unattemptedCount})
          </span>
        </div>
      </div>

      {/* Number Grid */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[380px] lg:max-h-[440px]">
        <div className="text-xs font-semibold text-text-secondary mb-3 flex items-center justify-between">
          <span>Question Palette</span>
          <span>
            {currentQIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((mockQ, i) => {
            const isAns =
              answers[mockQ.id] !== undefined && answers[mockQ.id] !== "";
            const isMarked = Boolean(markedForReview[mockQ.id]);
            const isCurrent = i === currentQIndex;

            let btnStyle =
              "bg-bg-main text-text-secondary border-border-subtle hover:border-teal-500/50 hover:text-text-primary";
            if (isMarked && isAns) {
              btnStyle =
                "bg-violet-600 text-white border-violet-600";
            } else if (isMarked) {
              btnStyle =
                "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/50";
            } else if (isAns) {
              btnStyle = "bg-teal-600 text-white border-teal-600";
            }

            return (
              <button
                key={mockQ.id}
                onClick={() => {
                  setCurrentQIndex(i);
                  onPick?.();
                }}
                className={`h-9 rounded-lg font-semibold text-xs border tab-click-anim ${btnStyle} ${
                  isCurrent
                    ? "ring-2 ring-teal-500 ring-offset-2 ring-offset-bg-card"
                    : ""
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3.5 border-t border-border-subtle bg-bg-main/40">
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={isSubmitting}
          className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl tab-click-anim transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Test"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-3.5">
      {/* Top CBT Exam Bar */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/"
            className="p-2 rounded-xl bg-bg-main hover:bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary tab-click-anim shrink-0"
            title="Exit test"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-text-primary truncate">
              {formatTestTitle(testId)}
            </h1>
            <p className="text-xs text-text-secondary">
              {attemptedCount} of {questions.length} answered
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-semibold border ${
              timeLeft < 300
                ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 animate-pulse"
                : "bg-bg-main text-text-primary border-border-subtle"
            }`}
          >
            <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Mobile Palette Drawer Trigger */}
          <button
            onClick={() => setIsMobilePaletteOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-subtle bg-bg-main text-text-primary text-xs font-semibold tab-click-anim"
          >
            <LayoutGrid className="w-4 h-4 text-teal-600" />
            <span>{currentQIndex + 1}/{questions.length}</span>
          </button>

          {/* Desktop Collapse Palette Toggle */}
          <button
            onClick={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-subtle bg-bg-main hover:bg-bg-card text-text-secondary hover:text-text-primary text-xs font-medium tab-click-anim"
            title={isPaletteCollapsed ? "Show Question Palette" : "Hide Question Palette"}
          >
            {isPaletteCollapsed ? (
              <>
                <PanelRightOpen className="w-4 h-4 text-teal-600" />
                <span>Palette</span>
              </>
            ) : (
              <>
                <PanelRightClose className="w-4 h-4" />
                <span>Hide Palette</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm tab-click-anim shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Submitting
              </span>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>

      {/* Thin Progress Line */}
      <div className="w-full h-1 bg-bg-card border border-border-subtle rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-600 transition-all duration-300"
          style={{
            width: `${((currentQIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Main Split Workspace: Spacious Left Question Card + Collapsible Right Palette */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 items-start">
        {/* Question Card */}
        <div className="flex-1 w-full min-w-0 bg-bg-card rounded-2xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
          {/* Question Header Meta Strip */}
          <div className="px-5 sm:px-7 py-3 border-b border-border-subtle bg-bg-main/40 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-text-primary">
                Question No. {currentQIndex + 1}
              </span>
              <span className="text-xs text-text-secondary">
                of {questions.length}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300">
                +1 / -0.5 Marks
              </span>
              {isCurrentMarked && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-700 dark:text-amber-300">
                  Marked for Review
                </span>
              )}
              {isCurrentAnswered && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
                  Answered
                </span>
              )}
            </div>

            <ReportIssueButton
              questionId={q.id}
              questionNumber={currentQIndex + 1}
              examName={testId}
              year={null}
              questionText={q.question}
              correctAnswer={q.correctAnswer}
              sourceType={
                testId.startsWith("dq")
                  ? "daily"
                  : testId.startsWith("wr")
                  ? "weekly"
                  : testId.startsWith("fm")
                  ? "mock"
                  : "practice"
              }
            />
          </div>

          {/* Spacious Question Body */}
          <div
            key={q.id}
            className="p-5 sm:p-7 lg:px-9 lg:py-8 space-y-6 animate-pop-in"
          >
            {(() => {
              const parsedColumnMatch = parseColumnMatchQuestion(q.question);
              const questionHtml = parsedColumnMatch
                ? parsedColumnMatch.preamble
                : q.question;
              const optionLetters = ["A", "B", "C", "D", "E", "F"];

              return (
                <>
                  <div
                    className="text-[15px] sm:text-[17px] font-medium text-text-primary leading-[1.75] max-w-3xl whitespace-pre-line break-words"
                    dangerouslySetInnerHTML={{ __html: questionHtml }}
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
                      col1Header={parsedColumnMatch.col1Header || "List I"}
                      col2Header={parsedColumnMatch.col2Header || "List II"}
                    />
                  ) : q.type === "table_mcq" ? (
                    <TableMCQ
                      question={q as any}
                      selectedOption={answers[q.id]}
                      onSelectOption={handleSelectOption}
                    />
                  ) : !q.options || q.options.length === 0 ? (
                    <div className="space-y-2.5 max-w-xl">
                      <input
                        type="text"
                        value={answers[q.id] || ""}
                        onChange={(e) => handleSelectOption(e.target.value)}
                        placeholder={
                          q.correctAnswer === "*"
                            ? "Type your descriptive answer / notes here..."
                            : "Type your numeric answer here..."
                        }
                        className="w-full px-4 py-3 bg-bg-main border border-border-subtle rounded-xl text-text-primary text-base font-medium focus:border-teal-500 focus:outline-none"
                      />
                      <p className="text-xs text-text-secondary">
                        {q.correctAnswer === "*"
                          ? "Descriptive question — self-assessed via explanation after submission."
                          : "Numerical answer type question."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-w-3xl">
                      {q.options.map((opt, idx) => {
                        const isSelected = answers[q.id] === opt;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectOption(opt)}
                            className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all tab-click-anim flex items-start gap-3.5 ${
                              isSelected
                                ? "border-teal-500 bg-teal-500/10 text-text-primary shadow-sm"
                                : "border-border-subtle bg-bg-main/40 hover:bg-bg-main hover:border-teal-500/40 text-text-primary"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 transition-colors ${
                                isSelected
                                  ? "bg-teal-600 border-teal-600 text-white"
                                  : "bg-bg-card border-border-subtle text-text-secondary"
                              }`}
                            >
                              {optionLetters[idx] || idx + 1}
                            </span>
                            <span
                              className="text-sm sm:text-[15px] leading-relaxed flex-1"
                              dangerouslySetInnerHTML={{ __html: opt }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Bottom CBT Action Bar */}
          <div className="px-4 sm:px-7 py-3.5 border-t border-border-subtle bg-bg-main/40 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
                disabled={currentQIndex === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bg-card border border-border-subtle rounded-xl text-xs sm:text-sm font-medium text-text-primary hover:bg-bg-main disabled:opacity-45 disabled:cursor-not-allowed tab-click-anim"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleToggleMark}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium tab-click-anim ${
                  isCurrentMarked
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
                    : "bg-bg-card border-border-subtle text-text-secondary hover:text-text-primary"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isCurrentMarked ? "Marked" : "Mark Review"}
                </span>
              </button>

              {isCurrentAnswered && (
                <button
                  onClick={handleClearResponse}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-border-subtle bg-bg-card text-xs sm:text-sm font-medium text-text-secondary hover:text-rose-600 dark:hover:text-rose-400 tab-click-anim"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>

            <button
              onClick={() =>
                setCurrentQIndex(
                  Math.min(questions.length - 1, currentQIndex + 1)
                )
              }
              disabled={currentQIndex === questions.length - 1}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-45 disabled:cursor-not-allowed tab-click-anim shadow-sm"
            >
              <span>Save & Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Collapsible Right Palette */}
        {!isPaletteCollapsed && (
          <aside className="hidden lg:block w-[290px] xl:w-[310px] shrink-0 bg-bg-card rounded-2xl border border-border-subtle shadow-sm overflow-hidden sticky top-20 animate-pop-in">
            <PaletteBody />
          </aside>
        )}
      </div>

      {/* Mobile Slide-Over Question Palette Drawer */}
      {isMobilePaletteOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsMobilePaletteOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-bg-card h-full shadow-2xl border-l border-border-subtle flex flex-col animate-slide-in-right pt-[env(safe-area-inset-top)]">
            <div className="px-4 py-3.5 border-b border-border-subtle flex items-center justify-between">
              <span className="font-bold text-sm text-text-primary">
                Question Palette
              </span>
              <button
                onClick={() => setIsMobilePaletteOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <PaletteBody onPick={() => setIsMobilePaletteOpen(false)} />
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-card w-full max-w-sm rounded-2xl p-6 border border-border-subtle shadow-2xl animate-pop-in">
            <h3 className="text-xl font-bold text-text-primary mb-1.5">
              Submit Test?
            </h3>
            <p className="text-sm text-text-secondary mb-5">
              Review your attempt summary before submitting.
            </p>

            <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
              <div className="bg-bg-main p-3 rounded-xl border border-border-subtle">
                <div className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                  Answered
                </div>
                <div className="text-xl font-bold text-text-primary mt-0.5">
                  {attemptedCount}
                </div>
              </div>
              <div className="bg-bg-main p-3 rounded-xl border border-border-subtle">
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                  Review
                </div>
                <div className="text-xl font-bold text-text-primary mt-0.5">
                  {markedCount}
                </div>
              </div>
              <div className="bg-bg-main p-3 rounded-xl border border-border-subtle">
                <div className="text-[11px] text-text-secondary font-semibold">
                  Left
                </div>
                <div className="text-xl font-bold text-text-primary mt-0.5">
                  {unattemptedCount}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => handleSubmit()}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl tab-click-anim"
              >
                Yes, Submit Now
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-3 bg-bg-main hover:bg-bg-card text-text-secondary text-sm font-semibold rounded-xl border border-border-subtle tab-click-anim"
              >
                Continue Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
