"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { CategoryTabs } from "./CategoryTabs";
import { MetricCard } from "./MetricCard";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import type { CategoryId, MetricCardProps } from "@/types/metrics";

interface MetricsPanelProps {
  metrics: MetricCardProps[];
  onAskAI?: (metricId: string, label: string) => void;
}

export function MetricsPanel({ metrics, onAskAI }: MetricsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("community");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const filteredMetrics = metrics.filter(
    (m) => m.category === activeCategory,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Category Tabs */}
      <CategoryTabs
        categories={DEFAULT_CATEGORIES}
        activeCategory={activeCategory}
        onChange={(id) => {
          setActiveCategory(id);
          setExpandedId(null);
        }}
        showCounts
      />

      {/* Tab Panel */}
      <div
        role="tabpanel"
        id={`panel-${activeCategory}`}
        aria-labelledby={`tab-${activeCategory}`}
        tabIndex={0}
      >
        {filteredMetrics.length === 0 ? (
          <div className="rounded-lg border border-limestone/20 bg-white/50 p-8 text-center dark:bg-[#292524]/50">
            <p className="text-sm text-foundry">
              No metrics available for this category yet.
            </p>
            <p className="mt-1 text-xs text-limestone">
              More data sources will be added as city partnerships develop.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredMetrics.map((metric, index) => (
                <MetricCard
                  key={metric.id}
                  {...metric}
                  index={index}
                  isExpanded={expandedId === metric.id}
                  onToggleExpand={handleToggleExpand}
                  onAskAI={onAskAI}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
