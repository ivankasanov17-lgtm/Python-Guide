import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { terms } from "@/data/terms";
import { djangoTerms } from "@/data/django-terms";
import { fastapiTerms } from "@/data/fastapi-terms";
import { drfTerms } from "@/data/drf-terms";
import { Search, ChevronRight, Brain } from "lucide-react";

type Tech = "python" | "django" | "fastapi" | "drf";

const TABS: {
  key: Tech;
  label: string;
  color: string;
  activeBg: string;
  activeText: string;
  borderColor: string;
  route: string;
}[] = [
  {
    key: "python",
    label: "Python",
    color: "text-blue-500",
    activeBg: "bg-blue-500",
    activeText: "text-white",
    borderColor: "border-blue-500/40",
    route: "/reference",
  },
  {
    key: "django",
    label: "Django",
    color: "text-green-500",
    activeBg: "bg-green-500",
    activeText: "text-white",
    borderColor: "border-green-500/40",
    route: "/django",
  },
  {
    key: "fastapi",
    label: "FastAPI",
    color: "text-orange-500",
    activeBg: "bg-orange-500",
    activeText: "text-white",
    borderColor: "border-orange-500/40",
    route: "/fastapi",
  },
  {
    key: "drf",
    label: "DRF",
    color: "text-rose-500",
    activeBg: "bg-rose-500",
    activeText: "text-white",
    borderColor: "border-rose-500/40",
    route: "/drf",
  },
];

const uniquePythonTerms = (() => {
  const seen = new Set<string>();
  return terms.filter((t) => {
    if (seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });
})();

const TERMS_BY_TECH: Record<Tech, { name: string; syntax: string }[]> = {
  python: uniquePythonTerms.map((t) => ({ name: t.name, syntax: t.syntax })),
  django: djangoTerms.map((t) => ({ name: t.name, syntax: t.syntax })),
  fastapi: fastapiTerms.map((t) => ({ name: t.name, syntax: t.syntax })),
  drf: drfTerms.map((t) => ({ name: t.name, syntax: t.syntax })),
};

export default function ReviewPage() {
  const [activeTech, setActiveTech] = useState<Tech>("python");
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const currentTab = TABS.find((t) => t.key === activeTech)!;

  const filteredTerms = useMemo(() => {
    const all = TERMS_BY_TECH[activeTech];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (t) =>
        t.syntax.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q)
    );
  }, [activeTech, search]);

  function handleTermClick(termName: string) {
    const route = currentTab.route;
    setLocation(`${route}?term=${encodeURIComponent(termName)}`);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Повторение
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base ml-[52px]">
            Просматривайте синтаксис терминов. Если затрудняетесь — кликните, чтобы открыть полное описание.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTech(tab.key);
                setSearch("");
              }}
              className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                activeTech === tab.key
                  ? `${tab.activeBg} ${tab.activeText} border-transparent shadow-md`
                  : `bg-transparent ${tab.color} ${tab.borderColor} hover:bg-muted`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            className="w-full bg-background border border-input rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground shadow-sm"
            placeholder={`Поиск по синтаксису ${currentTab.label}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Count */}
        <p className="text-xs text-muted-foreground mb-4">
          {filteredTerms.length} {filteredTerms.length === 1 ? "термин" : "терминов"}
        </p>

        {/* Terms grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTech}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {filteredTerms.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Ничего не найдено по запросу «{search}»</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {filteredTerms.map((term, idx) => (
                  <motion.button
                    key={term.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(idx * 0.015, 0.3) }}
                    onClick={() => handleTermClick(term.name)}
                    className="group flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-border/50 bg-card hover:border-border hover:shadow-sm transition-all duration-200 hover:bg-muted/40"
                  >
                    <div
                      className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                        activeTech === "python"
                          ? "bg-blue-500/60 group-hover:bg-blue-500"
                          : activeTech === "django"
                          ? "bg-green-500/60 group-hover:bg-green-500"
                          : activeTech === "fastapi"
                          ? "bg-orange-500/60 group-hover:bg-orange-500"
                          : "bg-rose-500/60 group-hover:bg-rose-500"
                      } transition-colors`}
                    />
                    <code className="flex-1 font-mono text-sm text-foreground leading-relaxed break-all">
                      {term.syntax}
                    </code>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
