"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇲🇽" },
  { code: "hmn", label: "Hmoob", flag: "🇱🇦" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
] as const;

export function LanguageSelector() {
  const router = useRouter();

  const handleChange = (locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <div className="relative">
      <select
        aria-label="Select language"
        onChange={(e) => handleChange(e.target.value)}
        defaultValue=""
        className="appearance-none rounded-lg border border-limestone/30 bg-white py-1.5 pe-8 ps-8 text-xs text-iron focus:border-lakeshore focus:outline-none focus:ring-1 focus:ring-lakeshore dark:bg-[#292524]"
      >
        <option value="" disabled>
          Language
        </option>
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
      <Globe
        size={14}
        className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-foundry"
        aria-hidden="true"
      />
    </div>
  );
}
