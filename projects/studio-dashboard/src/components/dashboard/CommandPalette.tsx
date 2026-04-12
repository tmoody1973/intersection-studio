"use client";

import { useQuery } from "convex/react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect, useRef, useCallback } from "react";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

type Tab = "threads" | "brain";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("threads");
  const [brainResults, setBrainResults] = useState<Record<string, unknown>[] | null>(null);
  const [brainLoading, setBrainLoading] = useState(false);
  const [brainError, setBrainError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Thread search (reactive Convex query)
  const threadResults = useQuery(
    api.threads.search,
    activeTab === "threads" && searchQuery.trim().length > 0
      ? { query: searchQuery }
      : "skip",
  );

  // Brain search action
  const searchBrain = useAction(api.brain.searchBrain);

  // Debounced brain search
  const debouncedBrainSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!query.trim()) {
        setBrainResults(null);
        setBrainLoading(false);
        setBrainError(false);
        return;
      }
      setBrainLoading(true);
      setBrainError(false);
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await searchBrain({ query });
          setBrainResults(results as Record<string, unknown>[]);
          setBrainError(false);
        } catch {
          setBrainResults(null);
          setBrainError(true);
        } finally {
          setBrainLoading(false);
        }
      }, 300);
    },
    [searchBrain],
  );

  // Trigger brain search when query changes and brain tab is active
  useEffect(() => {
    if (activeTab === "brain") {
      debouncedBrainSearch(searchQuery);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, activeTab, debouncedBrainSearch]);

  // Cmd+K handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
      setBrainResults(null);
      setBrainLoading(false);
      setBrainError(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "grid",
        placeItems: "start center",
        paddingTop: "20vh",
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(8px)",
      }}
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 600,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          boxShadow: "var(--shadow-md)",
          overflow: "hidden",
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-4) var(--space-5)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder={activeTab === "threads" ? "Search threads..." : "Search brain (semantic)..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "var(--text-base)",
              color: "var(--color-text)",
            }}
          />
          <kbd
            style={{
              padding: "2px 6px",
              fontSize: "var(--text-xs)",
              background: "var(--color-surface-2)",
              borderRadius: 4,
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            esc
          </kbd>
        </div>

        {/* Tab bar */}
        <div
          role="tablist"
          style={{
            display: "flex",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <button
            role="tab"
            aria-selected={activeTab === "threads"}
            tabIndex={activeTab === "threads" ? 0 : -1}
            onClick={() => setActiveTab("threads")}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                setActiveTab("brain");
                (e.currentTarget.nextElementSibling as HTMLElement)?.focus();
              }
            }}
            style={{
              flex: 1,
              padding: "var(--space-3) var(--space-4)",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "threads" ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: activeTab === "threads" ? "var(--color-text)" : "var(--color-text-muted)",
              fontWeight: activeTab === "threads" ? 600 : 400,
              fontSize: "var(--text-sm)",
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Threads
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "brain"}
            tabIndex={activeTab === "brain" ? 0 : -1}
            onClick={() => setActiveTab("brain")}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                setActiveTab("threads");
                (e.currentTarget.previousElementSibling as HTMLElement)?.focus();
              }
            }}
            style={{
              flex: 1,
              padding: "var(--space-3) var(--space-4)",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "brain" ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: activeTab === "brain" ? "var(--color-text)" : "var(--color-text-muted)",
              fontWeight: activeTab === "brain" ? 600 : 400,
              fontSize: "var(--text-sm)",
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Brain
          </button>
        </div>

        {/* Results */}
        <div role="tabpanel" style={{ maxHeight: 400, overflowY: "auto" }}>
          {activeTab === "threads" && (
            <ThreadResults query={searchQuery} results={threadResults} />
          )}
          {activeTab === "brain" && (
            <BrainResults
              query={searchQuery}
              results={brainResults}
              loading={brainLoading}
              error={brainError}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ThreadResults({
  query,
  results,
}: {
  query: string;
  results: Array<{ _id: string; _creationTime: number; agentName?: string; type: string; content: string }> | undefined;
}) {
  if (!query.trim()) {
    return (
      <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
        Type to search your threads
      </div>
    );
  }

  if (results === undefined) {
    return (
      <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
        Searching...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
        No results for &ldquo;{query}&rdquo;
      </div>
    );
  }

  return (
    <div>
      {results.map((entry) => (
        <div
          key={entry._id}
          style={{
            padding: "var(--space-4) var(--space-5)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-1)" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)", fontWeight: 600 }}>
              {entry.agentName ?? "System"} · {entry.type}
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {formatTime(entry._creationTime)}
            </span>
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {entry.content}
          </div>
        </div>
      ))}
    </div>
  );
}

function BrainResults({
  query,
  results,
  loading,
  error,
}: {
  query: string;
  results: Record<string, unknown>[] | null;
  loading: boolean;
  error: boolean;
}) {
  if (!query.trim()) {
    return (
      <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
        Type to search the studio brain (semantic)
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
        <span style={{ marginRight: "var(--space-2)", opacity: 0.6 }}>&#9888;</span>
        Brain offline. Thread search still works.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
        <span style={{ display: "inline-flex", gap: 4 }}>
          <span style={{ animation: "pulse 1.5s infinite", animationDelay: "0s" }}>·</span>
          <span style={{ animation: "pulse 1.5s infinite", animationDelay: "0.3s" }}>·</span>
          <span style={{ animation: "pulse 1.5s infinite", animationDelay: "0.6s" }}>·</span>
        </span>
        {" "}Searching brain...
      </div>
    );
  }

  if (results !== null && results.length === 0) {
    return (
      <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
        No brain results for &ldquo;{query}&rdquo;. Try Threads for keyword matches.
      </div>
    );
  }

  if (!results) return null;

  return (
    <div>
      {results.map((entry, i) => (
        <div
          key={`brain-${i}`}
          style={{
            padding: "var(--space-4) var(--space-5)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-1)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", fontWeight: 600 }}>
              {(entry.title as string) || "Untitled"}
            </span>
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-primary)",
                padding: "1px 6px",
                borderRadius: 4,
                border: "1px solid var(--color-border)",
              }}
            >
              Relevance
            </span>
          </div>
          {((entry.project as string) || (entry.source as string)) ? (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
              {String((entry.project as string) || (entry.source as string))}
            </div>
          ) : null}
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {String((entry.content as string) || (entry.snippet as string) || "")}
          </div>
        </div>
      ))}
    </div>
  );
}
