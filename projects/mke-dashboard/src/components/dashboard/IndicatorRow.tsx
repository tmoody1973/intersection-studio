"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Info, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface IndicatorDelta {
  direction: "improving" | "worsening" | "stable";
  percentage: number;
}

interface Indicator {
  label: string;
  value: number | string | null;
  unit?: string;
  color?: string;
  delta?: IndicatorDelta;
}

interface IndicatorRowProps {
  indicators: Indicator[];
  neighborhoodName: string;
}

export function IndicatorRow({ indicators, neighborhoodName }: IndicatorRowProps) {
  const prefersReducedMotion = useReducedMotion();
  const [showNote, setShowNote] = useState(false);
  const t = useTranslations("methodology");

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-iron">
          {neighborhoodName} Overview
        </h2>
        <button
          type="button"
          onClick={() => setShowNote(!showNote)}
          className="text-limestone transition-colors hover:text-foundry"
          aria-label="About this data"
          title="About this data"
        >
          <Info size={14} />
        </button>
      </div>
      {showNote && (
        <p className="mb-3 rounded-lg bg-limestone/10 px-3 py-2 text-xs text-foundry">
          {t("populationNote")}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {indicators.map((ind, i) => (
          <motion.div
            key={ind.label}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="rounded-lg border border-limestone/20 bg-white p-3 dark:bg-[#292524]"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foundry">
              {ind.label}
            </span>
            <div className="mt-1 font-display text-2xl font-bold text-iron sm:text-3xl">
              {ind.value !== null && ind.value !== undefined
                ? typeof ind.value === "number"
                  ? ind.value.toLocaleString()
                  : ind.value
                : "—"}
            </div>
            {ind.unit && (
              <span className="text-[10px] text-limestone">{ind.unit}</span>
            )}
            {ind.delta && ind.delta.percentage > 0 && (
              <div className={`mt-1 flex items-center gap-0.5 text-[10px] font-medium ${
                ind.delta.direction === "improving"
                  ? "text-green-600 dark:text-green-400"
                  : ind.delta.direction === "worsening"
                    ? "text-red-600 dark:text-red-400"
                    : "text-limestone"
              }`}>
                {ind.delta.direction === "improving" ? (
                  <TrendingUp size={10} />
                ) : ind.delta.direction === "worsening" ? (
                  <TrendingDown size={10} />
                ) : (
                  <Minus size={10} />
                )}
                <span>{ind.delta.percentage}%</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
