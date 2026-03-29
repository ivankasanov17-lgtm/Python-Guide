import { useState, useMemo } from "react";
import { Search, ChevronRight, Terminal, ArrowLeft, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { terms, Term } from "@/data/terms";
import { CodeBlock } from "@/components/CodeBlock";

export default function ReferencePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTermName, setSelectedTermName] = useState<string | null>(null);

  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) return terms;
    return terms.filter((term) =>
      term.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const selectedTerm = useMemo(() => {
    return terms.find((t) => t.name === selectedTermName) || null;
  }, [selectedTermName]);

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto overflow-hidden bg-background">
      
      {/* Sidebar - Hidden on mobile if a term is selected */}
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
              placeholder="Поиск методов и терминов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <AnimatePresence>
            {filteredTerms.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 px-4 text-muted-foreground"
              >
                <Terminal className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Ничего не найдено по запросу "{searchQuery}"</p>
              </motion.div>
            ) : (
              filteredTerms.map((term) => (
                <button
                  key={term.name}
                  onClick={() => setSelectedTermName(term.name)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group flex items-center justify-between ${
                    selectedTermName === term.name
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div>
                    <span className="font-mono text-sm font-medium">{term.name}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${
                    selectedTermName === term.name ? "text-primary-foreground opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                  }`} />
                </button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content Area */}
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
            {/* Mobile Back Button */}
            <button 
              onClick={() => setSelectedTermName(null)}
              className="md:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к списку
            </button>

            <div className="mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono text-foreground inline-flex items-center gap-3">
                <span className="text-primary">def</span> {selectedTerm.name}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                {selectedTerm.description}
              </p>
            </div>

            <div className="space-y-10">
              {/* Syntax Section */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-primary" />
                  Синтаксис
                </h2>
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 sm:p-5">
                  <code className="text-primary font-mono text-base sm:text-lg font-medium">
                    {selectedTerm.syntax}
                  </code>
                </div>
              </section>

              {/* Arguments Section */}
              {selectedTerm.arguments.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Аргументы</h2>
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

              {/* Example Section */}
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
            <h2 className="text-2xl font-bold text-foreground mb-2">Справочник Python</h2>
            <p className="text-muted-foreground max-w-md">
              Выберите термин или метод из бокового меню слева, чтобы посмотреть его подробное описание, синтаксис и примеры использования.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
