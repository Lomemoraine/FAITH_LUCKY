# TFL SafeSpace Support-First Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dense dashboard-style opening experience with a calm support-first home and simpler focused views while preserving existing prototype interactions.

**Architecture:** Keep application state and modal flows in `SafeSpaceApp`, but extract the app shell and support home into focused components. Add a `home` view, make it the initial state, and simplify the community screen to one readable feed column with horizontal filters. Existing store, counselor, self-care, and modal behavior remains in place with lighter framing.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript 5, Tailwind CSS 3.4, Lucide React.

## Global Constraints

- Design mobile-first at a 375px minimum viewport.
- Maintain 44px minimum interactive targets.
- Urgent help must be reachable in one action from every primary view.
- Preserve the current in-memory prototype behavior; do not add routing, persistence, authentication, payments, or backend services.
- Use rose for primary actions and green only for availability, confidentiality, and successful states.
- Keep Playfair Display for limited emotional headings and Plus Jakarta Sans for interface text.
- Review the result on localhost before any push or pull request.

## File Map

- Create `src/app/components/app-shell.tsx`: shared header, desktop navigation, and fixed mobile navigation.
- Create `src/app/components/support-home.tsx`: guided support opening screen and compact service grid.
- Modify `src/app/page.tsx`: add the home view, connect extracted components, simplify community layout, and preserve existing modal/state behavior.
- Modify `src/app/globals.css`: update canvas/card styling and add reusable no-scrollbar and panel utilities.

---

### Task 1: App Shell And Navigation

**Files:**
- Create: `src/app/components/app-shell.tsx`
- Modify: `src/app/page.tsx:20-21,335-447,976-988`

**Interfaces:**
- Produces: `export type AppView = "home" | "community" | "store" | "psychologist" | "wellness"`.
- Produces: `AppShellProps { activeView: AppView; onNavigate(view: AppView): void; onOpenCrisis(): void; children: ReactNode }`.
- Consumes: `/tfl-logo-transparent.png`, Lucide icons, and the existing crisis-modal callback.

- [ ] **Step 1: Create the shell with a compact header and responsive navigation**

```tsx
"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import {
  HeartHandshake,
  Home,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Smile,
  UserCheck,
} from "lucide-react";

export type AppView = "home" | "community" | "store" | "psychologist" | "wellness";

interface AppShellProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenCrisis: () => void;
  children: ReactNode;
}

const desktopItems = [
  { id: "home" as const, label: "Support Home", icon: Home },
  { id: "community" as const, label: "Stories", icon: MessageCircle },
  { id: "psychologist" as const, label: "Counselor", icon: UserCheck },
  { id: "wellness" as const, label: "Self-Care", icon: Smile },
];

const mobileItems = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "community" as const, label: "Stories", icon: MessageCircle },
  { id: "psychologist" as const, label: "Counselor", icon: HeartHandshake },
  { id: "wellness" as const, label: "Self-Care", icon: Smile },
];

export function AppShell({ activeView, onNavigate, onOpenCrisis, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#FCF9F7] text-[#2B2226] pb-24 md:pb-10">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="sticky top-0 z-40 border-b border-rose-100/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button onClick={() => onNavigate("home")} className="flex min-h-11 items-center gap-3 text-left" aria-label="Return to support home">
            <Image src="/tfl-logo-transparent.png" alt="" width={40} height={40} priority className="object-contain" />
            <span>
              <span className="block font-display text-lg font-bold leading-tight text-gray-950">TFL <span className="font-sans text-rose-500">SafeSpace</span></span>
              <span className="hidden text-[11px] text-gray-500 sm:block">Private, anonymous support</span>
            </span>
          </button>
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
            {desktopItems.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => onNavigate(id)} aria-current={activeView === id ? "page" : undefined} className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${activeView === id ? "bg-rose-50 text-rose-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </nav>
          <button onClick={onOpenCrisis} className="flex min-h-11 items-center gap-2 rounded-full border border-rose-200 bg-white px-3 text-sm font-bold text-rose-700 hover:bg-rose-50 sm:px-4">
            <PhoneCall className="h-4 w-4" /><span className="hidden sm:inline">Urgent Help</span><span className="sm:hidden">Help</span>
          </button>
        </div>
        <div className="border-t border-rose-50 bg-emerald-50/60 px-4 py-1.5 text-center text-[11px] font-medium text-emerald-800">
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> Your identity is never shown in community stories
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-rose-100 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(60,31,40,0.08)] backdrop-blur md:hidden">
        {mobileItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onNavigate(id)} aria-current={activeView === id ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold ${activeView === id ? "bg-rose-50 text-rose-700" : "text-gray-500"}`}>
            <Icon className="h-5 w-5" />{label}
          </button>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Wire the shell into `SafeSpaceApp`**

Replace the local `Tab` type with the imported `AppView`, initialize `activeView` to `"home"`, and wrap all view content with:

