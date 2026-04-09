"use client";

import { LayoutDashboard, Users, ListTodo, Settings } from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Agents", icon: Users },
  { label: "Tasks", icon: ListTodo },
  { label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside
      style={{
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        padding: "var(--space-6)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <div
          style={{
            width: 36,
            height: 36,
            display: "grid",
            placeItems: "center",
            borderRadius: 10,
            background: "rgba(79, 152, 163, 0.15)",
            color: "var(--color-primary)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 18L12 6L19 18" />
            <path d="M8 14H16" />
            <circle cx="12" cy="10" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-sm)" }}>
            Intersection Studio
          </div>
          <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
            Control Room
          </div>
        </div>
      </div>

      <nav style={{ display: "grid", gap: "var(--space-2)" }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-lg)",
              background: item.active ? "rgba(79, 152, 163, 0.12)" : "transparent",
              color: item.active ? "var(--color-text)" : "var(--color-text-muted)",
              textAlign: "left",
              fontSize: "var(--text-sm)",
              transition: "background var(--transition)",
            }}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ marginTop: "auto", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
        <kbd style={{ padding: "2px 6px", background: "var(--color-surface-2)", borderRadius: 4, border: "1px solid var(--color-border)" }}>
          ⌘K
        </kbd>{" "}
        Search threads
      </div>
    </aside>
  );
}
