# ClipForge AI — Theme & Design System Rules

These rules MUST be followed by all agents working on this project. Violating these rules results in visual inconsistency.

---

## 1. Color Palette

| Token                    | Value                              | Usage                                             |
| ------------------------ | ---------------------------------- | ------------------------------------------------- |
| `--color-forge-accent`   | `#7C6AFA`                          | Primary accent — CTAs, active states, highlights  |
| `--color-forge-accent-2` | `#3ECFCF`                          | Secondary accent — badges, captions, teal accents |
| `--color-forge-bg`       | `#05050A`                          | Page background (deep near-black)                 |
| White text               | `text-white`                       | Headings only                                     |
| Muted text               | `text-white/45` to `text-white/55` | Body copy                                         |
| Subtle text              | `text-white/25` to `text-white/35` | Captions, timestamps, labels                      |

**Never use plain Tailwind colors** (red-500, blue-500, etc.) for brand elements.  
Use hex values with opacity modifiers (e.g., `#FF6B6B` for danger/energy accents).

---

## 2. Typography

| Role        | Font Variable          | Class                                          |
| ----------- | ---------------------- | ---------------------------------------------- |
| Headings    | `--font-space-grotesk` | `font-[family-name:var(--font-space-grotesk)]` |
| Body / UI   | `--font-dm-sans`       | `font-[family-name:var(--font-dm-sans)]`       |
| Code / Mono | `--font-geist-mono`    | `font-mono`                                    |

- Headings use `font-extrabold`, `tracking-[-1.5px]` to `tracking-[-2px]`
- Body uses `leading-relaxed`
- Caps labels (e.g., "SCROLL", "WAVEFORM ANALYSIS") use `font-mono text-[11px] tracking-widest`

---

## 3. Dark Theme

The app is **always dark**. There is no light mode toggle.

- Background: `bg-forge-bg` → `#05050A`
- Cards/panels: `bg-white/[0.025]` to `bg-white/[0.04]` (glassmorphism)
- Borders: `border-white/7` (default), `border-white/12` (hover)
- The `html` element must NOT have a `.dark` class toggle — the forge palette handles theming directly.
- Clerk components must use `appearance` prop with `baseTheme: dark` and custom variables matching forge colors.

---

## 4. Glassmorphism Panels

All cards and floating panels use:

```
bg-white/[0.03]  (or 0.025 for subtle, 0.04 for hover)
border border-white/8  (or white/10 for elevated panels)
backdrop-blur-xl
rounded-[18px]  (or 14px for smaller cards, 20px for major panels)
```

Shadow system:

- `shadow-forge-glow` → `box-shadow: 0 0 40px rgba(124,106,250,0.35)`
- `shadow-forge-panel` → `box-shadow: 0 0 80px rgba(124,106,250,0.2), 0 30px 60px rgba(0,0,0,0.5)`

---

## 5. Gradient Utilities

Use predefined utilities — do NOT inline gradients for brand colors:

```
text-gradient-forge  → gradient text from accent to accent-2
bg-gradient-forge    → gradient background from accent to accent-2
```

Both go `from-forge-accent to-forge-accent-2` at `br` (bottom-right) direction.

---

## 6. Motion & Animation Rules

- Use **Framer Motion** for all animations (already installed as `framer-motion`).
- Use the **spring-like easing** `[0.16, 1, 0.3, 1]` for entrance animations.
- Entrance animations: `opacity: 0 → 1`, `y: 24–32 → 0`, duration 0.6–0.8s.
- Hover effects: `whileHover={{ scale: 1.04 }}` for buttons, `whileHover={{ scale: 1.03 }}` for cards.
- Tap feedback: `whileTap={{ scale: 0.97 }}`.
- Infinite ambient: use `ease: "easeInOut"` with `repeat: Infinity`.
- **Performance**: Use `will-change: transform` on animated elements. Avoid animating `width`/`height` when `transform: scaleX` can be used instead. Use CSS transitions (`transition-[background,border-color]`) for hover state changes, not JS-driven.

---

## 7. Spacing & Layout

- Max content width: `max-w-[1200px]` with `mx-auto`
- Section padding: `px-6 py-[100px]`
- Section gaps: `gap-4` for dense grids, `gap-6` for cards, `gap-12` for footer columns
- Border radius scale: `rounded-lg` (8px) → `rounded-[10px]` → `rounded-[14px]` → `rounded-[18px]` → `rounded-[20px]` → `rounded-full`

---

## 8. Badge / Pill Labels

All section badges follow this pattern:

```tsx
<div className="inline-flex items-center gap-1.5 rounded-full border border-forge-accent/20 bg-forge-accent/10 px-3.5 py-1.25">
  <span className="font-[family-name:var(--font-dm-sans)] text-xs font-medium text-forge-accent">
    Label
  </span>
</div>
```

Use `forge-accent` color for primary badges, `forge-accent-2` for secondary.

---

## 9. Button Styles

**Primary (gradient):**

```tsx
className="flex items-center gap-2 rounded-[10px] bg-gradient-forge px-[26px] py-3.5 text-[15px] font-bold text-white"
whileHover={{ scale: 1.04, boxShadow: `0 0 40px rgba(124,106,250,0.35)` }}
whileTap={{ scale: 0.97 }}
```

**Secondary (ghost):**

```tsx
className="flex items-center gap-2 rounded-[10px] border border-white/12 bg-white/[0.04] px-6 py-3.5 text-[15px] font-semibold text-white/75"
whileHover={{ scale: 1.04 }}
whileTap={{ scale: 0.97 }}
```

---

## 10. Clerk Authentication Appearance

**Always apply dark theming to Clerk components:**

```tsx
import { dark } from "@clerk/themes";

<ClerkProvider appearance={{ baseTheme: dark, variables: { colorPrimary: "#7C6AFA", colorBackground: "#05050A", colorInputBackground: "#0d0d18", colorText: "#ffffff" } }}>
```

The `SignIn` and `SignUp` components on their dedicated pages must also set `appearance` matching the forge palette.

---

## 11. File Conventions

- Landing components live in `components/landing/`
- Design tokens (JS-accessible): `components/landing/tokens.ts`
- Framer Motion variants: `components/landing/animations.ts`
- All new components must be `"use client"` if they use hooks or motion
- CSS custom properties are defined in `app/globals.css` under `@theme inline {}`
