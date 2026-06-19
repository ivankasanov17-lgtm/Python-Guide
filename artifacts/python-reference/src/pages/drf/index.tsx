import { useState, useMemo, useEffect } from "react";
import { Search, ChevronRight, Terminal, ArrowLeft, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { drfTerms, DrfTerm } from "@/data/drf-terms";
import { CodeBlock } from "@/components/CodeBlock";

export default function DrfPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTermName, setSelectedTermName] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const termParam = params.get("term");
    if (termParam) {
      setSelectedTermName(decodeURIComponent(termParam));
    }
  }, []);

  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) return drfTerms;
    const q = searchQuery.toLowerCase();
    return drfTerms.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const selectedTerm = useMemo(
    () => drfTerms.find((t) => t.name === selectedTermName) ?? null,
    [selectedTermName]
  );

  const groupedTerms = useMemo(() => {
    const groups: { category: string; terms: DrfTerm[] }[] = [];
    for (const term of filteredTerms) {
      const last = groups[groups.length - 1];
      if (last && last.category === term.category) {
        last.terms.push(term);
      } else {
        groups.push({ category: term.category, terms: [term] });
      }
    }
    return groups;
  }, [filteredTerms]);

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto overflow-hidden bg-background">

      <div
        className={`flex-col w-full md:w-80 lg:w-96 border-r border-border/50 bg-sidebar/50 flex-shrink-0 ${
          selectedTerm ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-border/50 bg-background/50 backdrop-blur z-10 sticky top-0">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              className="w-full bg-background border border-input rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground shadow-sm"
              placeholder="Поиск классов и методов DRF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <AnimatePresence>
            {groupedTerms.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 px-4 text-muted-foreground"
              >
                <Terminal className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Ничего не найдено по запросу "{searchQuery}"</p>
              </motion.div>
            ) : (
              groupedTerms.map((group) => (
                <motion.div
                  key={group.category}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4"
                >
                  <div className="px-2 py-1.5 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {group.category}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {group.terms.map((term) => (
                      <button
                        key={term.name}
                        onClick={() => setSelectedTermName(term.name)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl transition-all duration-200 group flex items-center justify-between ${
                          selectedTermName === term.name
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <span className="font-mono text-sm font-medium truncate">
                          {term.name}
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform ${
                            selectedTermName === term.name
                              ? "text-primary-foreground opacity-100"
                              : "text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <div
        className={`flex-1 flex-col overflow-y-auto bg-background/50 ${
          selectedTerm ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedTerm ? (
          <motion.div
            key={selectedTerm.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-10"
          >
            <button
              onClick={() => setSelectedTermName(null)}
              className="md:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к списку
            </button>

            <div className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-500 border border-orange-500/20">
                  {selectedTerm.category}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono text-foreground">
                <span className="text-orange-500">drf</span>{" "}
                {selectedTerm.name}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                {selectedTerm.description}
              </p>
            </div>

            <div className="space-y-10">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-primary" />
                  Синтаксис
                </h2>
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 sm:p-5">
                  <code className="text-primary font-mono text-base sm:text-lg font-medium whitespace-pre-wrap">
                    {selectedTerm.syntax}
                  </code>
                </div>
              </section>

              {selectedTerm.arguments.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Параметры</h2>
                  <div className="border border-border/50 rounded-2xl overflow-hidden bg-card shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 border-b border-border/50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-foreground w-1/3">Параметр</th>
                          <th className="px-4 py-3 font-semibold text-foreground">Описание</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {selectedTerm.arguments.map((arg, idx) => (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 align-top">
                              <code className="text-primary font-mono bg-primary/10 px-2 py-1 rounded-md text-xs">
                                {arg.name}
                              </code>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground leading-relaxed align-top">
                              {arg.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Пример использования</h2>
                <CodeBlock code={selectedTerm.example} />
              </section>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-center p-8 h-full">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-6 shadow-inner rotate-3">
              <BookOpen className="w-10 h-10 text-muted-foreground -rotate-3" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Справочник DRF</h2>
            <p className="text-muted-foreground max-w-md">
              Выберите класс или метод из бокового меню слева, чтобы посмотреть его подробное описание, параметры и примеры использования.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
