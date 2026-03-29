import { Link, useRoute } from "wouter";
import { BookOpen, Code2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function Navbar() {
  const [isReference] = useRoute("/reference");
  const [isExamples] = useRoute("/examples");

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 pr-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <code className="font-mono font-bold text-lg">Py</code>
          </div>
          <span className="text-lg font-bold tracking-tight hidden sm:inline-block">
            Python Docs
          </span>
        </div>

        <div className="flex flex-1 items-center gap-6 text-sm font-medium">
          <Link
            href="/reference"
            className={cn(
              "flex items-center gap-2 transition-colors hover:text-primary",
              isReference ? "text-primary" : "text-muted-foreground"
            )}
          >
            <BookOpen className="h-4 w-4" />
            Справочник
          </Link>
          <Link
            href="/examples"
            className={cn(
              "flex items-center gap-2 transition-colors hover:text-primary",
              isExamples ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Code2 className="h-4 w-4" />
            Сложные примеры
          </Link>
        </div>
      </div>
    </nav>
  );
}
