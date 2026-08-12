"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  setDoc,
  serverTimestamp 
} from "firebase/firestore";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  CheckCircle, 
  Edit2, 
  Trash2, 
  User, 
  Mail, 
  FileText, 
  ExternalLink, 
  ShieldAlert, 
  Check, 
  Save, 
  X, 
  Clock,
  Loader2
} from "lucide-react";
import Link from "next/link";

interface ReportedQuestion {
  id: string;
  reportId: string;
  questionId: string;
  questionNumber: number;
  examName: string;
  year: string | null;
  subject: string;
  topic: string;
  difficulty: string;
  questionText: string;
  correctAnswer: string;
  sourceType: string;
  issueType: string;
  userMessage: string;
  currentPageUrl: string;
  userId: string;
  userEmail: string;
  status: "pending" | "resolved";
  adminNotes: string;
  createdAt: any;
  resolvedAt: any;
}

interface QuestionDetails {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  unitId?: number;
  unitName?: string;
}

function AdminReportedQuestionsContent() {
  const { userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySearch = searchParams.get("search") || "";

  const [reports, setReports] = useState<ReportedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(querySearch);
  const [filterExam, setFilterExam] = useState("");
  const [filterIssueType, setFilterIssueType] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [stats, setStats] = useState({ pending: 0, resolved: 0, total: 0 });

  // Admin notes editor state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesTempText, setNotesTempText] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Question editor state
  const [editingQuestionReport, setEditingQuestionReport] = useState<ReportedQuestion | null>(null);
  const [editQuestionDetails, setEditQuestionDetails] = useState<QuestionDetails | null>(null);
  const [isLoadingQuestionDetails, setIsLoadingQuestionDetails] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Shorthand list of unique exams and issues for filters
  const [exams, setExams] = useState<string[]>([]);
  const [issueTypes, setIssueTypes] = useState<string[]>([]);

  // 1. Redirect if not admin
  useEffect(() => {
    if (userData && userData.role !== "admin") {
      router.push("/");
    }
  }, [userData, router]);

  // 2. Fetch reports from Firestore
  const fetchReports = async () => {
    setLoading(true);
    try {
      const reportsRef = collection(db, "reportedQuestions");
      const q = query(reportsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetched: ReportedQuestion[] = [];
      
      let pCount = 0;
      let rCount = 0;
      const examSet = new Set<string>();
      const issueSet = new Set<string>();

      snapshot.forEach((d) => {
        const data = d.data() as ReportedQuestion;
        fetched.push({ ...data, id: d.id });

        if (data.status === "resolved") rCount++;
        else pCount++;

        if (data.examName) examSet.add(data.examName);
        if (data.issueType) issueSet.add(data.issueType);
      });

      setReports(fetched);
      setStats({ pending: pCount, resolved: rCount, total: fetched.length });
      setExams(Array.from(examSet));
      setIssueTypes(Array.from(issueSet));
    } catch (e) {
      console.error("Error loading issue reports:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.role === "admin") {
      fetchReports();
    }
  }, [userData]);

  if (!userData || userData.role !== "admin") {
    return null; // Handled by redirect
  }

  // 3. Mark report as Resolved
  const handleResolve = async (report: ReportedQuestion) => {
    try {
      const docRef = doc(db, "reportedQuestions", report.id);
      await updateDoc(docRef, {
        status: "resolved",
        resolvedAt: serverTimestamp()
      });
      // Live reload/update local state
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: "resolved", resolvedAt: new Date() } : r));
      setStats(prev => ({ ...prev, pending: prev.pending - 1, resolved: prev.resolved + 1 }));
    } catch (e) {
      alert("Failed to resolve report: " + (e as any).message);
    }
  };

  // 4. Delete report
  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report record? This will delete the report permanently.")) return;
    try {
      const docRef = doc(db, "reportedQuestions", reportId);
      await deleteDoc(docRef);
      setReports(prev => prev.filter(r => r.id !== reportId));
      fetchReports(); // Refresh stats
    } catch (e) {
      alert("Failed to delete report: " + (e as any).message);
    }
  };

  // 5. Notes inline actions
  const startEditingNotes = (report: ReportedQuestion) => {
    setEditingNotesId(report.id);
    setNotesTempText(report.adminNotes || "");
  };

  const handleSaveNotes = async (reportId: string) => {
    setIsSavingNotes(true);
    try {
      const docRef = doc(db, "reportedQuestions", reportId);
      await updateDoc(docRef, {
        adminNotes: notesTempText
      });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, adminNotes: notesTempText } : r));
      setEditingNotesId(null);
    } catch (e) {
      alert("Failed to save notes: " + (e as any).message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // 6. Inline Question editing operations
  const startEditingQuestion = async (report: ReportedQuestion) => {
    setEditingQuestionReport(report);
    setIsLoadingQuestionDetails(true);
    setEditError(null);

    try {
      const qRef = doc(db, "questions", report.questionId);
      const snap = await getDoc(qRef);

      if (snap.exists()) {
        const data = snap.data();
        setEditQuestionDetails({
          question: data.question || report.questionText,
          options: data.options || ["", "", "", ""],
          correctAnswer: data.correctAnswer || report.correctAnswer,
          explanation: data.explanation || "",
          unitId: data.unitId,
          unitName: data.unitName
        });
      } else {
        // Fallback: Populate form with report metadata if doc doesn't exist yet
        setEditQuestionDetails({
          question: report.questionText,
          options: ["", "", "", ""], // Placeholder options
          correctAnswer: report.correctAnswer,
          explanation: ""
        });
      }
    } catch (e: any) {
      setEditError("Failed to fetch current question from database: " + e.message);
    } finally {
      setIsLoadingQuestionDetails(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestionReport || !editQuestionDetails) return;

    setIsSavingQuestion(true);
    setEditError(null);

    try {
      const qRef = doc(db, "questions", editingQuestionReport.questionId);
      
      // Save changes to Firestore questions collection
      await setDoc(qRef, {
        question: editQuestionDetails.question,
        options: editQuestionDetails.options,
        correctAnswer: editQuestionDetails.correctAnswer,
        explanation: editQuestionDetails.explanation,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update question text inside the reportedQuestions document to match new edit
      const reportRef = doc(db, "reportedQuestions", editingQuestionReport.id);
      await updateDoc(reportRef, {
        questionText: editQuestionDetails.question,
        correctAnswer: editQuestionDetails.correctAnswer
      });

      // Update local reports list immediately
      setReports(prev => prev.map(r => r.id === editingQuestionReport.id 
        ? { ...r, questionText: editQuestionDetails.question, correctAnswer: editQuestionDetails.correctAnswer } 
        : r
      ));

      setEditingQuestionReport(null);
      setEditQuestionDetails(null);
      alert("Question updated successfully! This will override all future queries for this question.");
    } catch (e: any) {
      setEditError("Failed to save changes: " + e.message);
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    if (!editQuestionDetails) return;
    const updatedOptions = [...editQuestionDetails.options];
    updatedOptions[idx] = val;
    setEditQuestionDetails({ ...editQuestionDetails, options: updatedOptions });
  };

  // 7. Filtering & Searching logic
  const filteredReports = reports.filter((r) => {
    const matchesSearch = 
      r.questionId.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.questionText.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.userMessage && r.userMessage.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesExam = filterExam ? r.examName === filterExam : true;
    const matchesIssue = filterIssueType ? r.issueType === filterIssueType : true;
    const matchesStatus = filterStatus ? r.status === filterStatus : true;

    return matchesSearch && matchesExam && matchesIssue && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 md:py-12 px-4 space-y-8 transition-colors pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div className="flex items-center space-x-3">
          <Link href="/admin" className="p-2 bg-bg-card border border-border-subtle rounded-xl hover:bg-bg-main transition-colors text-text-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-text-primary tracking-tight leading-tight uppercase">Reported Questions</h1>
            <p className="text-text-secondary text-sm font-medium mt-1">Review student feedback and resolve dataset errors.</p>
          </div>
        </div>
        
        <button
          onClick={fetchReports}
          className="px-4 py-2 border border-border-subtle bg-bg-card hover:bg-bg-main rounded-xl text-xs font-bold text-text-secondary uppercase tracking-widest transition-all shrink-0"
        >
          Refresh Feed
        </button>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-card p-4 rounded-2xl border border-border-subtle shadow-sm text-center">
          <div className="text-[10px] font-black uppercase text-amber-500 tracking-wider mb-1">Pending</div>
          <div className="text-2xl font-black text-text-primary">{stats.pending}</div>
        </div>
        <div className="bg-bg-card p-4 rounded-2xl border border-border-subtle shadow-sm text-center">
          <div className="text-[10px] font-black uppercase text-emerald-500 tracking-wider mb-1">Resolved</div>
          <div className="text-2xl font-black text-text-primary">{stats.resolved}</div>
        </div>
        <div className="bg-bg-card p-4 rounded-2xl border border-border-subtle shadow-sm text-center">
          <div className="text-[10px] font-black uppercase text-text-secondary tracking-wider mb-1">Total Reports</div>
          <div className="text-2xl font-black text-text-primary">{stats.total}</div>
        </div>
      </div>

      {/* Filters & Searching Toolbar */}
      <div className="bg-bg-card border border-border-subtle p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, question, email, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-subtle bg-bg-main text-text-primary text-sm focus:border-accent-main transition-all font-medium"
            />
          </div>

          {/* Status selector */}
          <div className="flex p-1.5 bg-bg-main rounded-xl border border-border-subtle max-w-xs">
            <button
              onClick={() => setFilterStatus("pending")}
              className={`flex-1 py-1.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filterStatus === "pending" ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus("resolved")}
              className={`flex-1 py-1.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filterStatus === "resolved" ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Resolved
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-subtle/50">
          <div>
            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Filter by Exam</label>
            <select
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-bg-main text-text-primary text-xs focus:border-accent-main transition-all font-semibold"
            >
              <option value="">All Exams</option>
              {exams.map(ex => <option key={ex} value={ex}>{ex.toUpperCase()}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Filter by Issue Type</label>
            <select
              value={filterIssueType}
              onChange={(e) => setFilterIssueType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-bg-main text-text-primary text-xs focus:border-accent-main transition-all font-semibold"
            >
              <option value="">All Issues</option>
              {issueTypes.map(it => <option key={it} value={it}>{it}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-10 h-10 text-accent-main animate-spin mx-auto mb-4" />
          <p className="text-text-secondary font-bold uppercase tracking-widest text-sm">Loading Reports feed...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-bg-card border border-border-subtle rounded-3xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-text-primary uppercase tracking-tight mb-2">No Reports Found</h3>
          <p className="text-text-secondary font-medium text-sm">Everything looks clean! There are no reports matching the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredReports.map((report) => {
            const isEditingNotes = editingNotesId === report.id;
            const dateStr = report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString();

            return (
              <div key={report.id} className={`bg-bg-card border rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all ${report.status === "resolved" ? 'border-emerald-100 dark:border-emerald-950/20' : 'border-border-subtle'}`}>
                {/* Top Badge Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      report.status === "resolved" ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    }`}>
                      {report.status}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-text-secondary uppercase">
                      {report.issueType}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-[10px] font-bold text-accent-main uppercase">
                      {report.examName} {report.year ? `(${report.year})` : ""}
                    </span>
                    <span className="text-[10px] text-text-secondary font-medium">
                      Q#{report.questionNumber} ({report.sourceType})
                    </span>
                  </div>

                  <div className="text-[10px] text-text-secondary font-semibold">
                    Reported on: {dateStr}
                  </div>
                </div>

                {/* Content Split: Question Text & User Feedback */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-border-subtle/50">
                  {/* Left Column: Original Question Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary">Question Detail (ID: #{report.questionId})</h4>
                    <div className="bg-bg-main p-4 rounded-2xl border border-border-subtle max-h-48 overflow-y-auto text-sm leading-relaxed text-text-primary">
                      <div dangerouslySetInnerHTML={{ __html: report.questionText }} />
                      <div className="mt-4 pt-3 border-t border-border-subtle/50">
                        <span className="text-[10px] font-black text-text-secondary uppercase block mb-1">Correct Answer</span>
                        <span className="font-bold text-accent-main" dangerouslySetInnerHTML={{ __html: report.correctAnswer }} />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: User report reason & comment */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary">Student Feedback</h4>
                    <div className="bg-bg-main p-4 rounded-2xl border border-border-subtle h-48 overflow-y-auto space-y-3">
                      <div className="flex items-center space-x-2 text-xs text-text-secondary border-b border-border-subtle/50 pb-2">
                        <User className="w-3.5 h-3.5" />
                        <span>{report.userEmail} ({report.userId})</span>
                      </div>
                      <p className="text-sm font-medium text-text-primary italic leading-relaxed">
                        "{report.userMessage || "No additional comments left by student."}"
                      </p>
                      {report.currentPageUrl && (
                        <a
                          href={report.currentPageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-[10px] font-bold text-accent-main hover:underline uppercase pt-2"
                        >
                          <span>Open original page</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Notes Section */}
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Admin Notes</span>
                    {!isEditingNotes && (
                      <button 
                        onClick={() => startEditingNotes(report)}
                        className="text-[10px] font-bold text-accent-main hover:underline uppercase"
                      >
                        Edit Notes
                      </button>
                    )}
                  </div>
                  {isEditingNotes ? (
                    <div className="space-y-3">
                      <textarea
                        value={notesTempText}
                        onChange={(e) => setNotesTempText(e.target.value)}
                        placeholder="Write admin review comments here..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-card text-text-primary text-xs font-medium"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveNotes(report.id)}
                          disabled={isSavingNotes}
                          className="px-3 py-1.5 bg-accent-main text-white font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center space-x-1"
                        >
                          {isSavingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => setEditingNotesId(null)}
                          disabled={isSavingNotes}
                          className="px-3 py-1.5 bg-bg-main text-text-secondary border border-border-subtle font-bold rounded-lg text-[10px] uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary font-medium leading-relaxed italic">
                      {report.adminNotes || "No notes added by admin yet."}
                    </p>
                  )}
                </div>

                {/* Card Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-border-subtle/50">
                  <div className="flex items-center space-x-2">
                    {report.status === "pending" ? (
                      <button
                        onClick={() => handleResolve(report)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-sm shadow-emerald-500/20"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Resolve Report</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                        <Check className="w-4 h-4" />
                        <span>Resolved</span>
                      </div>
                    )}

                    <button
                      onClick={() => startEditingQuestion(report)}
                      className="px-4 py-2 border border-border-subtle bg-bg-card hover:bg-bg-main rounded-xl text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center space-x-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Question</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="p-2 border border-rose-100 hover:border-rose-300 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl text-rose-500 dark:text-rose-400 transition-colors"
                    title="Delete report log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editing Question Modal Overlay */}
      {editingQuestionReport && editQuestionDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="bg-bg-card w-full max-w-2xl rounded-[2.5rem] border border-border-subtle shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-main/30">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-accent-main" />
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Edit Question ID: #{editingQuestionReport.questionId}</h3>
              </div>
              <button
                onClick={() => {
                  setEditingQuestionReport(null);
                  setEditQuestionDetails(null);
                }}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-main transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editor form content */}
            {isLoadingQuestionDetails ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 text-accent-main animate-spin mx-auto mb-2" />
                <p className="text-text-secondary text-xs uppercase font-bold tracking-widest">Fetching details...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveQuestion} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {editError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl">
                    {editError}
                  </div>
                )}

                {/* Question Text */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Question Text (HTML supported)</label>
                  <textarea
                    value={editQuestionDetails.question}
                    onChange={(e) => setEditQuestionDetails({ ...editQuestionDetails, question: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-bg-main text-text-primary text-sm font-medium focus:border-accent-main"
                  />
                </div>

                {/* Option fields */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">Options (Provide exactly 4 options)</label>
                  {editQuestionDetails.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-text-secondary shrink-0 w-6">#{idx + 1}:</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl border border-border-subtle bg-bg-main text-text-primary text-sm font-medium focus:border-accent-main"
                        placeholder={`Option ${idx + 1} text`}
                        required
                      />
                    </div>
                  ))}
                </div>

                {/* Correct Answer Selector */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Correct Answer</label>
                  <select
                    value={editQuestionDetails.correctAnswer}
                    onChange={(e) => setEditQuestionDetails({ ...editQuestionDetails, correctAnswer: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-bg-main text-text-primary text-sm font-medium focus:border-accent-main"
                  >
                    <option value="">Select correct option matching text...</option>
                    {editQuestionDetails.options.map((opt, idx) => (
                      <option key={idx} value={opt}>
                        Option #{idx + 1}: {opt.substring(0, 50)}...
                      </option>
                    ))}
                    {/* Fallback to text option in case answers don't match exactly */}
                    {!editQuestionDetails.options.includes(editQuestionDetails.correctAnswer) && (
                      <option value={editQuestionDetails.correctAnswer}>
                        Current Answer Override: {editQuestionDetails.correctAnswer}
                      </option>
                    )}
                  </select>
                  <p className="text-[10px] text-text-secondary mt-1 font-semibold">Make sure the selection matches one of the option values exactly.</p>
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Explanation</label>
                  <textarea
                    value={editQuestionDetails.explanation}
                    onChange={(e) => setEditQuestionDetails({ ...editQuestionDetails, explanation: e.target.value })}
                    rows={3}
                    placeholder="Provide step-by-step reasoning..."
                    className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-bg-main text-text-primary text-sm font-medium focus:border-accent-main"
                  />
                </div>

                {/* Save button actions */}
                <div className="flex items-center space-x-3 pt-4 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestionReport(null);
                      setEditQuestionDetails(null);
                    }}
                    disabled={isSavingQuestion}
                    className="flex-1 py-3 border border-border-subtle bg-bg-main hover:bg-bg-card text-text-secondary font-bold rounded-xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingQuestion}
                    className="flex-1 py-3 bg-accent-main hover:opacity-90 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center space-x-2"
                  >
                    {isSavingQuestion ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Override...</span>
                      </>
                    ) : (
                      <span>Save Question Changes</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminReportedQuestionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-accent-main animate-spin mb-4" />
        <p className="text-text-secondary font-bold uppercase tracking-widest text-sm">Loading admin dashboard...</p>
      </div>
    }>
      <AdminReportedQuestionsContent />
    </Suspense>
  );
}
