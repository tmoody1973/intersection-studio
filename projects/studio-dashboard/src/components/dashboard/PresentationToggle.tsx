"use client";

import { useState, useEffect } from "react";
import { Monitor } from "lucide-react";

export function PresentationToggle() {
  const [isPresentation, setIsPresentation] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isPresentation ? "presentation" : "dark",
    );
  }, [isPresentation]);

  return (
    <button
      onClick={() => setIsPresentation(!isPresentation)}
      title={isPresentation ? "Exit presentation mode" : "Presentation mode"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.75rem",
        borderRadius: "var(--radius-lg)",
        background: isPresentation ? "var(--color-primary)" : "transparent",
        color: isPresentation ? "#fff" : "var(--color-text-muted)",
        fontSize: "var(--text-xs)",
        border: isPresentation ? "none" : "1px solid var(--color-border)",
        transition: "all var(--transition)",
      }}
    >
      <Monitor size={14} />
      {isPresentation ? "Exit" : "Present"}
    </button>
  );
}
