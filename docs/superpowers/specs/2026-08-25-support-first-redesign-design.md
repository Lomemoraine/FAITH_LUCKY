# TFL SafeSpace Support-First Redesign

## Goal

Make the prototype immediately understandable to a first-time or distressed visitor. The opening screen should answer one question: what kind of support would help right now? Existing prototype interactions remain available, but the interface reveals them in a calmer order.

## Information Architecture

The opening view becomes a support home instead of the community feed. Its content order is:

1. A compact header with the TFL SafeSpace identity, privacy reassurance, and persistent urgent-help access.
2. A primary prompt: "What would help you right now?"
3. Four support paths:
   - Share what is on your mind anonymously.
   - Read community stories.
   - Talk privately to a counselor.
   - Start a short calming exercise.
4. A compact service grid for Community, Counselor, Self-Care, and Care Gifts.
5. A small availability or community preview that does not compete with the main choices.

Community, store, counselor chat, and self-care remain focused application views. Every view has an obvious route back to the support home.

## Navigation

- The logo returns to the support home.
- Desktop uses quiet secondary navigation rather than a large segmented control competing with the page heading.
- Mobile uses a fixed four-item bottom navigation with Home, Stories, Counselor, and Self-Care.
- Care Gifts remains discoverable from the support-home service grid and relevant community prompts instead of taking a primary mobile navigation slot.
- Urgent Help remains visible in the header and opens the existing crisis-support modal.
- Duplicate crisis links and repeated calls to action are removed. Contextual crisis guidance remains on flagged content.

## Community View

- Remove the permanent three-column dashboard and both sidebars.
- Use a centered, readable feed column.
- Place the anonymous composer first, followed by compact horizontal topic filters.
- Keep post metadata, text, voice playback, contextual crisis guidance, empathy, and replies.
- Reduce the visual prominence of metadata, reactions, and replies so each story remains the primary reading target.
- Put secondary support links in a small, non-sticky panel after the feed rather than beside every post.

## Store, Counselor, And Self-Care Views

- Give each view a short title, one-sentence explanation, and one dominant action.
- Preserve product checkout, Care Pass redemption, chat, breathing, grounding, and crisis-modal prototype behavior.
- Simplify card styling and spacing so repeated boxes do not create dashboard density.
- On small screens, forms and action rows stack rather than compress.

## Visual System

- Retain the warm blush and rose identity while reducing saturated pink across large surfaces.
- Use warm white cards, a pale neutral canvas, charcoal headings, muted body text, and rose for primary actions.
- Use green only for availability, confidentiality, and successful states.
- Keep Playfair Display for limited emotional headings and Plus Jakarta Sans for interface text.
- Replace decorative emoji with Lucide icons where a clear matching icon exists. Content emoji inside user stories remains untouched.
- Increase whitespace between sections while tightening spacing inside related controls.
- Limit each screen to one visually dominant action.

## Responsive Behavior

- Design mobile-first at a 375px minimum viewport.
- Maintain 44px minimum interactive targets.
- Avoid horizontal page overflow; only topic filters may scroll horizontally.
- Desktop content uses a bounded reading width instead of filling the viewport with sidebars.
- Mobile bottom navigation reserves enough page padding that it never covers content or actions.

## Accessibility And Safety

- Preserve the skip link, semantic landmarks, labels, current-state attributes, and visible focus styles.
- Maintain reduced-motion handling and avoid motion as the only state indicator.
- Urgent help must be reachable in one action from every primary view.
- Crisis content must use direct, calm language without making unsupported medical claims.
- Do not expose additional personal information in UI copy or prototype state.

## Component Boundaries

Split the current single-page component into focused presentation units while keeping prototype state at the application level:

- App shell and navigation.
- Support home.
- Community feed and post card.
- Store view and product card.
- Counselor view.
- Self-care view.
- Existing modal flows.

The redesign does not add routing, persistence, authentication, payments, or backend services. Those functional integrations remain separate work.

## Verification

- Run the production build for TypeScript and Next.js compilation.
- Verify all support-home paths, navigation items, modals, forms, and prototype interactions.
- Check desktop and mobile layouts, including a 375px viewport.
- Check keyboard navigation, focus visibility, touch targets, reduced motion, and content not being obscured by mobile navigation.
- Review the result on localhost before any push or pull request.