```tsx
<AppShell
  activeView={activeView}
  onNavigate={setActiveView}
  onOpenCrisis={() => setShowCrisisModal(true)}
>
  <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
    {/* view switches */}
  </div>
</AppShell>
```

Update all existing `setActiveTab(...)` calls to `setActiveView(...)` and all `activeTab === ...` checks to `activeView === ...`.

- [ ] **Step 3: Run the production compiler check**

Run: `npm run build`

Expected: Next.js compiles successfully with no missing `AppView` references or TypeScript errors.

---

### Task 2: Guided Support Home

**Files:**
- Create: `src/app/components/support-home.tsx`
- Modify: `src/app/page.tsx` inside the app-shell content switch.

**Interfaces:**
- Consumes: `AppView` from `app-shell.tsx`.
- Produces: `SupportHomeProps { onNavigate(view: AppView): void; onShare(): void; onBreathe(): void }`.

- [ ] **Step 1: Create the guided support home**

```tsx
"use client";

import { Heart, MessageCircle, PenLine, ShoppingBag, Sparkles, UserCheck, Wind } from "lucide-react";
import type { AppView } from "./app-shell";

interface SupportHomeProps {
  onNavigate: (view: AppView) => void;
  onShare: () => void;
  onBreathe: () => void;
}

const supportChoices = [
  { title: "Share what’s on your mind", description: "Write anonymously in a supportive community", icon: PenLine, action: "share" },
  { title: "Read stories from others", description: "Find experiences that remind you you’re not alone", icon: MessageCircle, action: "community" },
  { title: "Talk to a counselor", description: "Start a private, confidential conversation", icon: UserCheck, action: "psychologist" },
  { title: "Calm down for two minutes", description: "Follow a gentle guided breathing exercise", icon: Wind, action: "breathe" },
] as const;

export function SupportHome({ onNavigate, onShare, onBreathe }: SupportHomeProps) {
  const runAction = (action: typeof supportChoices[number]["action"]) => {
    if (action === "share") return onShare();
    if (action === "breathe") return onBreathe();
    onNavigate(action);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <section className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><Heart className="h-3.5 w-3.5" /> A safe place to begin</span>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">What would help you right now?</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">There is no wrong place to start. Choose one small next step and stay completely anonymous.</p>
      </section>

      <section aria-label="Support choices" className="grid gap-3 sm:grid-cols-2">
        {supportChoices.map(({ title, description, icon: Icon, action }, index) => (
          <button key={title} onClick={() => runAction(action)} className={`group flex min-h-28 items-center gap-4 rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${index === 0 ? "border-rose-500 bg-rose-500 text-white shadow-rose-200" : "border-rose-100 bg-white text-gray-950 hover:border-rose-200"}`}>
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${index === 0 ? "bg-white/20 text-white" : "bg-rose-50 text-rose-600"}`}><Icon className="h-6 w-6" /></span>
            <span><span className="block font-bold">{title}</span><span className={`mt-1 block text-sm leading-5 ${index === 0 ? "text-rose-50" : "text-gray-500"}`}>{description}</span></span>
          </button>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-600">Explore SafeSpace</p><h2 className="mt-1 font-display text-2xl font-bold text-gray-950">More ways we can support you</h2></div></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { title: "Community", icon: MessageCircle, view: "community" as const },
            { title: "Counselor", icon: UserCheck, view: "psychologist" as const },
            { title: "Self-Care", icon: Sparkles, view: "wellness" as const },
            { title: "Care Gifts", icon: ShoppingBag, view: "store" as const },
          ].map(({ title, icon: Icon, view }) => (
            <button key={title} onClick={() => onNavigate(view)} className="flex min-h-28 flex-col items-start justify-between rounded-2xl border border-rose-100 bg-white p-4 text-left font-bold text-gray-900 transition-colors hover:border-rose-300 hover:bg-rose-50/30"><Icon className="h-5 w-5 text-rose-500" />{title}</button>
          ))}
        </div>
      </section>

      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 sm:flex-row sm:items-center">
        <div><p className="font-bold text-gray-950">A counselor is available now</p><p className="mt-1 text-sm text-gray-600">Your first private conversation is free and confidential.</p></div>
        <button onClick={() => onNavigate("psychologist")} className="min-h-11 rounded-xl bg-gray-950 px-5 text-sm font-bold text-white hover:bg-gray-800">Start private chat</button>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Render home as the initial view**

```tsx
{activeView === "home" && (
  <SupportHome
    onNavigate={setActiveView}
    onShare={() => setShowNewPostModal(true)}
    onBreathe={() => setShowBreathingModal(true)}
  />
)}
```

- [ ] **Step 3: Verify all four primary choices**

Run: `npm run build`

Expected: build passes. In the browser, Share opens the story modal, Stories opens community, Counselor opens chat, and Calm opens breathing.

---

