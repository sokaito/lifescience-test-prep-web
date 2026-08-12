import { db } from "./firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit
} from "firebase/firestore";
import { ALL_UNITS } from "./questions";
import { PYQ_PAPERS, fetchPYQQuestions, normalizePYQToStandard } from "./pyqRepository";
import { shuffleArray, normalizeString, compareAnswers } from "./utils";

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  randomKey: number; // Important for efficient randomization
  testId?: string;
  explanation?: string;
  type?: string;
  list_1?: string[];
  list_2?: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export interface TestAttempt {
  id?: string;
  userId: string;
  selectedQuestions: string[]; // Array of question IDs
  answers: Record<string, string>; // Maps questionId -> user's selected option
  score: number;
  totalQuestions: number;
  timestamp: any;
  testId?: string;
  accuracy: number;
  timeTaken: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  status: "completed" | "in-progress";
  questionsData?: Question[]; // Array of the fully generated question objects for this attempt
}

export interface TestProgress {
  id?: string;
  userId: string;
  testId: string;
  testTitle?: string;
  questions: Question[];
  currentQIndex: number;
  answers: Record<string, string>;
  timeLeft: number;
  updatedAt: any;
}


/**
 * Fetches the IDs of all questions the user has previously answered
 * to prevent giving them the exact same questions again.
 */
export async function getAnsweredQuestionIds(userId: string | string[]): Promise<Set<string>> {
  const ids = Array.isArray(userId) ? userId : [userId];
  if (!ids.length || ids.includes("guest") || !ids[0]) return new Set();
  
  try {
    const attemptsRef = collection(db, "testAttempts");
    const q = query(attemptsRef, where("userId", "in", ids));
    const snapshot = await getDocs(q);
    
    const answeredSet = new Set<string>();
    snapshot.forEach(doc => {
      const data = doc.data() as TestAttempt;
      if (data.selectedQuestions) {
        data.selectedQuestions.forEach(id => answeredSet.add(id));
      }
    });
    
    return answeredSet;
  } catch (err) {
    console.warn("Failed to fetch answered questions (permissions?):", err);
    return new Set();
  }
}

/**
 * Procedurally selects random questions from the database while trying to avoid 
 * ones the user has already answered.
 */
export async function generateRandomTest(userId: string, count: number, unitId?: number): Promise<Question[]> {
  const questionsRef = collection(db, "questions");

  // Determine query based on whether a unitId is provided or not
  let qSeq;
  if (unitId !== undefined) {
    // Simple query: fetch up to 300 questions for this unit. No composite index needed.
    qSeq = query(questionsRef, where("unitId", "==", unitId), limit(300));
  } else {
    // Simple query: fetch up to 300 questions from the entire bank.
    qSeq = query(questionsRef, limit(300));
  }
  
  let candidates: Question[] = [];
  try {
    const snapshot = await getDocs(qSeq);
    snapshot.forEach(docSnapshot => {
      const data = docSnapshot.data();
      if (data.question && Array.isArray(data.options) && data.options.length > 0) {
        candidates.push({ id: docSnapshot.id, ...data } as Question);
      }
    });
  } catch (err: any) {
    console.warn("Firestore access failed (likely permissions). Falling back to static questions.", err);
    // candidates remains empty, falling through to static logic below
  }

  // FALLBACK: If database is empty, use static questions from QuestionSeeder
  if (candidates.length === 0) {
    if (unitId !== undefined) {
      const unit = ALL_UNITS.find(u => u.id === unitId);
      if (unit && unit.questions) {
        candidates = unit.questions.map((q, idx) => ({
          ...q,
          id: `static-${unitId}-${idx}`,
          randomKey: Math.random()
        })) as Question[];
      }
    } else {
      // For general random tests, grab from all units
      ALL_UNITS.forEach(unit => {
        if (unit.questions) {
          const formatted = unit.questions.map((q, idx) => ({
            ...q,
            id: `static-${unit.id}-${idx}`,
            randomKey: Math.random()
          })) as Question[];
          candidates = [...candidates, ...formatted];
        }
      });
    }
  }

  // Supplement the pool with questions from the PYQ repository
  // This helps avoid manual additions to questions.ts and keeps the test fresh
  try {
    // Pick 3 random papers to pull from
    const shuffledPapers = [...PYQ_PAPERS].sort(() => 0.5 - Math.random());
    const selectedPapers = shuffledPapers.slice(0, 3);
    
    for (const paper of selectedPapers) {
      const pyqData = await fetchPYQQuestions(paper.exam, paper.year);
      if (pyqData && pyqData.length > 0) {
        // If a unitId is specified, we try to filter PYQ questions by that unit if they have a 'unit' tag
        // Otherwise we just take all of them. Note: current PYQ schema doesn't have unitId, 
        // so we just take a subset to keep the pool balanced.
        const normalized = pyqData
          .slice(0, 30) // Only take first 30 from each paper to keep fetch small and pool balanced
          .map(q => normalizePYQToStandard(q, `${paper.exam}-${paper.year}`));
        candidates = [...candidates, ...normalized];
      }
    }
  } catch (err) {
    console.warn("Failed to fetch PYQ questions for random pool:", err);
  }
  
  // Shuffle all fetched candidates locally so the test feels random each time
  candidates = shuffleArray(candidates);
  
  // Pad the candidates if we don't have enough to meet the count 
  // (User said "if question repets its okk")
  let finalQuestions: Question[] = [];
  if (candidates.length > 0) {
    while (finalQuestions.length < count) {
      // Pick next candidate (looping around)
      const qd = candidates[finalQuestions.length % candidates.length];
      
      // We must new object so shuffling options doesn't affect the previous copy
      // and give it a unique ID for the UI palette to work properly
      finalQuestions.push({
        ...qd,
        id: `${qd.id}-repeat-${finalQuestions.length}`,
        options: shuffleArray(qd.options || [])
      });
    }
  }

  return finalQuestions;
}


