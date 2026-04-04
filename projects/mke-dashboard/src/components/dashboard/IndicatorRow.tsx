"use client";

import { motion, useReducedMotion } from "framer-motion";

interface Indicator {
  label: string;
  value: number | string | null;
  unit?: string;
  color?: string;
}

interface IndicatorRowProps {
  indicators: Indicator[];
  neighborhoodName: string;
}

export function IndicatorRow({ indicators, neighborhoodName }: IndicatorRowProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="mb-6">
      <h2 className="mb-3 font-display text-lg font-semibold text-iron">
        {neighborhoodName} Overview
      </h2>
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}
