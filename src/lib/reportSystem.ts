import { db } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp, 
  increment 
} from "firebase/firestore";

export interface QuestionReportInput {
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
  issueType: string;
  userMessage: string;
  currentPageUrl: string;
  userId: string | null;
  userEmail: string | null;
}

/**
 * Submits a question issue report to Firestore and updates reportCount.
 */
export async function submitQuestionReport(input: QuestionReportInput): Promise<string> {
  try {
    const reportsRef = collection(db, "reportedQuestions");
    const newReportRef = doc(reportsRef);
    const reportId = newReportRef.id;

    // 1. Save report to Firestore reportedQuestions collection
    const reportDoc = {
      reportId,
      questionId: input.questionId,
      questionNumber: input.questionNumber,
      examName: input.examName || "unknown",
      year: input.year || "",
      subject: input.subject || "",
      topic: input.topic || "",
      difficulty: input.difficulty || "",
      questionText: input.questionText || "",
      correctAnswer: input.correctAnswer || "",
      sourceType: input.sourceType || "practice",
      issueType: input.issueType,
      userMessage: input.userMessage || "",
      currentPageUrl: input.currentPageUrl || "",
      userId: input.userId || "guest",
      userEmail: input.userEmail || "guest",
      status: "pending",
      adminNotes: "",
      createdAt: serverTimestamp(),
      resolvedAt: null
    };

    await setDoc(newReportRef, reportDoc);

    // 2. Increment reportCount in the original questions collection
    // Works for seeded, static, and PYQ questions because we merge.
    const questionRef = doc(db, "questions", input.questionId);
    await setDoc(questionRef, { 
      reportCount: increment(1),
      lastReportedAt: serverTimestamp()
    }, { merge: true });

    // 3. Prepare future-ready email payload (logged for backend compatibility)
    const emailPayload = prepareEmailNotificationPayload(reportId, input);
    console.log("Future-Ready Email Notification Payload Prepared:", JSON.stringify(emailPayload, null, 2));

    return reportId;
  } catch (error) {
    console.error("Error submitting question report:", error);
    throw new Error("Failed to submit the report. Please try again.");
  }
}

/**
 * Prepares the payload for future email notifications (compatible with Resend, EmailJS, Webhooks).
 */
export function prepareEmailNotificationPayload(reportId: string, input: QuestionReportInput) {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const directAdminLink = `${origin}/admin/reported-questions?search=${encodeURIComponent(input.questionId)}`;

  return {
    template: "question_issue_report",
    metadata: {
      reportId,
      providerCompatible: ["resend", "emailjs", "firebase-functions", "vercel-api"]
    },
    emailContent: {
      to: "admin@lifesci-prep.com", // Target administrator inbox
      subject: `[Issue Report] ${input.issueType} - ${input.examName} (${input.year || "Practice"})`,
      body: {
        exam: input.examName,
        year: input.year || "N/A",
        questionNumber: input.questionNumber,
        questionId: input.questionId,
        issueType: input.issueType,
        userMessage: input.userMessage || "No description provided.",
        userEmail: input.userEmail || "Guest User",
        timestamp: new Date().toISOString(),
        directAdminLink: directAdminLink
      }
    }
  };
}
