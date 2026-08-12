"use client";

import { DailyMiniQuiz, WeeklyRevision, FullMockTest, UnitMockTest } from "@/components/TestCards";
import { ALL_UNITS } from "@/lib/questions";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { ArrowRight, Lock, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllTestProgress, getCompletedUserTests, TestProgress, TestAttempt } from "@/lib/testEngine";

export default function Home() {
  const { user, userData, isGuest } = useAuth();
  const [ongoingTests, setOngoingTests] = useState<TestProgress[]>([]);
  const [completedTests, setCompletedTests] = useState<TestAttempt[]>([]);

  useEffect(() => {
    async function loadUserData() {
      if (user && user.uid !== "guest") {
        const [progress, completed] = await Promise.all([
          getAllTestProgress([user.email, user.uid].filter(Boolean) as string[]),
          getCompletedUserTests([user.email, user.uid].filter(Boolean) as string[])
        ]);
        setOngoingTests(progress);
        setCompletedTests(completed);
      } else {
        setOngoingTests([]);
        setCompletedTests([]);
      }
    }
    loadUserData();
  }, [user]);
  
  const dailyQuizzes = [
    { id: "dq1", title: "Daily Test 1", questions: 10, minutes: 15 },
    { id: "dq2", title: "Daily Test 2", questions: 10, minutes: 15 },
    { id: "dq3", title: "Daily Test 3", questions: 10, minutes: 15 },
    { id: "dq4", title: "Daily Test 4", questions: 10, minutes: 15 },
  ];

  const weeklyRevisions = [
    { id: "wr1", topic: "Weekly Test 1", questions: 50, minutes: 60 },
    { id: "wr2", topic: "Weekly Test 2", questions: 50, minutes: 60 },
  ];

  const handleLockedClick = () => {
    // Custom event to trigger Sidebar Login
    window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"));
  };

  return (
    <div className="max-w-screen-xl mx-auto space-y-10 md:space-y-16 pb-20 overflow-x-hidden pt-4 md:pt-0">
      {/* Hero / Greeting */}
      <div className="text-center md:text-left px-2">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight uppercase">
          {isGuest ? "Welcome, " : "Hey, "}
          <span className="text-teal-500 dark:text-teal-400">{isGuest ? "Guest Learner" : (userData?.name || "Winner")}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg font-bold mt-2 max-w-lg mx-auto md:mx-0 uppercase tracking-tight">
          {isGuest 
            ? "Unlocked: 1 Free Test. Sign in for full access." 
            : `Completed Tests: ${completedTests.length} | Keep up the great work!`
          }
        </p>
      </div>
      
      {/* Ongoing Tests */}
      {!isGuest && ongoingTests.length > 0 && (
        <section className="space-y-4 px-2">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter text-accent-main">Resume Tests</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ongoingTests.map(test => (
              <div key={test.testId} className="bg-bg-card rounded-2xl p-4 border-2 border-accent-main/30 shadow-md">
                <h3 className="font-bold text-text-primary text-lg mb-2 truncate">{test.testTitle || test.testId.toUpperCase()}</h3>
                <div className="flex items-center justify-between text-sm text-text-secondary mb-4 font-bold">
                  <span>Questions Left: {test.questions.length - Object.keys(test.answers).length}</span>
                  <span>{Math.floor(test.timeLeft / 60)}m left</span>
                </div>
                <Link href={`/exam/${test.testId}`} className="w-full flex items-center justify-center py-2.5 bg-accent-main text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                  <PlayCircle className="w-5 h-5 mr-2" /> Resume
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Daily Mini-Quizzes - Vertical List on Mobile */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 px-2">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">Daily Mini-Quizzes</h2>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">10 Questions • 15 Minutes</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
          {dailyQuizzes.map((quiz, idx) => (
            <div key={quiz.id} className={`flex justify-center animate-fade-in-up`} style={{ animationDelay: `${idx * 100}ms` }}>
              <DailyMiniQuiz 
                {...quiz} 
                isLocked={isGuest && idx > 0} 
                onLockedClick={handleLockedClick}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Full Mock Tests - Hero Style */}
      <section className="px-2">
        <FullMockTest 
          id="fm1"
          title="CSIR NET Life Sciences Mock Test 1" 
          questions={150} 
          minutes={180} 
          tags={["Part A", "Part B", "Part C", "All Units"]}
          isLocked={isGuest}
          onLockedClick={handleLockedClick}
        />
      </section>

      {/* Unit-Wise Practice - Compressed Grid */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 px-2 text-center md:text-left">
          <div className="w-full">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">Unit-Wise Practice</h2>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Foundational Reinforcement</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
          {(Array.isArray(ALL_UNITS) ? ALL_UNITS : []).slice(0, 6).map((unit, idx) => (
            <div key={unit.id} className="animate-fade-in-up" style={{ animationDelay: `${(idx + 4) * 100}ms` }}>
              <UnitMockTest 
                id={`random-unit-${unit.id}`}
                unitId={unit.id}
                title={unit.name}
                questions={50}
                minutes={60}
                isLocked={isGuest}
                onLockedClick={handleLockedClick}
              />
            </div>
          ))}
        </div>
        
        <div className="flex justify-center md:justify-end px-2">
           <Link 
            href={isGuest ? "#" : "/test-series"} 
            onClick={isGuest ? (e) => { e.preventDefault(); handleLockedClick(); } : undefined}
            className={`group flex items-center px-6 py-3 rounded-2xl text-sm font-black transition-all uppercase tracking-widest ${isGuest ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-800 hover:bg-teal-500 hover:text-white text-slate-600 dark:text-slate-300'}`}
           >
             {isGuest ? <Lock className="w-4 h-4 mr-2" /> : null}
             See All {ALL_UNITS.length} Units 
             {!isGuest && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
           </Link>
        </div>
      </section>

      {/* Weekly Revision - Large Cards */}
      <section className="space-y-6 pb-12">
        <div className="px-2">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">Weekly Deep Dive</h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Consolidated Learning</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
          {weeklyRevisions.map((rev, idx) => (
            <div key={rev.id} className="animate-fade-in-up" style={{ animationDelay: `${(idx + 10) * 100}ms` }}>
              <WeeklyRevision 
                {...rev} 
                isLocked={isGuest} 
                onLockedClick={handleLockedClick}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
