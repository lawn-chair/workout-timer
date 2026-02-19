# Design Language - Athletic Performance

## Intent

Bold, athletic, and performance-driven. The UI should feel like a training console: high contrast, decisive motion, and purposeful hierarchy. Primary actions are unmissable. The timer experience is the hero.

## Brand Voice

- Strong, focused, energetic
- Minimal distractions; all elements support action and clarity
- Confident color and typography

## Color System

### Core

- **Base 950**: `#0c0f12` (primary background)
- **Base 900**: `#11161c`
- **Base 800**: `#1b2430`
- **Base 700**: `#2a3442`
- **Base 200**: `#d7dde5` (secondary text)
- **Base 100**: `#eef2f6` (primary text)

### Accent

- **Lime 500**: `#a6ff3b` (primary action)
- **Lime 600**: `#8ae62f` (hover/active)
- **Cyan 400**: `#3de7ff` (secondary highlight)

### Timer Phase

- **Countdown**: `#f6c945`
- **Work**: `#22e06d`
- **Rest**: `#ff5d4a`
- **Rest Between Sets**: `#ff9b2f`
- **Complete**: `#4db5ff`

### Usage

- Base layers define depth via background and subtle borders.
- Lime is reserved for primary CTAs and hero emphasis.
- Phase colors appear as bands and headers in the timer UI.

## Typography

### Type Pairing

- **Display**: Bebas Neue (headlines, hero timer)
- **Body**: Manrope (content, labels, forms)

### Scale

- Display XL: 64/72
- Display L: 48/56
- H1: 32/40
- H2: 24/32
- Body: 16/24
- Small: 13/18

### Usage

- Use display face for primary headers and timer digits only.
- Body face everywhere else to keep legibility.

## Layout & Spacing

- 8px spacing grid
- Section padding: 24 (mobile), 40 (desktop)
- Card padding: 16-20
- Max content width: 1100

## Shape & Depth

- Radii: 12 (cards), 10 (inputs), 999 (chips)
- Shadows: soft, wide, low opacity (athletic but not glossy)

## Motion

- **Entrance**: subtle 8-12px rise + 150-220ms fade
- **Timer phase**: quick 120ms color sweep + scale-in
- **Buttons**: press scale 0.98, 90ms
- **Reduced motion**: disable transforms, keep opacity fades

## Components

### Buttons

- Primary: lime background, dark text, strong shadow
- Secondary: base 800 background, light text
- Tertiary: text-only, lime accent

### Cards

- Top stripe or band showing category/phase
- Dense metadata grid for sets/exercises/time
- Primary action row with strong CTA

### Chips/Tags

- Rounded pill, base 800 with lime outline
- Compact type (13px)

### Inputs

- Dark base with bright focus ring (lime)
- Inline validation messages in Base 200

### Nav

- Compact top bar with icon placeholder + title
- Primary CTA aligned right on desktop, bottom on mobile

### Timer

- Full-screen with phase color bands
- Oversized timer digits
- Next-up and progress rails below timer

## Accessibility

- Color contrast: 4.5:1 minimum for text
- Touch targets: 44px min
- Visible focus ring on all controls
- `prefers-reduced-motion` respected

## Iconography

- Simple, geometric shapes (bolt + stopwatch motif)
- 1.5-2px stroke, rounded caps
- Monochrome by default, lime for emphasis
