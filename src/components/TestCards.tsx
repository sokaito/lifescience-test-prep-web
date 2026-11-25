"use client";

import { Clock, CheckSquare, Target, PlayCircle, Lock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { ENABLE_TOKEN_SYSTEM } from "@/lib/constants";

async function handleTokenDeduct(
  userId: string,
  cost: number,
  testId: string,
  testType: string
) {
  const res = await fetch("/api/tokens/deduct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, cost, testId, testType }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to deduct tokens");
  return data;
}

export function DailyMiniQuiz({
  title,
  questions,
  minutes,
  id,
  isLocked,
  onLockedClick,
}: {
  title: string;
  questions: number;
  minutes: number;
  id: string;
  isLocked?: boolean;
  onLockedClick?: () => void;
}) {
  const cost = 1;
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, userData, updateProfileData, isGuest } = useAuth();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked) {
      onLockedClick?.();
    } else if (!isGuest && !user) {
      window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"));
    } else {
      if (isGuest || !ENABLE_TOKEN_SYSTEM) {
        router.push(`/exam/${id}`);
      } else {
        setIsLoading(true);
        try {
          const currentTokens = userData?.tokens ?? 0;
          if (currentTokens < cost) {
            router.push("/dashboard/tokens");
            return;
          }
          const data = await handleTokenDeduct(
            user?.uid || user?.email || "unknown",
            cost,
            id,
            "Daily Quiz"
          );
          await updateProfileData({ tokens: data.newBalance });
          router.push(`/exam/${id}`);
        } catch (err: any) {
          alert(err.message);
        }
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`w-full bg-bg-card rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-sm hover:shadow-md hover:border-teal-500/35 transition-all cursor-pointer group flex flex-col justify-between ${
        isLocked ? "opacity-75" : ""
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="bg-teal-500/10 text-teal-700 dark:text-teal-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            Daily Quiz
          </span>
          {isLocked ? (
            <Lock className="w-4 h-4 text-amber-500" />
          ) : (
            <Target className="w-4 h-4 text-text-secondary group-hover:text-teal-600 transition-colors" />
          )}
        </div>
        <h3
          className="font-semibold text-text-primary text-base mb-2.5 line-clamp-2 leading-snug"
          title={title}
        >
          {title}
        </h3>
        <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
          <span className="inline-flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5" />
            {questions} Qs
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {minutes} min
          </span>
        </div>
      </div>

      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center transition-colors ${
          isLocked
            ? "bg-bg-main text-text-secondary border border-border-subtle"
            : "bg-teal-500/12 text-teal-700 dark:text-teal-300 hover:bg-teal-600 hover:text-white"
        } ${isLoading ? "opacity-70 cursor-wait" : ""}`}
      >
        {isLoading ? (
          "Starting..."
        ) : isLocked ? (
          <>
            <Lock className="w-3.5 h-3.5 mr-1.5" /> Sign in to unlock
          </>
        ) : (
          <>
            <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Start Quiz
          </>
        )}
      </button>
    </div>
  );
}

export function UnitMockTest({
  title,
  questions,
  minutes,
  id,
  unitId,
  isLocked,
  onLockedClick,
}: {
  title: string;
  questions: number;
  minutes: number;
  id: string;
  unitId: number;
  isLocked?: boolean;
  onLockedClick?: () => void;
}) {
  const cost = 5;
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, userData, updateProfileData, isGuest } = useAuth();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked) {
      onLockedClick?.();
    } else if (!isGuest && !user) {
      window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"));
    } else {
      if (isGuest || !ENABLE_TOKEN_SYSTEM) {
        router.push(`/exam/${id}`);
      } else {
        setIsLoading(true);
        try {
          const currentTokens = userData?.tokens ?? 0;
          if (currentTokens < cost) {
            router.push("/dashboard/tokens");
            return;
          }
          const data = await handleTokenDeduct(
            user?.uid || user?.email || "unknown",
            cost,
            id,
            "Unit Test"
          );
          await updateProfileData({ tokens: data.newBalance });
          router.push(`/exam/${id}`);
        } catch (err: any) {
          alert(err.message);
        }
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`w-full bg-bg-card rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-sm hover:shadow-md hover:border-amber-500/35 transition-all cursor-pointer group flex flex-col justify-between ${
        isLocked ? "opacity-75" : ""
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            Unit {unitId}
          </span>
          {isLocked ? (
            <Lock className="w-4 h-4 text-amber-500" />
          ) : (
            <Target className="w-4 h-4 text-text-secondary group-hover:text-amber-500 transition-colors" />
          )}
        </div>
        <h3
          className="font-semibold text-text-primary text-base mb-2.5 line-clamp-2 leading-snug"
          title={title}
        >
          {title}
        </h3>
        <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
          <span className="inline-flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5" />
            {questions} Qs
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {minutes} min
          </span>
        </div>
      </div>

      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center transition-colors ${
          isLocked
            ? "bg-bg-main text-text-secondary border border-border-subtle"
            : "bg-amber-500/12 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white"
        } ${isLoading ? "opacity-70 cursor-wait" : ""}`}
      >
        {isLoading ? (
          "Starting..."
        ) : isLocked ? (
          <>
            <Lock className="w-3.5 h-3.5 mr-1.5" /> Unlock Unit
          </>
        ) : (
          <>
            <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Start Practice
          </>
        )}
      </button>
    </div>
  );
}

