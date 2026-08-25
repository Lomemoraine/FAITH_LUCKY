import {
  ArrowRight,
  Heart,
  MessageCircle,
  PenLine,
  ShoppingBag,
  Sparkles,
  UserCheck,
  Wind,
} from "lucide-react";
import type { AppView } from "./app-shell";

interface SupportHomeProps {
  onNavigate: (view: AppView) => void;
  onShare: () => void;
  onBreathe: () => void;
}

const supportChoices = [
  {
    title: "Share what’s on your mind",
    description: "Write anonymously in a supportive community.",
    icon: PenLine,
    action: "share",
  },
  {
    title: "Read stories from others",
    description: "Find experiences that remind you you’re not alone.",
    icon: MessageCircle,
    action: "community",
  },
  {
    title: "Talk to a counselor",
    description: "Start a private, confidential conversation.",
    icon: UserCheck,
    action: "psychologist",
  },
  {
    title: "Calm down for two minutes",
    description: "Follow a gentle guided breathing exercise.",
    icon: Wind,
    action: "breathe",
  },
] as const;

const services = [
  {
    title: "Community",
    description: "Anonymous stories",
    icon: MessageCircle,
    view: "community" as const,
  },
  {
    title: "Counselor",
    description: "Private conversation",
    icon: UserCheck,
    view: "psychologist" as const,
  },
  {
    title: "Self-care",
    description: "Calming tools",
    icon: Sparkles,
    view: "wellness" as const,
  },
  {
    title: "Care gifts",
    description: "Merch that unlocks care",
    icon: ShoppingBag,
    view: "store" as const,
  },
];

export function SupportHome({ onNavigate, onShare, onBreathe }: SupportHomeProps) {
  const runAction = (action: (typeof supportChoices)[number]["action"]) => {
    if (action === "share") {
      onShare();
      return;
    }

    if (action === "breathe") {
      onBreathe();
      return;
    }

    onNavigate(action);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-14">
      <section className="grid items-end gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div className="pb-2">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <Heart className="h-3.5 w-3.5" />
            A safe place to begin
          </div>
          <h1 className="max-w-xl text-balance font-display text-4xl font-bold tracking-[-0.03em] text-[#21191d] sm:text-5xl lg:text-6xl">
            What would help you right now?
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#6d6267]">
            There is no wrong place to start. Choose one small next step and stay
            completely anonymous.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_55px_rgba(64,35,44,0.10)]">
          {supportChoices.map(({ title, description, icon: Icon, action }, index) => (
            <button
              key={title}
              onClick={() => runAction(action)}
              className={`group flex min-h-24 w-full items-center gap-4 border-b border-[#efe5e7] px-5 py-4 text-left transition-colors last:border-b-0 sm:px-6 ${
                index === 0
                  ? "bg-rose-500 text-white hover:bg-rose-600"
                  : "text-[#21191d] hover:bg-[#fcf7f6]"
              }`}
            >
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                  index === 0 ? "bg-white/20 text-white" : "bg-rose-50 text-rose-600"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{title}</span>
                <span
                  className={`mt-1 block text-sm leading-5 ${
                    index === 0 ? "text-rose-50" : "text-[#766b70]"
                  }`}
                >
                  {description}
                </span>
              </span>
              <ArrowRight
                className={`h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1 ${
                  index === 0 ? "text-white" : "text-rose-400"
                }`}
              />
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-[#21191d] sm:text-3xl">
              More ways we can support you
            </h2>
            <p className="mt-2 text-sm text-[#766b70]">
              Everything in SafeSpace stays close and easy to reach.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[#eadfe1] bg-white sm:grid-cols-4">
          {services.map(({ title, description, icon: Icon, view }) => (
            <button
              key={title}
              onClick={() => onNavigate(view)}
              className="group flex min-h-32 flex-col items-start justify-between border-b border-r border-[#eadfe1] p-4 text-left transition-colors hover:bg-[#fcf7f6] even:border-r-0 sm:border-b-0 sm:even:border-r sm:last:border-r-0 sm:p-5"
            >
              <Icon className="h-5 w-5 text-rose-500" />
              <span>
                <span className="block font-bold text-[#21191d]">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-[#766b70]">
                  {description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col justify-between gap-5 rounded-2xl bg-[#21191d] p-6 text-white sm:flex-row sm:items-center sm:px-8">
        <div>
          <p className="font-display text-xl font-bold">A counselor is available now</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#d9cfd3]">
            Your first private conversation is free and confidential.
          </p>
        </div>
        <button
          onClick={() => onNavigate("psychologist")}
          className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#21191d] transition-colors hover:bg-rose-50"
        >
          Start private chat
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </div>
  );
}
