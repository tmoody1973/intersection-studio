"use client";

import { DollarSign } from "lucide-react";

/**
 * Cost Ticker — live token/cost counter during Co-Work sessions.
 *
 * Accumulates cost from AG-UI CustomEvent { type: "cost_update", costCents: N, tokens: N }.
 * Displays in the header as a running total.
 */

interface CostTickerProps {
  costCents: number;
  tokens?: number;
}

export function CostTicker({ costCents, tokens }: CostTickerProps) {
  const dollars = (costCents / 100).toFixed(2);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        fontFamily: "monospace",
        color: costCents > 0 ? "#fafafa" : "#555",
      }}
      title={tokens ? `${tokens.toLocaleString()} tokens` : undefined}
      aria-label={`Session cost: $${dollars}`}
    >
      <DollarSign size={12} color={costCents > 0 ? "#f59e0b" : "#555"} />
      <span>{dollars}</span>
    </div>
  );
}
