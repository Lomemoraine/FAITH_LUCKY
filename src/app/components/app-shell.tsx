import Image from "next/image";
import type { ReactNode } from "react";
import {
  HeartHandshake,
  Home,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  ShoppingBag,
  Smile,
  UserCheck,
} from "lucide-react";

export type AppView =
  | "home"
  | "community"
  | "store"
  | "psychologist"
  | "wellness";

interface AppShellProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenCrisis: () => void;
  children: ReactNode;
}

const desktopItems = [
  { id: "home" as const, label: "Support home", icon: Home },
  { id: "community" as const, label: "Stories", icon: MessageCircle },
  { id: "store" as const, label: "Care gifts", icon: ShoppingBag },
  { id: "psychologist" as const, label: "Counselor", icon: UserCheck },
  { id: "wellness" as const, label: "Self-care", icon: Smile },
];

const mobileItems = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "community" as const, label: "Stories", icon: MessageCircle },
  { id: "store" as const, label: "Care gifts", icon: ShoppingBag },
  { id: "psychologist" as const, label: "Counselor", icon: HeartHandshake },
  { id: "wellness" as const, label: "Self-care", icon: Smile },
];


export function AppShell({
  activeView,
  onNavigate,
  onOpenCrisis,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#fcf9f7] pb-24 text-[#2b2226] md:pb-10">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-[#eadfe1] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => onNavigate("home")}
            className="flex min-h-11 items-center gap-3 text-left"
            aria-label="Return to support home"
          >
            <Image
              src="/tfl-logo-transparent.png"
              alt=""
              width={40}
              height={48}
              priority
              className="object-contain"
            />
            <span>
              <span className="block font-display text-lg font-bold leading-tight text-[#21191d]">
                TFL <span className="font-sans text-rose-500">SafeSpace</span>
              </span>
              <span className="hidden text-[11px] text-[#766b70] sm:block">
                Private, anonymous support
              </span>
            </span>
          </button>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
            {desktopItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeView === id;

              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-rose-50 text-rose-700"
                      : "text-[#766b70] hover:bg-[#f8f4f2] hover:text-[#21191d]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </nav>

          <button
            onClick={onOpenCrisis}
            className="flex min-h-11 items-center gap-2 rounded-full border border-rose-200 bg-white px-3 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50 sm:px-4"
          >
            <PhoneCall className="h-4 w-4" />
            <span className="hidden sm:inline">Urgent help</span>
            <span className="sm:hidden">Help</span>
          </button>
        </div>

        <div className="border-t border-emerald-100/70 bg-emerald-50/70 px-4 py-1.5 text-center text-[11px] font-medium text-emerald-800">
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
          Your identity is never shown in community stories
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#eadfe1] bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(60,31,40,0.08)] backdrop-blur md:hidden"
      >
        {mobileItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;

          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold ${
                isActive ? "bg-rose-50 text-rose-700" : "text-[#766b70]"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
