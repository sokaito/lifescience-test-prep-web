"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";

export interface PaperItem {
  id: string;
  name: string;
  group: string;
}

interface ExamYearListClientProps {
  exam: string;
  initialPapers: PaperItem[];
}

const formatYearName = (y: string) => {
  const lastPart = y.split('/').pop() || y;
  return lastPart
    .split('_')
    .map(part => {
      const match = part.match(/^shift(\d+)$/i);
      if (match) {
        return `Shift ${match[1]}`;
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
};

const REMOTE_MANIFEST_URL = "https://csir-net-mocktest.web.app/repository/pyq/manifest.json";

export default function ExamYearListClient({ exam, initialPapers }: ExamYearListClientProps) {
  const [papers, setPapers] = useState<PaperItem[]>(initialPapers);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncRemotePapers() {
      try {
        setIsLiveSyncing(true);
        // Fetch remote manifest from live website
        const res = await fetch(REMOTE_MANIFEST_URL, { cache: "no-store" });
        if (!res.ok) return;
        const manifest = await res.json();
        const remoteIds: string[] = manifest[exam] || [];

        if (remoteIds.length === 0 || !isMounted) return;

        // Parse remote ids into PaperItem objects
        const remoteItems: PaperItem[] = remoteIds.map(id => {
          const parts = id.split('/');
          const group = parts.length > 1 ? parts[0] : "";
          return {
            id,
            name: parts[parts.length - 1],
            group
          };
        });

        // Merge initial and remote papers (avoiding duplicates)
        const paperMap = new Map<string, PaperItem>();
        initialPapers.forEach(p => paperMap.set(p.id, p));
        remoteItems.forEach(p => paperMap.set(p.id, p));

        const merged = Array.from(paperMap.values());
        merged.sort((a, b) => {
          if (a.group !== b.group) return a.group.localeCompare(b.group);
          return b.name.localeCompare(a.name);
        });

        if (isMounted) {
          setPapers(merged);
        }
      } catch (err) {
        console.log("Remote paper manifest not reachable, using local list:", err);
      } finally {
        if (isMounted) setIsLiveSyncing(false);
      }
    }

    syncRemotePapers();

    return () => {
      isMounted = false;
    };
  }, [exam, initialPapers]);

  // Group papers by category
  const groupedPapers: Record<string, PaperItem[]> = {};
  papers.forEach(paper => {
    const groupName = paper.group || "General";
    if (!groupedPapers[groupName]) {
      groupedPapers[groupName] = [];
    }
    groupedPapers[groupName].push(paper);
  });

  return (
    <div className="space-y-12">
      {Object.entries(groupedPapers).map(([groupName, groupPapers]) => (
        <div key={groupName} className="space-y-6">
          {groupName !== "General" && (
            <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight uppercase border-b border-border-subtle pb-2">
              {groupName}
            </h3>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {groupPapers.map((paper) => (
              <Link
                key={paper.id}
                href={`/pyq/${exam}/${paper.id}`}
                className="group flex flex-col items-center justify-center p-6 bg-bg-card rounded-2xl border border-border-subtle shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-center relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-125 transition-transform text-accent-main">
                  <Calendar className="w-16 h-16" />
                </div>
                <Calendar className="w-8 h-8 text-text-secondary group-hover:text-accent-main transition-colors mb-3 relative z-10" />
                <h2 className="text-base md:text-lg font-black text-text-primary uppercase tracking-tight relative z-10 leading-tight">
                  {formatYearName(paper.name)}
                </h2>
                <div className="mt-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest relative z-10 flex items-center justify-center gap-1">
                  <span>Start Paper</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

