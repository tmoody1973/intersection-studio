"use client";

export default function SettingsPage() {
  return (
    <section>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-lg)",
          marginBottom: "var(--space-4)",
        }}
      >
        Settings
      </h2>
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: "var(--space-8)",
          textAlign: "center",
          color: "var(--color-text-muted)",
        }}
      >
        Settings coming soon. Agent configuration is available on the Agents
        page.
      </div>
    </section>
  );
}
