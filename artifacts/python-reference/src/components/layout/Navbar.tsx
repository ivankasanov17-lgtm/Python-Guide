import { Link, useRoute, useLocation } from "wouter";
import { BookOpen, Code2, Layers, Zap, GraduationCap, Menu, X, Cpu, Brain } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type NavLink = { href: string; label: string; icon: React.ReactNode };
type NavGroup = { label: string; color: string; links: NavLink[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Python",
    color: "text-blue-500",
    links: [
      { href: "/reference", label: "Справочник", icon: <BookOpen className="h-4 w-4" /> },
      { href: "/examples", label: "Примеры", icon: <Code2 className="h-4 w-4" /> },
      { href: "/python-interview", label: "Собеседование", icon: <GraduationCap className="h-4 w-4" /> },
    ],
  },
  {
    label: "Django",
    color: "text-green-500",
    links: [
      { href: "/django", label: "Справочник", icon: <Layers className="h-4 w-4" /> },
      { href: "/django-examples", label: "Примеры", icon: <Code2 className="h-4 w-4" /> },
      { href: "/django-interview", label: "Собеседование", icon: <GraduationCap className="h-4 w-4" /> },
    ],
  },
  {
    label: "FastAPI",
    color: "text-orange-500",
    links: [
      { href: "/fastapi", label: "Справочник", icon: <Zap className="h-4 w-4" /> },
      { href: "/fastapi-examples", label: "Примеры", icon: <Code2 className="h-4 w-4" /> },
      { href: "/fastapi-interview", label: "Собеседование", icon: <GraduationCap className="h-4 w-4" /> },
    ],
  },
  {
    label: "DRF",
    color: "text-rose-500",
    links: [
      { href: "/drf", label: "Справочник", icon: <Cpu className="h-4 w-4" /> },
      { href: "/drf-examples", label: "Примеры", icon: <Code2 className="h-4 w-4" /> },
      { href: "/drf-interview", label: "Собеседование", icon: <GraduationCap className="h-4 w-4" /> },
    ],
  },
];

function NavItem({ href, label, icon, onClose }: NavLink & { onClose: () => void }) {
  const [isActive] = useRoute(href);
  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      {label}
      {isActive && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      className={cn(
        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors",
        "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function ActivePageLabel() {
  const [location] = useLocation();
  if (location === "/review") {
    return (
      <span className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
        <span className="font-medium text-primary">Повторение</span>
      </span>
    );
  }
  for (const group of NAV_GROUPS) {
    for (const link of group.links) {
      if (link.href === location) {
        return (
          <span className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className={cn("font-medium", group.color)}>{group.label}</span>
            <span className="text-muted-foreground/40">/</span>
            <span>{link.label}</span>
          </span>
        );
      }
    }
  }
  return null;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <code className="font-mono font-bold text-lg">Py</code>
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:inline-block">
              Python Docs
            </span>
          </Link>
        <div className="flex-shrink-0 ml-4">
          <ThemeToggle />
        </div>

          {/* Active page breadcrumb */}
          <ActivePageLabel />

          {/* Menu button */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all",
              open
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="h-4 w-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="h-4 w-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              ref={panelRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed right-4 top-20 z-50 w-72 rounded-xl border border-border/60 bg-background shadow-xl sm:right-6 lg:right-8"
            >
              <div className="p-2 space-y-1">
                {/* Повторение — общая страница */}
                <NavItem
                  href="/review"
                  label="Повторение"
                  icon={<Brain className="h-4 w-4" />}
                  onClose={() => setOpen(false)}
                />
                <div className="my-1 border-t border-border/40" />
                {NAV_GROUPS.map((group, i) => (
                  <div key={group.label}>
                    {i > 0 && <div className="my-1 border-t border-border/40" />}
                    <p className={cn("px-3 py-1.5 text-xs font-semibold uppercase tracking-wider", group.color)}>
                      {group.label}
                    </p>
                    {group.links.map((link) => (
                      <NavItem key={link.href} {...link} onClose={() => setOpen(false)} />
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
