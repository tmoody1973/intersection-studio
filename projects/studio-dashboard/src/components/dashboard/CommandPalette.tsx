"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useQuery(
    api.threads.search,
    searchQuery.trim().length > 0 ? { query: searchQuery } : "skip",
  );

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
            placeholder="Search threads... (what did we decide about...)"
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

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {!searchQuery.trim() && (
            <div
              style={{
                padding: "var(--space-8)",
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
              }}
            >
              Type to search your second brain
            </div>
          )}

          {searchQuery.trim() && results && results.length === 0 && (
            <div
              style={{
                padding: "var(--space-8)",
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
              }}
            >
              No results for &ldquo;{searchQuery}&rdquo;
            </div>
          )}

          {searchQuery.trim() && results === undefined && (
            <div
              style={{
                padding: "var(--space-6)",
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
              }}
            >
              Searching...
            </div>
          )}

          {results && results.length > 0 && (
            <div>
              {results.map((entry) => (
                <div
                  key={entry._id}
                  style={{
                    padding: "var(--space-4) var(--space-5)",
                    borderBottom: "1px solid var(--color-border)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "var(--space-3)",
                      marginBottom: "var(--space-1)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-primary)",
                        fontWeight: 600,
                      }}
                    >
                      {entry.agentName ?? "System"} · {entry.type}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {formatTime(entry._creationTime)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {entry.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
