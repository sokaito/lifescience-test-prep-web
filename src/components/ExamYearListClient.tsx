"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Search,
  X,
  FolderOpen,
  ArrowLeft,
  ChevronRight,
  FileText,
  Layers,
} from "lucide-react";

export interface PaperItem {
  id: string;
  name: string;
  group: string;
  questionCount?: number;
}

interface ExamYearListClientProps {
  exam: string;
  initialPapers: PaperItem[];
}

const formatPaperName = (y: string) => {
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

const formatSectionName = (group: string) => {
  if (!group || group === "General") return "Full Question Papers";
  return group
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const REMOTE_MANIFEST_URL =
  "https://csir-net-mocktest.web.app/repository/pyq/manifest.json";

export default function ExamYearListClient({
  exam,
  initialPapers,
}: ExamYearListClientProps) {
  const [papers, setPapers] = useState<PaperItem[]>(initialPapers);
  const [searchQuery, setSearchQuery] = useState("");
  // `null` shows the Section Directory first when an exam has multiple subject sections (e.g. ICMR JRF, GATE)
  const [selectedSection, setSelectedSection] = useState<string | "ALL" | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;

    async function syncRemotePapers() {
      try {
        const res = await fetch(REMOTE_MANIFEST_URL, { cache: "no-store" });
        if (!res.ok) return;
        const manifest = await res.json();
        const remoteIds: string[] = manifest[exam] || [];

        if (remoteIds.length === 0 || !isMounted) return;

        const paperMap = new Map<string, PaperItem>();
        initialPapers.forEach((p) => paperMap.set(p.id, p));

        remoteIds.forEach((id) => {
          if (!paperMap.has(id)) {
            const parts = id.split("/");
            const group = parts.length > 1 ? parts[0] : "";
            paperMap.set(id, {
              id,
              name: parts[parts.length - 1],
              group,
            });
          }
        });

        const merged = Array.from(paperMap.values());
        merged.sort((a, b) => {
          if (a.group !== b.group) return a.group.localeCompare(b.group);
          return b.name.localeCompare(a.name);
        });

        if (isMounted) {
          setPapers(merged);
        }
      } catch {
        // Offline or unreachable: keep local initialPapers silently
      }
    }

    syncRemotePapers();
    return () => {
      isMounted = false;
    };
  }, [exam, initialPapers]);

  // Group papers by section ("" = Full Question Papers)
  const { sectionKeys, groupedPapers } = useMemo(() => {
    const map: Record<string, PaperItem[]> = {};
    papers.forEach((paper) => {
      const key = paper.group || "";
      if (!map[key]) map[key] = [];
      map[key].push(paper);
    });
    // Sort keys: Full Papers ("") first, then alphabetical sections
    const keys = Object.keys(map).sort((a, b) => {
      if (a === "") return -1;
      if (b === "") return 1;
      return formatSectionName(a).localeCompare(formatSectionName(b));
    });
    return { sectionKeys: keys, groupedPapers: map };
  }, [papers]);

  const hasMultipleSections = sectionKeys.length > 1;
  const hasFullPapers = Boolean(groupedPapers[""]?.length);

  // Determine default view automatically if user hasn't picked a section yet:
  // - Single-section exams (CSIR NET, DBT BET): show papers right away ("ALL")
  // - GATE (Full papers + Subject sections): default to Full Question Papers ("") or directory via pills
  // - ICMR JRF (15 Subject sections, no full papers): default to Section Directory (null) so users pick a subject first!
  const effectiveSection = useMemo(() => {
    if (searchQuery.trim() !== "") return "ALL";
    if (!hasMultipleSections) return sectionKeys[0] ?? "ALL";
    if (selectedSection !== null) return selectedSection;
    return hasFullPapers ? "" : "DIRECTORY";
  }, [
    searchQuery,
    hasMultipleSections,
    selectedSection,
    sectionKeys,
    hasFullPapers,
  ]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredBySearch = useMemo(() => {
    if (!normalizedQuery) return groupedPapers;
    const out: Record<string, PaperItem[]> = {};
    for (const key of sectionKeys) {
      const secTitle = formatSectionName(key).toLowerCase();
      const matched = groupedPapers[key].filter((p) => {
        const title = formatPaperName(p.name).toLowerCase();
        return (
          title.includes(normalizedQuery) || secTitle.includes(normalizedQuery)
        );
      });
      if (matched.length > 0) out[key] = matched;
    }
    return out;
  }, [groupedPapers, sectionKeys, normalizedQuery]);

  const visibleSections = useMemo(() => {
    if (effectiveSection === "DIRECTORY") return [];
    if (effectiveSection === "ALL") {
      return Object.keys(filteredBySearch).sort((a, b) => {
        if (a === "") return -1;
        if (b === "") return 1;
        return formatSectionName(a).localeCompare(formatSectionName(b));
      });
    }
    return filteredBySearch[effectiveSection] ? [effectiveSection] : [];
  }, [effectiveSection, filteredBySearch]);

  return (
    <div className="space-y-6">
      {/* Search + Quick Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              hasMultipleSections
                ? "Search by year, section, or subject topic..."
                : "Search by year or shift..."
            }
            className="w-full pl-10 pr-10 py-2.5 bg-bg-card border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-teal-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Section Switcher Pills (for exams with multiple sections like GATE & ICMR JRF) */}
      {hasMultipleSections && !normalizedQuery && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              Sections ({sectionKeys.length})
            </span>
            {effectiveSection !== "DIRECTORY" && (
              <button
                onClick={() => setSelectedSection("DIRECTORY")}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                View All Sections
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            <button
              onClick={() => setSelectedSection("DIRECTORY")}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                effectiveSection === "DIRECTORY"
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-bg-card text-text-secondary border-border-subtle hover:text-text-primary hover:border-teal-500/40"
              }`}
            >
              All Sections ({sectionKeys.length})
            </button>

            {sectionKeys.map((key) => {
              const count = groupedPapers[key]?.length || 0;
              const active = effectiveSection === key;
              return (
                <button
                  key={key || "full-papers"}
                  onClick={() => setSelectedSection(key)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    active
                      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                      : "bg-bg-card text-text-secondary border-border-subtle hover:text-text-primary hover:border-teal-500/40"
                  }`}
                >
                  {formatSectionName(key)} ({count})
                </button>
              );
            })}

            <button
              onClick={() => setSelectedSection("ALL")}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                effectiveSection === "ALL"
                  ? "bg-slate-800 dark:bg-slate-700 text-white border-slate-700"
                  : "bg-bg-card text-text-secondary border-border-subtle hover:text-text-primary"
              }`}
            >
              Show Everything ({papers.length})
            </button>
          </div>
        </div>
      )}

      {/* Section Directory Cards (Pick a Subject Section First) */}
      {effectiveSection === "DIRECTORY" && !normalizedQuery && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectionKeys.map((key) => {
            const items = groupedPapers[key] || [];
            const previewTopics = items
              .slice(0, 2)
              .map((p) => formatPaperName(p.name))
              .join(", ");
            return (
              <button
                key={key || "full"}
                onClick={() => setSelectedSection(key)}
                className="group text-left bg-bg-card hover:border-teal-500/45 border border-border-subtle rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-base text-text-primary truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {formatSectionName(key)}
                      </h2>
                      <p className="text-xs font-medium text-text-secondary">
                        {items.length} {key === "" ? "Papers" : "Subjects / Topics"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-secondary group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>

                {previewTopics && (
                  <p className="text-xs text-text-secondary/80 line-clamp-1 pt-2 border-t border-border-subtle">
                    Includes: {previewTopics}
                    {items.length > 2 ? ` +${items.length - 2} more` : ""}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Papers / Topics Grid inside Selected Section or Search */}
      {effectiveSection !== "DIRECTORY" && visibleSections.length === 0 && (
        <div className="bg-bg-card border border-border-subtle rounded-2xl p-10 text-center">
          <FileText className="w-10 h-10 text-text-secondary/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-text-primary">
            No matching papers or topics found
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Try clearing your search or choosing another section.
          </p>
        </div>
      )}

      {visibleSections.map((sectionKey) => {
        const groupPapers = filteredBySearch[sectionKey] || [];
        const isYearSection = sectionKey === "";
        return (
          <div key={sectionKey || "full-papers"} className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary">
                  {formatSectionName(sectionKey)}
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-bg-card border border-border-subtle text-text-secondary">
                  {groupPapers.length}
                </span>
              </div>
              {effectiveSection === "ALL" && hasMultipleSections && !normalizedQuery && (
                <button
                  onClick={() => setSelectedSection(sectionKey)}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Focus Section →
                </button>
              )}
            </div>

            <div
              className={
                isYearSection
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
              }
            >
              {groupPapers.map((paper) => (
                <Link
                  key={paper.id}
                  href={`/pyq/${exam}/${paper.id}`}
                  className="group bg-bg-card hover:border-teal-500/45 border border-border-subtle rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-bg-main border border-border-subtle text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 transition-colors">
                      {isYearSection ? (
                        <Calendar className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {formatPaperName(paper.name)}
                      </h3>
                      <p className="text-xs text-text-secondary">
                        {paper.questionCount
                          ? `${paper.questionCount} Questions`
                          : "Start Practice"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-secondary group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
