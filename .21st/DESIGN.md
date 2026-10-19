# CampusConnect UASZ — Design Context

## Product

CampusConnect is the private social network for the Université Assane Seck de Ziguinchor. It brings campus news, academic resources, events, student classifieds, messaging, polls, quizzes and moderation into one accessible workspace.

## Stack

- React 19, TypeScript, Vite, React Router
- Tailwind CSS 4 and DaisyUI 5
- Motion for React (`motion/react`) and Lucide icons

## Visual direction

Use a calm, welcoming campus identity with a warm ivory canvas and evergreen actions. The five-color palette is: ivory `#F5F3EB`, evergreen `#175C47`, sage `#82A98E`, sun gold `#E6BD68`, and terracotta `#D9775C`. Use ink and neutral grays for readable body copy and functional status colors only where their meaning is clear.

Keep the layout quiet and practical: clear page titles, one primary action per view, consistent cards and form controls, generous but efficient spacing, and a mobile-first flow. Navigation remains horizontally scrollable on small screens. Messaging, directories, forms and content cards must stay usable at 320px wide.

Use rounded surfaces with restrained shadows, visible keyboard focus, semantic controls, French interface copy and compact line icons. Avoid decorative gradients, excessive card nesting, and motion that changes layout unexpectedly.

Respect `prefers-reduced-motion` with Motion's `MotionConfig reducedMotion="user"`. Use short opacity/position transitions for route changes and light layout transitions when content is added or removed.

## Design decision

The frontend uses one five-color campus palette across every authenticated section and the sign-in flow. Evergreen identifies primary actions; sun gold and terracotta are reserved for emphasis and status. Motion and Lucide are shared UI dependencies rather than page-specific additions.
