# Mutawazin — Brand Kit

Logo assets for the Mutawazin Private Tutoring platform, in multiple formats and sizes.

Open `Brand Kit.html` at the project root for a visual showcase of everything in here.

---

## What's in this folder

```
brand-kit/
├── png/                          ← raster (PNG)
│   ├── logo-lockup-{256,512,1024,2048}.png   Full logo with "MUTAWAZIN PRIVATE" text
│   ├── logo-mark-{128,256,512,1024,2048}.png Badge only, no text
│   ├── app-icon-{512,1024}.png               Square with cream bg, safe padding
│   ├── social-card-1200x630.png              Open Graph / Twitter card
│   └── favicon-{16,32}.png                   Browser tab fallbacks
└── svg/                          ← vector (SVG)
    ├── mark-primary.svg          Companion mark, navy bg, cream contents
    ├── mark-light.svg            Companion mark, cream bg, navy contents
    ├── mark-mono.svg             Single-color mark, currentColor — recolor via CSS
    ├── favicon.svg               Optimized 32×32 favicon
    └── lockup-horizontal.svg     Mark + "Mutawazin" wordmark, side-by-side
```

---

## Two marks, paired

**1. Illustrative logo (PNG only)** — the hand-drawn badge with two students, balance scale, laurel wreath, and growing plant. Cream paper background. This is the **primary brand asset**. Use it for marketing, hero sections, app splash, business cards, anywhere ≥80px and not on a colored background.

The illustration is intentionally **not** delivered as SVG. Faithfully tracing it would produce an unmaintainable file with thousands of paths; the illustration is meant to be a raster asset.

**2. Companion mark (SVG)** — a simplified geometric mark: balance scale resting on an open book. Built from clean primitives so it scales to any size and works in monochrome. Use it wherever the illustrative logo can't go: favicons, sub-32px UI, dark backgrounds, embroidery, single-color print.

The two marks **share design DNA** (balance scale + book + brand palette) so they read as the same brand even when used side-by-side.

---

## When to use which

| Surface | Use |
|---------|-----|
| Marketing hero, splash, business cards | `png/logo-lockup-1024.png` or `png/logo-mark-2048.png` |
| App header / nav (with wordmark) | `svg/lockup-horizontal.svg` |
| App header / nav (mark only) | `png/logo-mark-256.png` or `png/logo-mark-512.png` |
| Sidebar item, sub-32px UI | `svg/mark-primary.svg` |
| Favicon | `svg/favicon.svg` + `png/favicon-32.png` fallback |
| iOS / Android app icon | `png/app-icon-1024.png` |
| Open Graph / Twitter card | `png/social-card-1200x630.png` |
| Email signature | `png/logo-lockup-256.png` |
| Dark backgrounds | `svg/mark-light.svg` |
| Monochrome / single-color print | `svg/mark-mono.svg` |

---

## Brand colors

| Token | Hex | Use |
|-------|-----|-----|
| Navy | `#173343` | Wordmark, deep accents, dark surfaces |
| Teal Sage | `#2D6A5E` | Laurel, growth elements, secondary accents |
| Steel Blue | `#2F6F95` | Mid blue (hijab, book detail in illustration) |
| Warm Gold | `#C9A35A` | Decorative dots, premium accents — use sparingly |
| Cream Paper | `#F6F3EC` | Logo background, warm light surfaces |

**Digital UI palette** (used in Stages 1–4 prototypes, more vibrant for screen accessibility):

| Token | Hex | Use |
|-------|-----|-----|
| Blue UI | `#2563EB` | Primary buttons, links, active states |
| Teal UI | `#0D9488` | Secondary CTAs, teacher accents |
| Text | `#0F172A` | Headings & body |
| Bg gray | `#F8FAFC` | Sidebar, alternating rows |
| Border | `#E2E8F0` | Cards, inputs, dividers |

---

## Usage snippets

### Favicon (HTML head)

```html
<!-- modern browsers -->
<link rel="icon" type="image/svg+xml" href="/brand-kit/svg/favicon.svg">

<!-- legacy PNG fallback -->
<link rel="icon" type="image/png" href="/brand-kit/png/favicon-32.png" sizes="32x32">
<link rel="icon" type="image/png" href="/brand-kit/png/favicon-16.png" sizes="16x16">

<!-- iOS home-screen icon -->
<link rel="apple-touch-icon" href="/brand-kit/png/app-icon-512.png">
```

### Open Graph / social preview

```html
<meta property="og:image" content="https://mutawazin.com/brand-kit/png/social-card-1200x630.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://mutawazin.com/brand-kit/png/social-card-1200x630.png">
```

### Header logo (responsive)

```html
<picture>
  <source media="(min-width: 768px)" srcset="/brand-kit/png/logo-mark-512.png">
  <img src="/brand-kit/png/logo-mark-256.png" alt="Mutawazin" width="48" height="34">
</picture>
```

### SVG mark — recolor via CSS

The mono SVG uses `currentColor`, so the parent's `color` value drives fill and stroke:

```css
.logo-mark              { color: #173343; }
.logo-mark.dark-mode    { color: #f6f3ec; }
.logo-mark.brand-blue   { color: #2563EB; }
```

```html
<!-- inline mark-mono.svg, or <img> reference -->
<svg class="logo-mark" viewBox="0 0 64 64">…</svg>
```

---

## Don'ts

- **Don't recolor the illustration.** If you need a different color treatment, use the SVG companion mark instead.
- **Don't stretch or skew.** Always scale uniformly; lock aspect ratio.
- **Don't use the illustration below 80px.** Faces and laurel detail blur. Switch to `mark-primary.svg`.
- **Don't put the illustration on dark backgrounds.** The cream paper looks pasted on. Use `mark-light.svg` instead.

---

## Source

- Source file: `uploads/IMG_20260420_172509.png` (681 × 728 PNG, supplied by client April 20 2026)
- All PNG variants in `brand-kit/png/` are programmatically derived from that source (crop / resize / compose).
- All SVG marks in `brand-kit/svg/` are original simplified designs created as a companion to the illustration.