### Task 3: Simplified Community And Secondary Views

**Files:**
- Modify: `src/app/page.tsx:449-988`
- Modify: `src/app/globals.css:5-108`

**Interfaces:**
- Consumes: existing `posts`, `filteredPosts`, `roomsList`, post handlers, product handlers, chat handlers, and modal callbacks.
- Produces: focused view layouts only; no changes to data types or behavior.

- [ ] **Step 1: Replace the three-column community wrapper**

Use a single centered feed and remove both `<aside>` elements:

```tsx
{activeView === "community" && (
  <div className="mx-auto max-w-2xl space-y-6">
    <header className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-600">Anonymous community</p>
      <h1 className="font-display text-3xl font-bold text-gray-950 sm:text-4xl">Stories from people who understand</h1>
      <p className="text-sm leading-6 text-gray-600">Read quietly, respond with empathy, or share whenever you feel ready.</p>
    </header>
    <button onClick={() => setShowNewPostModal(true)} className="flex min-h-16 w-full items-center gap-4 rounded-2xl border border-rose-100 bg-white p-4 text-left shadow-sm hover:border-rose-300">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600"><PenLine className="h-5 w-5" /></span>
      <span className="flex-1 text-sm text-gray-500">How is your heart feeling today?</span>
      <span className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white">Share</span>
    </button>
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter stories by topic">
      {roomsList.map((room) => (
        <button key={room.id} onClick={() => setSelectedRoom(room.id)} aria-pressed={selectedRoom === room.id} className={`min-h-11 whitespace-nowrap rounded-full border px-4 text-sm font-semibold ${selectedRoom === room.id ? "border-rose-500 bg-rose-500 text-white" : "border-rose-100 bg-white text-gray-600"}`}>{room.label}</button>
      ))}
    </div>
  </div>
)}
```

Import `PenLine` from Lucide React. Immediately after the topic-filter row, move the existing `filteredPosts.map((post) => ...)` block from lines 543-661 without changing its article body, voice note, crisis guidance, reactions, or replies. Keep its enclosing `div` class as `space-y-4`.

- [ ] **Step 2: Normalize page introductions for secondary views**

Add a concise header before the store, counselor, and self-care content using this pattern and view-specific copy:

```tsx
<header className="mb-6 space-y-2">
  <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-600">Self-care tools</p>
  <h1 className="font-display text-3xl font-bold text-gray-950 sm:text-4xl">Take one gentle minute for yourself</h1>
  <p className="max-w-2xl text-sm leading-6 text-gray-600">Choose a calming exercise or reach immediate support when things feel too heavy.</p>
</header>
```

Store copy: label `Care gifts`, heading `Gifts that help fund care`, description `Every purchase includes a SafeSpace care benefit for you or someone who needs support.`

Counselor copy: label `Private support`, heading `Talk with Dr. Amani`, description `A confidential space to speak openly and take the next step at your pace.`

- [ ] **Step 3: Add restrained global utilities**

Append to `globals.css`:

```css
.no-scrollbar {
  scrollbar-width: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

@media (max-width: 767px) {
  body {
    overscroll-behavior-y: none;
  }
}
```

Update the body background to `#fcf9f7` and leave focus, reduced-motion, skip-link, and breathing rules intact.

- [ ] **Step 4: Run compile and interaction verification**

Run: `npm run build`

Expected: build succeeds. Existing post reactions, voice playback, flagged-story counselor action, Care Pass unlock, checkout, chat, breathing, and crisis modals remain usable.

---

### Task 4: Responsive And Accessibility Verification

**Files:**
- Modify only files implicated by verification failures.

**Interfaces:**
- Consumes the complete support-first UI.
- Produces no new public interfaces.

- [ ] **Step 1: Start localhost**

Run: `npm run dev`

Expected: Next.js reports a local URL, normally `http://localhost:3000`.

- [ ] **Step 2: Verify desktop at 1440px**

Check that the opening hierarchy reads in this order: prompt, four support choices, service grid, counselor availability. Confirm secondary navigation is visually quieter than the prompt and no view uses permanent sidebars.

- [ ] **Step 3: Verify mobile at 375px**

Check that cards form one column, the service grid remains two columns, topic filters scroll without page overflow, all controls are at least 44px tall, and bottom navigation does not cover the final content or modal actions.

- [ ] **Step 4: Verify keyboard and reduced motion**

Tab through header, support choices, navigation, forms, and modal controls. Expected: every focused control has a visible outline and no keyboard trap. Emulate `prefers-reduced-motion: reduce`; expected: breathing state remains understandable without relying on animation.

- [ ] **Step 5: Run final production build**

Run: `npm run build`

Expected: successful production build with no TypeScript, lint, or rendering errors.

- [ ] **Step 6: Present localhost for user review**

Keep the development server running and provide `http://localhost:3000`. Do not push or create a pull request until the user explicitly approves the rendered result.
