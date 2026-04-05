"use client";

import { useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CircleDot, Shield, Building2, Heart, Landmark } from "lucide-react";
import type { CategoryTabsProps, CategoryTab, CategoryId } from "@/types/metrics";

const ICON_MAP = {
  CircleDot,
  Shield,
  Building2,
  Heart,
  Landmark,
} as const;

export function CategoryTabs({
  categories,
  activeCategory,
  onChange,
  showCounts = false,
}: CategoryTabsProps) {
  const prefersReducedMotion = useReducedMotion();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      const enabledCategories = categories.filter((c) => !c.disabled);
      const currentEnabledIndex = enabledCategories.findIndex(
        (c) => c.id === categories[currentIndex].id,
      );

      let nextIndex = -1;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          nextIndex = (currentEnabledIndex + 1) % enabledCategories.length;
          break;
        case "ArrowLeft":
          e.preventDefault();
          nextIndex =
            (currentEnabledIndex - 1 + enabledCategories.length) %
            enabledCategories.length;
          break;
        case "Home":
          e.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          e.preventDefault();
          nextIndex = enabledCategories.length - 1;
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (!categories[currentIndex].disabled) {
            onChange(categories[currentIndex].id);
          }
          return;
        default:
          return;
      }

      if (nextIndex >= 0) {
        const nextCategory = enabledCategories[nextIndex];
        onChange(nextCategory.id);
        // Focus the button
        const btn = document.getElementById(`tab-${nextCategory.id}`);
        btn?.focus();
      }
    },
    [categories, onChange],
  );

  return (
    <div
      role="tablist"
      aria-label="Metric categories"
      className="flex gap-1 overflow-x-auto scroll-smooth scrollbar-none sm:gap-2"
      style={{ scrollSnapType: "x mandatory" }}
    >
      {categories.map((tab, index) => {
        const isActive = tab.id === activeCategory;
        const Icon = ICON_MAP[tab.icon];

        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            aria-disabled={tab.disabled || undefined}
            tabIndex={isActive ? 0 : -1}
            onClick={() => !tab.disabled && onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              relative flex min-h-[48px] flex-shrink-0 flex-1 items-center justify-center
              gap-1.5 rounded-lg px-3 py-2.5 text-[11px] font-semibold uppercase
              tracking-wider transition-colors sm:min-h-[44px] sm:px-5 sm:text-xs
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              ${tab.disabled ? "cursor-not-allowed text-limestone" : "cursor-pointer"}
              ${
                !isActive && !tab.disabled
                  ? "text-foundry hover:text-iron"
                  : ""
              }
            `}
            style={{
              scrollSnapAlign: "start",
              // @ts-expect-error -- CSS custom property
              "--tw-ring-color": tab.color,
            }}
          >
            {/* Active background morph */}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 rounded-lg"
                style={{ backgroundColor: tab.color }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.2, ease: "easeInOut" }
                }
              />
            )}

            {/* Hover background for inactive */}
            {!isActive && !tab.disabled && (
              <div
                className="absolute inset-0 rounded-lg opacity-0 transition-opacity hover:opacity-100"
                style={{ backgroundColor: tab.color, opacity: 0 }}
              />
            )}

            {/* Content */}
            <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? "text-white" : ""}`}>
              <Icon size={16} aria-hidden="true" />
              <span>{tab.label}</span>
              {showCounts && tab.metricCount !== undefined && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-limestone/20 text-foundry"
                  }`}
                >
                  {tab.metricCount}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
