"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  RotateCcw,
  Eye,
  PanelRightClose,
  PanelRightOpen,
  LayoutGrid,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import MatchFollowingMCQ from "@/components/MatchFollowingMCQ";
import TableMCQ from "@/components/TableMCQ";
import ReportIssueButton from "@/components/ReportIssueButton";
import StructuredExplanation from "@/components/StructuredExplanation";
import {
  shuffleArray,
  compareAnswers,
  parseColumnMatchQuestion,
} from "@/lib/utils";

interface PYQQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  type?: string;
  marks?: number;
  negative_marks?: number;
  list_1?: string[];
  list_2?: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
  section?: string;
}

const getSectionLabel = (sec: string, exam: string) => {
  if (exam === "gate") {
    const map: Record<string, string> = {
      A: "Sec A: GA",
      B: "Sec B: Chemistry",
      C: "Sec C: Biochemistry",
      D: "Sec D: Botany",
      E: "Sec E: Microbiology",
      F: "Sec F: Zoology",
      G: "Sec G: Food Tech",
      GA: "GA: Aptitude",
      "XL-P": "XL-P: Chemistry",
      "XL-Q": "XL-Q: Biochem",
      "XL-R": "XL-R: Botany",
      "XL-S": "XL-S: Microbio",
      "XL-T": "XL-T: Zoology",
      "XL-U": "XL-U: Food Tech",
    };
    return map[sec] || (sec.startsWith("Section") ? sec : `Section ${sec}`);
  }
  return `Section ${sec}`;
};

const getSectionFullName = (sec: string, exam: string) => {
  if (exam === "gate") {
    const map: Record<string, string> = {
      A: "Section A: General Aptitude (GA)",
      B: "Section B: Chemistry (XL-P)",
      C: "Section C: Biochemistry (XL-Q)",
      D: "Section D: Botany (XL-R)",
      E: "Section E: Microbiology (XL-S)",
      F: "Section F: Zoology (XL-T)",
      G: "Section G: Food Technology (XL-U)",
      GA: "Section A: General Aptitude (GA)",
      "XL-P": "Section B: Chemistry (XL-P)",
      "XL-Q": "Section C: Biochemistry (XL-Q)",
      "XL-R": "Section D: Botany (XL-R)",
      "XL-S": "Section E: Microbiology (XL-S)",
      "XL-T": "Section F: Zoology (XL-T)",
      "XL-U": "Section G: Food Technology (XL-U)",
    };
    return map[sec] || (sec.startsWith("Section") ? sec : `Section ${sec}`);
  }
  return `Section ${sec}`;
};