/**
 * Saves a completed test log to Firestore.
 */
export async function submitTestAttempt(
  userId: string, 
  questions: Question[], 
  userAnswers: Record<string, string>,
  testId: string = "unknown",
  timeTaken: number = 0
): Promise<string> {
  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  
  // Grade the test securely before saving
  questions.forEach(q => {
    const userAnswer = userAnswers[q.id];
    if (userAnswer === undefined || userAnswer.toString().trim() === "") {
      unattemptedCount++;
    } else if (compareAnswers(userAnswer, q.correctAnswer)) {
      score += 1;
      correctCount++;
    } else {
      score -= 0.5;
      incorrectCount++;
    }
  });

  const attemptedCount = questions.length - unattemptedCount;
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  const attemptData: Omit<TestAttempt, 'id'> = {
    userId,
    selectedQuestions: questions.map(q => q.id),
    answers: userAnswers,
    score,
    totalQuestions: questions.length,
    timestamp: serverTimestamp(),
    testId,
    accuracy,
    timeTaken,
    correctCount,
    incorrectCount,
    unattemptedCount,
    status: "completed",
    questionsData: questions
  };

  let attemptId = "guest_attempt_" + Date.now();
  
  if (userId !== "guest") {
    try {
      const attemptsRef = collection(db, "testAttempts");
      const docRef = await addDoc(attemptsRef, attemptData);
      attemptId = docRef.id;
    } catch (err) {
      console.error("Failed to save attempt to Firestore:", err);
      // Re-throw so the UI knows it actually failed
      throw new Error("Could not save results to database. Please check your internet and permissions.");
    }
  } else {
    // For guests, we cannot save to Firestore due to permissions.
    // We save to sessionStorage so the results page can retrieve it.
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`last_result_${attemptId}`, JSON.stringify({ id: attemptId, ...attemptData }));
    }
  }
  
  // Delete the progress document if it exists to mark as completed
  // Wrap in try-catch so if delete fails (permissions), the submission still counts
  if (testId && userId !== "guest") {
    try {
      const progressDocId = `${userId}_${testId}`;
      await deleteDoc(doc(db, "testProgress", progressDocId));
    } catch (e) {
      console.warn("Failed to delete progress doc (non-critical):", e);
    }
  }
  
  return attemptId;
}

/**
 * Saves the current progress of a test.
 */
export async function saveTestProgress(
  userId: string,
  testId: string,
  progressData: Partial<TestProgress>
) {
  if (!userId || userId === "guest" || !testId) return;
  const progressDocId = `${userId}_${testId}`;
  
  const data = {
    ...progressData,
    userId,
    testId,
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, "testProgress", progressDocId), data, { merge: true });
}

/**
 * Retrieves the saved progress for a test.
 */
export async function getTestProgress(userId: string | string[], testId: string): Promise<TestProgress | null> {
  const ids = Array.isArray(userId) ? userId : [userId];
  if (!ids.length || ids.includes("guest") || !testId) return null;
  
  try {
    for (const id of ids) {
      if (!id) continue;
      const progressDocId = `${id}_${testId}`;
      const docSnap = await getDoc(doc(db, "testProgress", progressDocId));
      if (docSnap.exists()) {
        return docSnap.data() as TestProgress;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch test progress (permissions?):", err);
  }
  return null;
}

/**
 * Retrieves all saved progress files for a user.
 */
export async function getAllTestProgress(userId: string | string[]): Promise<TestProgress[]> {
  const ids = Array.isArray(userId) ? userId : [userId];
  if (!ids.length || ids.includes("guest") || !ids[0]) return [];
  
  try {
    const progressRef = collection(db, "testProgress");
    const q = query(progressRef, where("userId", "in", ids));
    const snapshot = await getDocs(q);
    
    const results: TestProgress[] = [];
    snapshot.forEach(docSnap => {
      results.push({ id: docSnap.id, ...docSnap.data() } as TestProgress);
    });
    
    return results;
  } catch (err) {
    console.warn("Failed to fetch all test progress (permissions?):", err);
    return [];
  }
}

/**
 * Retrieves completed test stats for dashboard.
 */
export async function getCompletedUserTests(userId: string | string[]): Promise<TestAttempt[]> {
  const ids = Array.isArray(userId) ? userId : [userId];
  if (!ids.length || ids.includes("guest") || !ids[0]) return [];
  
  const attemptsRef = collection(db, "testAttempts");
  const q = query(attemptsRef, where("userId", "in", ids));
  const snapshot = await getDocs(q);
  
  const results: TestAttempt[] = [];
  snapshot.forEach(docSnap => {
    results.push({ id: docSnap.id, ...docSnap.data() } as TestAttempt);
  });
  
  return results;
}

/**
 * Retrieves a specific test attempt by ID.
 */
export async function getTestAttemptById(attemptId: string): Promise<TestAttempt | null> {
  const docRef = doc(db, "testAttempts", attemptId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as TestAttempt;
  }
  return null;
}

