import { useState, useMemo } from "react";
import { Search, ChevronRight, GraduationCap, ArrowLeft, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InterviewQuestion, Difficulty } from "@/data/interview";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  junior: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  middle: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  senior: "bg-red-500/10 text-red-600 border-red-500/20",
};

type Props = {
  questions: InterviewQuestion[];
  title: string;
  searchPlaceholder: string;
  emptyIcon: React.ReactNode;
};

export function InterviewPage({ questions, title, searchPlaceholder, emptyIcon }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");

  const filtered = useMemo(() => {
    let result = questions;
    if (difficultyFilter !== "all") {
      result = result.filter((q) => q.difficulty === difficultyFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [questions, searchQuery, difficultyFilter]);

  const selected = useMemo(
    () => questions.find((q) => q.id === selectedId) ?? null,
    [questions, selectedId]
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto overflow-hidden bg-background">

      {/* Sidebar */}
      <div
        className={cn(
          "flex-col w-full md:w-80 lg:w-96 border-r border-border/50 bg-sidebar/50 flex-shrink-0",
          selected ? "hidden md:flex" : "flex"
        )}
      >
        {/* Search */}
        <div className="p-4 border-b border-border/50 bg-background/50 backdrop-blur z-10 sticky top-0 space-y-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              className="w-full bg-background border border-input rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground shadow-sm"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Difficulty filter */}
          {questions.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {(["all", "junior", "middle", "senior"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficultyFilter(d)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium border transition-all",
                    difficultyFilter === d
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {d === "all" ? "Все" : DIFFICULTY_LABEL[d]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Question list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 px-4 text-muted-foreground"
              >
                <div className="w-12 h-12 mx-auto mb-3 opacity-20 flex items-center justify-center">
                  {emptyIcon}
                </div>
                <p className="text-sm">
                  {searchQuery.trim() || difficultyFilter !== "all"
                    ? "Ничего не найдено"
                    : "Вопросы ещё не добавлены"}
                </p>
              </motion.div>
            ) : (
              filtered.map((item, idx) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group flex flex-col gap-1.5",
                    selectedId === item.id
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-snug line-clamp-2">
                      {item.question}
                    </span>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 flex-shrink-0 mt-0.5 transition-transform",
                        selectedId === item.id
                          ? "text-primary-foreground opacity-100"
                          : "text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-md border font-medium",
                        selectedId === item.id
                          ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20"
                          : DIFFICULTY_COLOR[item.difficulty]
                      )}
                    >
                      {DIFFICULTY_LABEL[item.difficulty]}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        selectedId === item.id ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {item.category}
                    </span>
                  </div>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Detail panel */}
      <div
        className={cn(
          "flex-1 flex-col overflow-y-auto bg-background/50",
          selected ? "flex" : "hidden md:flex"
        )}
      >
        {selected ? (
          <QuestionDetail question={selected} onBack={() => setSelectedId(null)} />
        ) : (
          <EmptyState title={title} icon={emptyIcon} />
        )}
      </div>
    </div>
  );
}

function QuestionDetail({
  question,
  onBack,
}: {
  question: InterviewQuestion;
  onBack: () => void;
}) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-10"
    >
      <button
        onClick={onBack}
        className="md:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к списку
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={cn("text-xs px-2.5 py-1 rounded-lg border font-medium", DIFFICULTY_COLOR[question.difficulty])}>
            {DIFFICULTY_LABEL[question.difficulty]}
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border/50">
            {question.category}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
          {question.question}
        </h1>
      </div>

      {/* Answer */}
      {question.answer && (
        <section>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Ответ
          </h2>
          <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6 shadow-sm">
            <AnswerRenderer text={question.answer} />
          </div>
        </section>
      )}
    </motion.div>
  );
}

function AnswerRenderer({ text }: { text: string }) {
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
            <code key={i} className="font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function EmptyState({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center flex-col text-center p-8 h-full">
      <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-6 shadow-inner rotate-3">
        <div className="w-10 h-10 text-muted-foreground -rotate-3 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md">
        Выберите вопрос из списка слева, чтобы увидеть подробный ответ.
      </p>
    </div>
  );
}
