"use client";

import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { getCompletedUserTests, TestAttempt } from "@/lib/testEngine";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Target, TrendingUp, Award, Zap, Lock, AlertCircle } from "lucide-react";

export default function AnalyticsPage() {
  const { user, userData, isGuest } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!user || isGuest) {
        setLoading(false);
        return;
      }
      try {
        const data = await getCompletedUserTests([user.email, user.uid].filter(Boolean) as string[]);
        // Sort by timestamp
        const sorted = data.sort((a, b) => {
          const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
          const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
          return timeA - timeB;
        });
        setAttempts(sorted);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, isGuest]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-orange-500" />
        </div>
        <h2 className="text-3xl font-black text-text-primary mb-4 uppercase tracking-widest">Analytics Locked</h2>
        <p className="text-text-secondary font-medium mb-8">Guest users do not have access to persistent analytics. Sign in to track your detailed performance over time.</p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-auth-sidebar"))}
          className="px-8 py-4 bg-accent-main hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-lg"
        >
          Login to Access
        </button>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-blue-500" />
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-2 uppercase tracking-tight">No Data Available</h2>
        <p className="text-text-secondary font-medium mb-8">Start your first test to see your analytics and track your progress.</p>
      </div>
    );
  }

  // Compute Metrics
  const totalTests = attempts.length;
  let totalQuestions = 0;
  let totalCorrect = 0;
  let maxScore = 0;
  let totalScoreRaw = 0;
  let totalAnswered = 0;

  const performanceData = attempts.map((a, i) => {
    totalQuestions += a.totalQuestions;
    totalCorrect += a.score;
    totalScoreRaw += a.score;
    totalAnswered += Object.keys(a.answers || {}).length;
    
    if (a.score > maxScore) maxScore = a.score;

    const accuracy = a.totalQuestions > 0 ? Math.round((a.score / Object.keys(a.answers || {}).length) * 100) || 0 : 0;
    
    return {
      name: `Test ${i + 1}`,
      rawScore: a.score,
      totalQ: a.totalQuestions,
      accuracy: Math.round((a.score / a.totalQuestions) * 100),
      testId: a.testId || `Test ${i+1}`
    };
  });

  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const avgScore = totalTests > 0 ? Math.round(totalScoreRaw / totalTests) : 0;
  
  const incorrectTotal = totalAnswered - totalCorrect;
  const unattemptedTotal = totalQuestions - totalAnswered;

  const pieData = [
    { name: 'Correct', value: totalCorrect, color: '#10b981' }, // emerald-500
    { name: 'Incorrect', value: incorrectTotal, color: '#ef4444' }, // red-500
    { name: 'Unattempted', value: unattemptedTotal, color: '#94a3b8' } // slate-400
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-10 pb-16 px-2">
      <div>
        <h1 className="text-3xl font-black text-text-primary uppercase tracking-tighter">Your Analytics</h1>
        <p className="text-text-secondary mt-1 font-bold text-sm tracking-wide">REAL-TIME PERFORMANCE SNAPSHOT</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-bg-card p-6 rounded-3xl border border-border-subtle shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-teal-500" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Tests Taken</p>
            <p className="text-2xl font-black text-text-primary">{totalTests}</p>
          </div>
        </div>
        
        <div className="bg-bg-card p-6 rounded-3xl border border-border-subtle shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Overall Acc.</p>
            <p className="text-2xl font-black text-text-primary">{overallAccuracy}%</p>
          </div>
        </div>

        <div className="bg-bg-card p-6 rounded-3xl border border-border-subtle shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Average Score</p>
            <p className="text-2xl font-black text-text-primary">{avgScore}</p>
          </div>
        </div>

        <div className="bg-bg-card p-6 rounded-3xl border border-border-subtle shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Best Score</p>
            <p className="text-2xl font-black text-text-primary">{maxScore}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart: Accuracy progression */}
        <div className="bg-bg-card p-6 md:p-8 rounded-3xl border border-border-subtle shadow-sm">
          <h2 className="text-lg font-black text-text-primary mb-6 uppercase tracking-widest">Accuracy Progression (%)</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ dy: 10 }} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="accuracy" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Score per test */}
        <div className="bg-bg-card p-6 md:p-8 rounded-3xl border border-border-subtle shadow-sm">
          <h2 className="text-lg font-black text-text-primary mb-6 uppercase tracking-widest">Score per Test</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ dy: 10 }} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
                <Bar dataKey="rawScore" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart: Answer Breakdown */}
        <div className="bg-bg-card p-6 md:p-8 rounded-3xl border border-border-subtle shadow-sm flex flex-col items-center">
          <h2 className="text-lg font-black text-text-primary mb-2 uppercase tracking-widest w-full text-left">Answers Breakdown</h2>
          <p className="text-xs text-text-secondary w-full text-left mb-6 font-bold tracking-wider">ACROSS {totalQuestions} TOTAL QUESTIONS</p>
          <div className="h-[220px] w-full max-w-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Test History List */}
        <div className="bg-bg-card p-6 md:p-8 rounded-3xl border border-border-subtle shadow-sm overflow-y-auto max-h-[400px]">
          <h2 className="text-lg font-black text-text-primary mb-6 uppercase tracking-widest">Recent Test Log</h2>
          <div className="space-y-4">
            {attempts.slice().reverse().map((attempt, i) => {
              const attemptAnsCount = Object.keys(attempt.answers || {}).length;
              const acc = attemptAnsCount > 0 ? Math.round((attempt.score / attemptAnsCount) * 100) : 0;
              return (
                <div key={attempt.id || i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-bg-main rounded-2xl border border-border-subtle gap-4">
                  <div>
                    <h3 className="font-bold text-text-primary text-sm uppercase">{attempt.testId || `Test ${attempts.length - i}`}</h3>
                    <span className="text-xs text-text-secondary font-medium">Attempted {attemptAnsCount} / {attempt.totalQuestions} Qs</span>
                  </div>
                  <div className="flex items-center space-x-6 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-text-secondary font-bold uppercase block mb-0.5">Score</span>
                      <span className="font-black text-text-primary">{attempt.score}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-text-secondary font-bold uppercase block mb-0.5">Accuracy</span>
                      <span className={`font-black ${acc >= 70 ? 'text-teal-500' : acc >= 40 ? 'text-orange-500' : 'text-red-500'}`}>{acc}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