const formatYearName = (y: string) => {
  const lastPart = y.split("/").pop() || y;
  return lastPart
    .replace(/and([A-Z])/g, "and $1")
    .split("_")
    .map((part) => {
      const match = part.match(/^shift(\d+)$/i);
      if (match) return `Shift ${match[1]}`;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
};

const formatExamTitle = (exam: string) => {
  const names: Record<string, string> = {
    csir_net: "CSIR NET",
    dbt_bet: "DBT BET",
    gate: "GATE XL",
    icmr_jrf: "ICMR JRF",
  };
  return names[exam] || exam.replace("_", " ").toUpperCase();
};

export default function PYQTestEngine() {
  const params = useParams();
  const router = useRouter();
  const exam = params.exam as string;

  const yearParam = params.year;
  const yearArray = Array.isArray(yearParam)
    ? yearParam
    : yearParam
    ? [yearParam]
    : [];
  const year = yearArray.map((p) => decodeURIComponent(p)).join("/");

  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);

  const [activeSection, setActiveSection] = useState<string>("");
  const [sections, setSections] = useState<string[]>([]);

  const storageKey = `pyq_${exam}_${year}_progress`;

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/repository/pyq/${exam}/${year}.json`);
        if (!res.ok) throw new Error("Failed to load paper");
        const data = await res.json();

        const hasLetterPrefixes = data.some((q: PYQQuestion) =>
          (q.options || []).some((o) => /^\([A-D1-4]\)/i.test(o.trim()))
        );
        const shouldShuffle = exam !== "gate" && !hasLetterPrefixes;
        const shuffledQuestions = data.map((q: PYQQuestion) => ({
          ...q,
          options: shouldShuffle
            ? shuffleArray(q.options || [])
            : q.options || [],
        }));

        setQuestions(shuffledQuestions);

        const sectionsInQuestions = Array.from(
          new Set(shuffledQuestions.map((q: any) => q.section).filter(Boolean))
        ) as string[];

        const isCsirNet = exam === "csir_net";
        const finalSections = isCsirNet
          ? ["A", "B", "C"]
          : sectionsInQuestions.sort();
        setSections(finalSections);

        const defaultSection = finalSections.length > 0 ? finalSections[0] : "";
        let restoredSection = defaultSection;
        let restoredIndex = 0;

        const savedProgress = localStorage.getItem(storageKey);
        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);
            if (parsed.activeSection !== undefined) {
              restoredSection = parsed.activeSection;
              restoredIndex = parsed.lastIndex || 0;
            } else if (
              parsed.lastIndex !== undefined &&
              parsed.lastIndex < shuffledQuestions.length
            ) {
              const q = shuffledQuestions[parsed.lastIndex];
              if (q) {
                restoredSection = q.section || defaultSection;
                const secQuestions = shuffledQuestions.filter(
                  (item: any) => (item.section || defaultSection) === restoredSection
                );
                const idx = secQuestions.findIndex(
                  (item: any) => item.id === q.id
                );
                restoredIndex = idx !== -1 ? idx : 0;
              }
            }
            if (parsed.answers) {
              setSelectedOptions(parsed.answers);
              const explanations: Record<number, boolean> = {};
              Object.keys(parsed.answers).forEach((k) => {
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

  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          activeSection,
          lastIndex: currentIndex,
          answers: selectedOptions,
        })
      );
    }
  }, [currentIndex, activeSection, selectedOptions, questions.length, storageKey]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-9 h-9 text-teal-600 animate-spin mb-3" />
        <p className="text-text-secondary font-medium text-sm">
          Loading Paper...
        </p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="bg-bg-card p-8 rounded-2xl border border-border-subtle shadow-sm">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-text-primary mb-1">
            Paper Not Found
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            {error || "This paper has no questions."}
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold tab-click-anim"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const filteredQuestions =
    sections.length > 0
      ? questions.filter((q) => (q.section || "A") === activeSection)
      : questions;

  const question = filteredQuestions[currentIndex];
  const isAnswered = question ? Boolean(showExplanation[question.id]) : false;
  const userChoice = question ? selectedOptions[question.id] : undefined;
  const isCorrect =
    question && userChoice !== undefined
      ? compareAnswers(userChoice, question.correct_answer)
      : false;

  const handleOptionSelect = (option: string) => {
    if (!question || isAnswered) return;
    setSelectedOptions((prev) => ({ ...prev, [question.id]: option }));
    setShowExplanation((prev) => ({ ...prev, [question.id]: true }));
  };

  const handleReattemptQuestion = () => {
    if (!question) return;
    setSelectedOptions((prev) => {
      const next = { ...prev };
      delete next[question.id];
      return next;
    });
    setShowExplanation((prev) => {
      const next = { ...prev };
      delete next[question.id];
      return next;
    });
  };

  const handleRevealSolution = () => {
    if (!question) return;
    setShowExplanation((prev) => ({ ...prev, [question.id]: true }));
  };

  const goNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSectionChange = (sec: string) => {
    setActiveSection(sec);
    setCurrentIndex(0);
  };

  // Compute palette stats for current filtered questions
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  filteredQuestions.forEach((item) => {
    if (showExplanation[item.id] && selectedOptions[item.id] !== undefined) {
      if (compareAnswers(selectedOptions[item.id], item.correct_answer)) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    } else {
      unattemptedCount++;
    }
  });

  const PaletteBody = ({ onPick }: { onPick?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-3 gap-2 p-3.5 bg-bg-main/60 border-b border-border-subtle text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-text-secondary truncate">
            Correct ({correctCount})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <span className="text-text-secondary truncate">
            Wrong ({incorrectCount})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
          <span className="text-text-secondary truncate">
            Left ({unattemptedCount})
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto max-h-[380px] lg:max-h-[460px]">
        <div className="text-xs font-semibold text-text-secondary mb-3 flex items-center justify-between">
          <span>Question Palette</span>
          <span>
            {filteredQuestions.length > 0 ? currentIndex + 1 : 0} /{" "}
            {filteredQuestions.length}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {filteredQuestions.map((qItem, idx) => {
            const isCurrent = idx === currentIndex;
            const answered = Boolean(showExplanation[qItem.id]);
            const choice = selectedOptions[qItem.id];
            const right =
              choice !== undefined &&
              compareAnswers(choice, qItem.correct_answer);

            let stateClasses =
              "bg-bg-main border-border-subtle text-text-secondary hover:border-teal-500/50 hover:text-text-primary";
            if (answered && choice !== undefined) {
              stateClasses = right
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-rose-500 text-white border-rose-500";
            } else if (answered) {
              stateClasses =
                "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/40";
            }

            return (
              <button
                key={qItem.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  onPick?.();
                }}
                className={`h-9 rounded-lg border text-xs font-semibold tab-click-anim ${stateClasses} ${
                  isCurrent
                    ? "ring-2 ring-teal-500 ring-offset-2 ring-offset-bg-card"
                    : ""
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-3.5">
      {/* Top Paper Header */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href={`/pyq/${exam}`}
            className="p-2 bg-bg-main hover:bg-bg-card border border-border-subtle rounded-xl text-text-secondary hover:text-text-primary tab-click-anim shrink-0"
            title="Back to exam list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-text-primary truncate">
              {formatExamTitle(exam)} •{" "}
              <span className="text-teal-600 dark:text-teal-400">
                {formatYearName(year)}
              </span>
            </h1>
            <p className="text-xs text-text-secondary truncate">
              {sections.length > 0
                ? `${getSectionFullName(activeSection, exam)} • `
                : ""}
              Question {filteredQuestions.length > 0 ? currentIndex + 1 : 0} of{" "}
              {filteredQuestions.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Palette Drawer Trigger */}
          <button
            onClick={() => setIsMobilePaletteOpen(true)}
            disabled={filteredQuestions.length === 0}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-subtle bg-bg-main text-text-primary text-xs font-semibold tab-click-anim disabled:opacity-50"
          >
            <LayoutGrid className="w-4 h-4 text-teal-600" />
            <span>
              {filteredQuestions.length > 0 ? currentIndex + 1 : 0}/
              {filteredQuestions.length}
            </span>
          </button>

          {/* Desktop Collapse Palette Toggle */}
          <button
            onClick={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
            disabled={filteredQuestions.length === 0}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-subtle bg-bg-main hover:bg-bg-card text-text-secondary hover:text-text-primary text-xs font-medium tab-click-anim disabled:opacity-50"
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
            onClick={() => {
              if (confirm("Reset all progress for this paper?")) {
                localStorage.removeItem(storageKey);
                window.location.reload();
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 rounded-xl tab-click-anim"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      {sections.length > 0 && (
        <div className="flex items-center gap-1.5 p-1.5 bg-bg-card rounded-2xl border border-border-subtle shadow-sm max-w-full overflow-x-auto scrollbar-none">
          {sections.map((sec) => {
            const isActive = sec === activeSection;
            return (
              <button
                key={sec}
                onClick={() => handleSectionChange(sec)}
                className={`whitespace-nowrap py-2 px-3.5 rounded-xl font-semibold text-xs tab-click-anim shrink-0 ${
                  isActive
                    ? "bg-teal-600 text-white shadow-sm animate-tab-pop"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-main"
                }`}
              >
                {getSectionLabel(sec, exam)}
              </button>
            );
          })}
        </div>
      )}

      {/* Progress Bar */}
      {filteredQuestions.length > 0 && (
        <div className="w-full bg-bg-card border border-border-subtle h-1 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-600 transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Main Split Workspace */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-bg-card p-12 rounded-2xl border border-border-subtle text-center shadow-sm">
          <FileText className="w-12 h-12 text-text-secondary/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-text-primary mb-1">
            No Questions Available
          </h3>
          <p className="text-sm text-text-secondary">
            No questions were found in Section {activeSection}.
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 items-start">
          {/* Left: Spacious Question & Options Pane */}
          <div className="flex-1 w-full min-w-0 bg-bg-card rounded-2xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
            {/* Meta Strip */}
            <div className="px-5 sm:px-7 py-3 border-b border-border-subtle bg-bg-main/40 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-text-primary">
                  Question No. {question.id}
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300">
                  {question.marks || 1}{" "}
                  {(question.marks || 1) === 1 ? "Mark" : "Marks"}
                </span>
                {question.negative_marks !== undefined && (
                  <span className="text-[11px] font-medium text-text-secondary">
                    {question.negative_marks === 0
                      ? "No Negative"
                      : `Negative -${question.negative_marks}`}
                  </span>
                )}
                {question.type && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-bg-main text-text-secondary border border-border-subtle">
                    {question.type}
                  </span>
                )}
                {isAnswered && userChoice !== undefined && (
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      isCorrect
                        ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-500/12 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {isCorrect ? "Correct" : "Incorrect"}
                  </span>
                )}
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

            {/* Spacious Reading Body */}
            <div
              key={`${activeSection}-${question.id}`}
              className="p-5 sm:p-7 lg:px-9 lg:py-8 space-y-6 animate-pop-in"
            >
              {(() => {
                const parsedColumnMatch = parseColumnMatchQuestion(
                  question.question
                );
                const questionHtml = parsedColumnMatch
                  ? parsedColumnMatch.preamble
                  : question.question;
                const optionLetters = ["A", "B", "C", "D", "E", "F"];

                return (
                  <>
                    <div
                      className="text-[15px] sm:text-[17px] font-medium text-text-primary leading-[1.75] max-w-3xl whitespace-pre-line break-words"
                      dangerouslySetInnerHTML={{ __html: questionHtml }}
                    />

                    {question.type === "match_following_mcq" ? (
                      <MatchFollowingMCQ
                        question={{
                          ...question,
                          id: question.id.toString(),
                          correctAnswer: question.correct_answer,
                        } as any}
                        selectedOption={userChoice}
                        onSelectOption={handleOptionSelect}
                        disabled={isAnswered}
                        isReview={isAnswered}
                        correctAnswer={question.correct_answer}
                      />
                    ) : parsedColumnMatch ? (
                      <MatchFollowingMCQ
                        question={{
                          ...question,
                          id: question.id.toString(),
                          list_1: parsedColumnMatch.list_1,
                          list_2: parsedColumnMatch.list_2,
                          correctAnswer: question.correct_answer,
                        } as any}
                        selectedOption={userChoice}
                        onSelectOption={handleOptionSelect}
                        disabled={isAnswered}
                        isReview={isAnswered}
                        correctAnswer={question.correct_answer}
                        col1Header={parsedColumnMatch.col1Header || "List I"}
                        col2Header={parsedColumnMatch.col2Header || "List II"}
                      />
                    ) : (question as any).type === "table_mcq" ? (
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
                    ) : !question.options || question.options.length === 0 ? (
                      <div className="space-y-3 max-w-xl">
                        <input
                          type="text"
                          value={selectedOptions[question.id] || ""}
                          disabled={isAnswered}
                          onChange={(e) => {
                            if (!isAnswered) {
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [question.id]: e.target.value,
                              }));
                            }
                          }}
                          placeholder={
                            question.correct_answer === "*"
                              ? "Type your descriptive answer / notes here..."
                              : "Type your numeric answer here..."
                          }
                          className="w-full px-4 py-3 bg-bg-main border border-border-subtle rounded-xl text-text-primary text-base font-medium focus:border-teal-500 focus:outline-none"
                        />
                        {!isAnswered && (
                          <button
                            onClick={() => {
                              const val = selectedOptions[question.id] || "";
                              if (val.trim() !== "") handleOptionSelect(val);
                            }}
                            disabled={
                              !(selectedOptions[question.id] || "").trim()
                            }
                            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-45 text-white text-xs sm:text-sm font-semibold rounded-xl tab-click-anim"
                          >
                            Check Answer
                          </button>
                        )}
                        {isAnswered && question.correct_answer && (
                          <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                            <span className="font-semibold text-teal-700 dark:text-teal-300">
                              Official Answer: {question.correct_answer}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-w-3xl">
                        {question.options.map((option, idx) => {
                          const isSelected = userChoice === option;
                          const isActualCorrect = compareAnswers(
                            option,
                            question.correct_answer
                          );

                          let rowClasses =
                            "bg-bg-main/40 border-border-subtle hover:bg-bg-main hover:border-teal-500/45 text-text-primary";
                          let badgeClasses =
                            "bg-bg-card border-border-subtle text-text-secondary";

                          if (isAnswered) {
                            if (isActualCorrect) {
                              rowClasses =
                                "bg-emerald-500/10 border-emerald-500 text-text-primary font-medium";
                              badgeClasses =
                                "bg-emerald-500 border-emerald-500 text-white";
                            } else if (isSelected) {
                              rowClasses =
                                "bg-rose-500/10 border-rose-500 text-text-primary font-medium";
                              badgeClasses =
                                "bg-rose-500 border-rose-500 text-white";
                            } else {
                              rowClasses =
                                "bg-bg-main/20 border-border-subtle opacity-55 text-text-secondary";
                            }
                          } else if (isSelected) {
                            rowClasses =
                              "bg-teal-500/10 border-teal-500 text-text-primary font-medium";
                            badgeClasses =
                              "bg-teal-600 border-teal-600 text-white";
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => handleOptionSelect(option)}
                              disabled={isAnswered}
                              className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all tab-click-anim flex items-start gap-3.5 ${rowClasses}`}
                            >
                              <span
                                className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 ${badgeClasses}`}
                              >
                                {optionLetters[idx] || idx + 1}
                              </span>
                              <span
                                className="flex-1 text-sm sm:text-[15px] leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: option }}
                              />
                              {isAnswered && isActualCorrect && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                              )}
                              {isAnswered && isSelected && !isActualCorrect && (
                                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Quick Solution / Re-attempt Action */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {!isAnswered ? (
                  <button
                    onClick={handleRevealSolution}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-teal-500/35 bg-teal-500/8 hover:bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs sm:text-sm font-semibold tab-click-anim"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Solution</span>
                  </button>
                ) : (
                  <button
                    onClick={handleReattemptQuestion}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-subtle bg-bg-main hover:bg-bg-card text-text-secondary hover:text-text-primary text-xs sm:text-sm font-medium tab-click-anim"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-attempt Question</span>
                  </button>
                )}
              </div>

              {/* Structured Explanation Box */}
              {isAnswered && (
                <div
                  className={`p-5 sm:p-6 rounded-2xl border animate-pop-in ${
                    userChoice === undefined
                      ? "bg-bg-main/60 border-border-subtle"
                      : isCorrect
                      ? "bg-emerald-500/8 border-emerald-500/30"
                      : "bg-rose-500/8 border-rose-500/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {userChoice === undefined ? (
                      <>
                        <Eye className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        <h3 className="font-bold text-text-primary text-sm">
                          Solution & Concept Breakdown
                        </h3>
                      </>
                    ) : isCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                          Correct Answer
                        </h3>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500" />
                        <h3 className="font-bold text-rose-700 dark:text-rose-300 text-sm">
                          Incorrect Attempt
                        </h3>
                      </>
                    )}
                  </div>
                  <div className="text-text-primary text-sm sm:text-[15px] leading-relaxed w-full">
                    <StructuredExplanation explanation={question.explanation} />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation Bar */}
            <div className="px-4 sm:px-7 py-3.5 border-t border-border-subtle bg-bg-main/40 flex items-center justify-between gap-3">
              <button
                onClick={goBack}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-bg-card border border-border-subtle rounded-xl text-xs sm:text-sm font-medium text-text-primary hover:bg-bg-main disabled:opacity-45 disabled:cursor-not-allowed tab-click-anim"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs text-text-secondary hidden sm:inline">
                {currentIndex + 1} / {filteredQuestions.length}
              </span>

              <button
                onClick={goNext}
                disabled={currentIndex === filteredQuestions.length - 1}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-45 disabled:cursor-not-allowed tab-click-anim shadow-sm"
              >
                <span>Next</span>
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
      )}

      {/* Mobile Slide-Over Palette Drawer */}
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
    </div>
  );
}
