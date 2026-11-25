"use client";

import {
  DailyMiniQuiz,
  WeeklyRevision,
  FullMockTest,
  UnitMockTest,
} from "@/components/TestCards";
import { ALL_UNITS } from "@/lib/questions";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useIsNativeApp } from "@/lib/useIsNativeApp";
import {
  Lock,
  PlayCircle,
  Download,
  ChevronRight,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getAllTestProgress,
  TestProgress,
} from "@/lib/testEngine";

export default function Home() {
  const { user, isGuest } = useAuth();
  const { isNativeApp, isReady } = useIsNativeApp();
  const [ongoingTests, setOngoingTests] = useState<TestProgress[]>([]);

  useEffect(() => {
    async function loadUserData() {
      if (user && user.uid !== "guest") {
        const progress = await getAllTestProgress(
          [user.email, user.uid].filter(Boolean) as string[]
        );
        setOngoingTests(progress);
      } else {
        setOngoingTests([]);
      }
    }
    loadUserData();
  }, [user]);

  const dailyQuizzes = [
    { id: "dq1", title: "Daily Practice Set 1", questions: 10, minutes: 15 },
    { id: "dq2", title: "Daily Practice Set 2", questions: 10, minutes: 15 },
    { id: "dq3", title: "Daily Practice Set 3", questions: 10, minutes: 15 },
    { id: "dq4", title: "Daily Practice Set 4", questions: 10, minutes: 15 },
  ];

  const weeklyRevisions = [
    { id: "wr1", topic: "Weekly Revision Set 1", questions: 50, minutes: 60 },
    { id: "wr2", topic: "Weekly Revision Set 2", questions: 50, minutes: 60 },
  ];

  const handleLockedClick = () => {
    window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"));
  };

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Web-Only Android App Banner (completely hidden inside Android APK) */}
      {isReady && !isNativeApp && (
        <section className="animate-pop-in">
          <div className="bg-bg-card border border-teal-500/25 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm card-pop">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-semibold text-text-primary">
                    LifeSci Prep Android App
                  </h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/12 text-teal-700 dark:text-teal-300">
                    v2.0 APK
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                  Install on your phone for offline PYQ practice and faster test loading.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://raw.githubusercontent.com/sokaito/lifescience-test-prep-web/master/public/lifesci-prep.apk"
                download="lifesci-prep.apk"
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-1.5 tab-click-anim"
              >
                <Download className="w-4 h-4" />
                <span>Download APK</span>
              </a>
              <button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open-apk-modal", {
                      detail: { showGuide: true },
                    })
                  );
                }}
                className="px-3.5 py-2.5 border border-border-subtle bg-bg-main hover:bg-bg-card text-text-primary text-xs sm:text-sm font-medium rounded-xl tab-click-anim"
              >
                Install Guide
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Ongoing Tests */}
      {!isGuest && ongoingTests.length > 0 && (
        <section className="space-y-4 animate-pop-in">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
            Continue Where You Left Off
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ongoingTests.map((test, idx) => {
              const answered = Object.keys(test.answers).length;
              const total = test.questions.length || 1;
              const pct = Math.round((answered / total) * 100);
              return (
                <div
                  key={test.testId}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  className="bg-bg-card rounded-2xl p-4 border border-teal-500/35 shadow-sm card-pop animate-pop-in flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="font-semibold text-text-primary text-sm sm:text-base truncate">
                        {test.testTitle || test.testId.toUpperCase()}
                      </h3>
                      <span className="text-xs font-medium text-teal-600 dark:text-teal-400 shrink-0">
                        {Math.floor(test.timeLeft / 60)}m left
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-main rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full bg-teal-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-secondary">
                      {answered} of {total} questions answered
                    </p>
                  </div>

                  <Link
                    href={`/exam/${test.testId}`}
                    className="w-full flex items-center justify-center py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl tab-click-anim"
                  >
                    <PlayCircle className="w-4 h-4 mr-1.5" />
                    Resume Test
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Daily Mini-Quizzes */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
            Daily Mini-Quizzes
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Quick 10-question drills in 15 minutes
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dailyQuizzes.map((quiz, idx) => (
            <div
              key={quiz.id}
              style={{ animationDelay: `${idx * 60}ms` }}
              className="animate-pop-in flex"
            >
              <DailyMiniQuiz
                {...quiz}
                isLocked={isGuest && idx > 0}
                onLockedClick={handleLockedClick}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Full Mock Test */}
      <section className="animate-pop-in" style={{ animationDelay: "180ms" }}>
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

      {/* Unit-Wise Practice */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
              Unit-Wise Practice
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Focused 50-question tests for each CSIR unit
            </p>
          </div>
          <Link
            href={isGuest ? "#" : "/test-series"}
            onClick={
              isGuest
                ? (e) => {
                    e.preventDefault();
                    handleLockedClick();
                  }
                : undefined
            }
            className={`text-xs sm:text-sm font-semibold inline-flex items-center gap-1 tab-click-anim ${
              isGuest
                ? "text-text-secondary"
                : "text-teal-600 dark:text-teal-400 hover:underline"
            }`}
          >
            {isGuest && <Lock className="w-3.5 h-3.5" />}
            <span>All {ALL_UNITS.length} Units</span>
            {!isGuest && <ChevronRight className="w-4 h-4" />}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(ALL_UNITS) ? ALL_UNITS : [])
            .slice(0, 6)
            .map((unit, idx) => (
              <div
                key={unit.id}
                style={{ animationDelay: `${(idx + 3) * 55}ms` }}
                className="animate-pop-in flex"
              >
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
      </section>

      {/* Weekly Revision */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
            Weekly Deep Dive
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Consolidated 50-question weekend revision
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weeklyRevisions.map((rev, idx) => (
            <div
              key={rev.id}
              style={{ animationDelay: `${(idx + 8) * 55}ms` }}
              className="animate-pop-in flex"
            >
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
