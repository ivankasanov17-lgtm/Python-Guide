import { Link, useRoute } from "wouter";
import { BookOpen, Code2, Layers, Zap, GraduationCap } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type NavGroup = {
  label: string;
  links: { href: string; label: string; icon: React.ReactNode }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Python",
    links: [
      { href: "/reference", label: "Справочник", icon: <BookOpen className="h-4 w-4 flex-shrink-0" /> },
      { href: "/examples", label: "Примеры", icon: <Code2 className="h-4 w-4 flex-shrink-0" /> },
      { href: "/python-interview", label: "Собеседование", icon: <GraduationCap className="h-4 w-4 flex-shrink-0" /> },
    ],
  },
  {
    label: "Django",
    links: [
      { href: "/django", label: "Справочник", icon: <Layers className="h-4 w-4 flex-shrink-0" /> },
      { href: "/django-examples", label: "Примеры", icon: <Code2 className="h-4 w-4 flex-shrink-0" /> },
      { href: "/django-interview", label: "Собеседование", icon: <GraduationCap className="h-4 w-4 flex-shrink-0" /> },
    ],
  },
  {
    label: "FastAPI",
    links: [
      { href: "/fastapi", label: "Справочник", icon: <Zap className="h-4 w-4 flex-shrink-0" /> },
      { href: "/fastapi-examples", label: "Примеры", icon: <Code2 className="h-4 w-4 flex-shrink-0" /> },
      { href: "/fastapi-interview", label: "Собеседование", icon: <GraduationCap className="h-4 w-4 flex-shrink-0" /> },
    ],
  },
];

function NavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  const [isActive] = useRoute(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 transition-colors hover:text-primary whitespace-nowrap text-sm",
        isActive ? "text-primary font-medium" : "text-muted-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-hide">

        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <code className="font-mono font-bold text-lg">Py</code>
          </div>
          <span className="text-lg font-bold tracking-tight hidden lg:inline-block">
            Python Docs
          </span>
        </div>

        {/* Grouped nav */}
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider pr-2 border-r border-border/50 mr-2 hidden sm:inline">
              {group.label}
            </span>
            <div className="flex items-center gap-4">
              {group.links.map((link) => (
                <NavLink key={link.href} {...link} />
              ))}
            </div>
          </div>
        ))}

      </div>
    </nav>
  );
}
