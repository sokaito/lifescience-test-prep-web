"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { submitQuestionReport, QuestionReportInput } from "@/lib/reportSystem";
import { AlertTriangle, X, Loader2, CheckCircle2 } from "lucide-react";

interface ReportIssueButtonProps {
  questionId: string;
  questionNumber: number;
  examName: string;
  year: string | null;
  subject?: string;
  topic?: string;
  difficulty?: string;
  questionText: string;
  correctAnswer: string;
  sourceType: "pyq" | "daily" | "weekly" | "mock" | "practice";
}

const ISSUE_TYPES = [
  "Wrong Answer",
  "Typo / Grammar Mistake",
  "Question Mismatch",
  "Duplicate Question",
  "Missing Image",
  "Incorrect Explanation",
  "Wrong Options",
  "Formatting Problem",
  "Outdated Question",
  "Other"
];

export default function ReportIssueButton({
  questionId,
  questionNumber,
  examName,
  year,
  subject = "",
  topic = "",
  difficulty = "",
  questionText,
  correctAnswer,
  sourceType
}: ReportIssueButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [userMessage, setUserMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Clean IDs by stripping off test repetitions (e.g. "static-1-0-repeat-3" -> "static-1-0")
  const cleanQuestionId = questionId.split("-repeat-")[0];

  const handleOpen = () => {
    setIsOpen(true);
    setErrorMsg(null);
    setUserMessage("");
    setIssueType(ISSUE_TYPES[0]);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const reportData: QuestionReportInput = {
      questionId: cleanQuestionId,
      questionNumber,
      examName,
      year: year || null,
      subject,
      topic,
      difficulty,
      questionText,
      correctAnswer,
      sourceType,
      issueType,
      userMessage,
      currentPageUrl: typeof window !== "undefined" ? window.location.href : "",
      userId: user?.uid || "guest",
      userEmail: user?.email || "guest"
    };

    try {
      await submitQuestionReport(reportData);
      setIsOpen(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Report Trigger Button */}
      <div className="flex justify-end mt-4">
        <button
          onClick={handleOpen}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-main hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 dark:hover:text-red-400 text-xs font-bold text-text-secondary uppercase tracking-wider transition-all"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Report Issue</span>
        </button>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-250">
          {/* Modal Container */}
          <div className="bg-bg-card w-full max-w-lg rounded-3xl border border-border-subtle shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-main/30">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Report Question Issue</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-main transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Question summary / identity (non-intrusive metadata) */}
              <div className="bg-bg-main/50 border border-border-subtle rounded-xl p-3.5 text-xs text-text-secondary space-y-1.5">
                <div className="flex justify-between">
                  <span>Question ID: <strong className="text-text-primary">#{cleanQuestionId}</strong></span>
                  <span>Exam: <strong className="text-text-primary">{examName.toUpperCase()} {year ? `(${year})` : ""}</strong></span>
                </div>
                <div className="text-ellipsis overflow-hidden whitespace-nowrap">
                  Question: <span className="italic" dangerouslySetInnerHTML={{ __html: questionText.substring(0, 100) + "..." }}></span>
                </div>
              </div>

              {/* Error messages */}
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* Issue Type Dropdown */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  What is the issue?
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-bg-main text-text-primary text-sm focus:border-accent-main transition-all font-medium"
                >
                  {ISSUE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Details Textarea */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Additional Details
                  </label>
                  <span className={`text-[10px] font-bold ${userMessage.length > 450 ? 'text-red-500' : 'text-text-secondary'}`}>
                    {userMessage.length} / 500
                  </span>
                </div>
                <textarea
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value.slice(0, 500))}
                  placeholder="Describe the problem in detail (optional)..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-bg-main text-text-primary text-sm focus:border-accent-main transition-all placeholder:text-text-secondary/50 font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3 border border-border-subtle bg-bg-main hover:bg-bg-card text-text-secondary font-bold rounded-xl text-sm transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-accent-main hover:opacity-90 text-white font-black rounded-xl text-sm transition-all shadow-md shadow-teal-500/25 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Report</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-teal-50 dark:bg-teal-950/30 border-2 border-teal-500 rounded-2xl p-4 shadow-xl flex items-start space-x-3 animate-slide-in-right">
          <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-teal-800 dark:text-teal-300 text-sm uppercase tracking-tight">Report Received</h4>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-0.5">Thank you for reporting this issue.</p>
          </div>
        </div>
      )}
    </>
  );
}