export function WeeklyRevision({
  topic,
  questions,
  minutes,
  id,
  isLocked,
  onLockedClick,
}: {
  topic: string;
  questions: number;
  minutes: number;
  id: string;
  isLocked?: boolean;
  onLockedClick?: () => void;
}) {
  const cost = 5;
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, userData, updateProfileData, isGuest } = useAuth();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked) {
      onLockedClick?.();
    } else if (!isGuest && !user) {
      window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"));
    } else {
      if (isGuest || !ENABLE_TOKEN_SYSTEM) {
        router.push(`/exam/${id}`);
      } else {
        setIsLoading(true);
        try {
          const currentTokens = userData?.tokens ?? 0;
          if (currentTokens < cost) {
            router.push("/dashboard/tokens");
            return;
          }
          const data = await handleTokenDeduct(
            user?.uid || user?.email || "unknown",
            cost,
            id,
            "Weekly Revision"
          );
          await updateProfileData({ tokens: data.newBalance });
          router.push(`/exam/${id}`);
        } catch (err: any) {
          alert(err.message);
        }
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-bg-card rounded-2xl p-5 sm:p-6 border border-border-subtle shadow-sm hover:shadow-md hover:border-blue-500/35 transition-all cursor-pointer flex flex-col justify-between gap-4 ${
        isLocked ? "opacity-80" : ""
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            Weekly Revision
          </span>
          {isLocked && <Lock className="w-4 h-4 text-amber-500" />}
        </div>
        <h3 className="text-lg font-bold text-text-primary mb-3 leading-snug">
          {topic}
        </h3>
        <div className="flex items-center gap-4 text-xs sm:text-sm text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-teal-600" />
            {questions} Questions
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-600" />
            {minutes} min
          </span>
        </div>
      </div>

      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center transition-colors ${
          isLocked
            ? "bg-bg-main text-text-secondary border border-border-subtle"
            : "bg-slate-900 dark:bg-teal-600 text-white hover:opacity-90"
        } ${isLoading ? "opacity-70 cursor-wait" : ""}`}
      >
        {isLoading ? (
          "Starting..."
        ) : isLocked ? (
          <>
            <Lock className="w-4 h-4 mr-1.5" /> Sign in to unlock
          </>
        ) : (
          "Begin Revision"
        )}
      </button>
    </div>
  );
}

export function FullMockTest({
  title,
  questions,
  minutes,
  id,
  tags,
  isLocked,
  onLockedClick,
}: {
  title: string;
  questions: number;
  minutes: number;
  id: string;
  tags: string[];
  isLocked?: boolean;
  onLockedClick?: () => void;
}) {
  const cost = 10;
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, userData, updateProfileData, isGuest } = useAuth();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked) {
      onLockedClick?.();
    } else if (!isGuest && !user) {
      window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"));
    } else {
      if (isGuest || !ENABLE_TOKEN_SYSTEM) {
        router.push(`/exam/${id}`);
      } else {
        setIsLoading(true);
        try {
          const currentTokens = userData?.tokens ?? 0;
          if (currentTokens < cost) {
            router.push("/dashboard/tokens");
            return;
          }
          const data = await handleTokenDeduct(
            user?.uid || user?.email || "unknown",
            cost,
            id,
            "Full Mock Test"
          );
          await updateProfileData({ tokens: data.newBalance });
          router.push(`/exam/${id}`);
        } catch (err: any) {
          alert(err.message);
        }
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-bg-card rounded-2xl p-6 sm:p-8 border border-border-subtle shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="bg-teal-600 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              Full Mock Exam
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-bg-main text-text-secondary border border-border-subtle text-[11px] font-medium px-2.5 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            {title}
          </h3>

          <div className="flex flex-wrap items-center gap-5 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckSquare className="w-4 h-4 text-teal-600" />
              {questions} Questions
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-amber-500" />
              {minutes} Minutes
            </span>
          </div>
        </div>

        <button
          onClick={handleClick}
          disabled={isLoading}
          className={`px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base inline-flex items-center justify-center gap-2 shrink-0 transition-colors ${
            isLocked
              ? "bg-bg-main border border-border-subtle text-text-primary hover:bg-bg-card"
              : "bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
          } ${isLoading ? "opacity-70 cursor-wait" : ""}`}
        >
          {isLoading ? (
            "Starting..."
          ) : isLocked ? (
            <>
              <Lock className="w-4 h-4" /> Sign in to Take Exam
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4" /> Start Full Mock
            </>
          )}
        </button>
      </div>
    </div>
  );
}
