"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PresentationToggle } from "@/components/dashboard/PresentationToggle";
import { ApprovalOverlay } from "@/components/dashboard/ApprovalOverlay";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { ProjectProvider } from "@/components/providers/ProjectContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const ensureUser = useMutation(api.users.ensureUser);

  useEffect(() => {
    if (isSignedIn) {
      ensureUser();
    }
  }, [isSignedIn, ensureUser]);

  if (!isLoaded) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div style={{ color: "var(--color-text-muted)" }}>Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          gap: "var(--space-4)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              marginBottom: "var(--space-4)",
            }}
          >
            Intersection Studio
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-6)",
            }}
          >
            Where culture meets technology. 20 products shipped with AI agents.
          </p>
          <SignInButton mode="modal">
            <button
              style={{
                background: "var(--color-primary)",
                color: "#fff",
                padding: "0.9rem 2rem",
                borderRadius: "var(--radius-xl)",
                fontSize: "var(--text-base)",
                minHeight: "44px",
              }}
            >
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <ProjectProvider>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          minHeight: "100vh",
        }}
      >
        <Sidebar />
        <main
          style={{
            padding: "var(--space-6)",
            display: "grid",
            gap: "var(--space-6)",
            alignContent: "start",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-lg)",
                  margin: 0,
                }}
              >
                Intersection Studio
              </h1>
              <p
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "var(--text-sm)",
                  margin: "0.25rem 0 0",
                }}
              >
                5 agents, collaborative workspace
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
              }}
            >
              <PresentationToggle />
              <UserButton />
            </div>
          </header>

          {children}
        </main>
      </div>

      <ApprovalOverlay />
      <CommandPalette />
    </ProjectProvider>
  );
}
