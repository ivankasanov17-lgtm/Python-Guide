import { useState, useMemo } from "react";
import { Search, ChevronRight, Layers, ArrowLeft, BookMarked, FileCode2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { examples, Example } from "@/data/examples";
import { CodeBlock } from "@/components/CodeBlock";

export default function ExamplesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return examples;
    const q = searchQuery.toLowerCase();
    return examples.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.task.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const selected = useMemo(
    () => examples.find((e) => e.id === selectedId) ?? null,
    [selectedId]
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto overflow-hidden bg-background">

      {/* ── Sidebar ── */}
      <div
        className={`flex-col w-full md:w-80 lg:w-96 border-r border-border/50 bg-sidebar/50 flex-shrink-0 ${
          selected ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Search */}
        <div className="p-4 border-b border-border/50 bg-background/50 backdrop-blur z-10 sticky top-0">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              className="w-full bg-background border border-input rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground shadow-sm"
              placeholder="Поиск задач..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 px-4 text-muted-foreground"
              >
                <Layers className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Ничего не найдено по запросу «{searchQuery}»</p>
              </motion.div>
            ) : (
              filtered.map((ex, idx) => (
                <motion.button
                  key={ex.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setSelectedId(ex.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group flex items-center justify-between gap-3 ${
                    selectedId === ex.id
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`text-xs font-mono font-bold flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md ${
                        selectedId === ex.id
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium truncate">{ex.title}</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      selectedId === ex.id
                        ? "text-primary-foreground opacity-100"
                        : "text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                    }`}
                  />
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Main content ── */}
      <div
        className={`flex-1 flex-col overflow-y-auto bg-background/50 ${
          selected ? "flex" : "hidden md:flex"
        }`}
      >
        {selected ? (
          <ExampleDetail
            example={selected}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

/* ── Detail view ── */
function ExampleDetail({
  example,
  onBack,
}: {
  example: Example;
  onBack: () => void;
}) {
  return (
    <motion.div
      key={example.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-10"
    >
      {/* Mobile back button */}
      <button
        onClick={onBack}
        className="md:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к списку
      </button>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-5">
          {example.title}
        </h1>

        {/* Task description */}
        <div className="bg-muted/60 border border-border/60 rounded-2xl p-5">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Задача
          </p>
          <p className="text-base text-foreground leading-relaxed">{example.task}</p>
        </div>
      </div>

      {/* Code files */}
      <div className="space-y-8 mb-10">
        {example.files.map((file, idx) => (
          <section key={file.filename}>
            <div className="flex items-center gap-2 mb-3">
              <FileCode2 className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground font-mono">
                {idx === 0 ? "Файл 1" : `Файл ${idx + 1}`} —{" "}
                <span className="text-primary">{file.filename}</span>
              </h2>
            </div>
            <CodeBlock code={file.code} />
          </section>
        ))}
      </div>

      {/* Explanation */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-primary" />
          Пояснение к решению
        </h2>
        <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6 shadow-sm">
          <ExplanationRenderer text={example.explanation} />
        </div>
      </section>
    </motion.div>
  );
}

/* ── Explanation renderer (handles **bold**, inline `code` and newlines) ── */
function ExplanationRenderer({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      {paragraphs.map((para, pi) => {
        const lines = para.split("\n");
        return (
          <div key={pi} className="space-y-1">
            {lines.map((line, li) => (
              <p key={li}>
                <InlineMarkup text={line} />
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function InlineMarkup({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ── Empty state ── */
function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center flex-col text-center p-8 h-full">
      <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-6 shadow-inner rotate-3">
        <Layers className="w-10 h-10 text-muted-foreground -rotate-3" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Сложные примеры</h2>
      <p className="text-muted-foreground max-w-md">
        Выберите задачу из бокового меню слева, чтобы посмотреть её условие, решение по файлам и пояснение.
      </p>
    </div>
  );
}
