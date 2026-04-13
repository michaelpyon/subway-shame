# Subway Shame: Stitch Design Tokens

Theme: Dark, NYC transit brutalist with gold/yellow accent.
Source: Stitch design-reference.html, applied 2026-04-02.

---

## Typography

| Role     | Family         | Weight/Style          | Usage                        |
|----------|----------------|-----------------------|------------------------------|
| Headline | Space Grotesk  | Bold, italic, uppercase | Section headers, hero text  |
| Display  | Bebas Neue     | Regular               | Score numbers, big labels    |
| Body     | Inter / Space Grotesk | 400-700          | Paragraphs, descriptions     |
| Label    | Lexend         | 400-700               | Badges, metadata, small caps |
| Mono     | JetBrains Mono | 400-700, tabular-nums | Data values, timestamps      |

CSS variables:
- `--font-headline`: Epilogue (italic 800/900)
- `--font-display`: Bebas Neue
- `--font-body`: Space Grotesk
- `--font-label`: Lexend
- `--font-mono`: JetBrains Mono

---

## Colors

### Core palette

| Token                  | Hex       | Usage                          |
|------------------------|-----------|--------------------------------|
| `--color-tunnel`       | `#000000` | Page background (pure black)   |
| `--color-platform`     | `#F5F0E8` | Primary text (warm white)      |
| `--color-ballast`      | `#1A1A1A` | Card backgrounds               |
| `--color-concrete`     | `#2A2A2A` | Borders, dividers              |
| `--color-signal-red`   | `#E8353A` | Danger, worst-severity accent  |

### Stitch gold accent system

| Token                       | Hex       | Usage                        |
|-----------------------------|-----------|------------------------------|
| `--color-gold`              | `#ffd700` | Primary accent, highlights   |
| `--color-gold-dim`          | `#e9c400` | Hover/active state of gold   |
| `--color-cream`             | `#fff6df` | Warm white for primary text  |

### Stitch surface scale

| Token                              | Hex       |
|--------------------------------------|-----------|
| `--color-surface`                    | `#131313` |
| `--color-surface-container`          | `#1f1f1f` |
| `--color-surface-container-high`     | `#2a2a2a` |
| `--color-surface-container-highest`  | `#353535` |
| `--color-surface-container-low`      | `#1b1b1b` |
| `--color-surface-bright`             | `#393939` |
| `--color-on-surface`                 | `#e2e2e2` |
| `--color-on-surface-variant`         | `#d0c6ab` |

### Stitch semantic colors

| Token                        | Hex       | Usage                          |
|------------------------------|-----------|--------------------------------|
| `--color-primary`            | `#fff6df` | Primary content (cream)        |
| `--color-primary-container`  | `#ffd700` | Primary container (gold)       |
| `--color-primary-fixed-dim`  | `#e9c400` | Dimmed primary                 |
| `--color-secondary`          | `#ffb4aa` | Warm red/salmon accent         |
| `--color-secondary-container`| `#bb030f` | Dark red container             |
| `--color-tertiary`           | `#f6f5ff` | Light purple                   |
| `--color-tertiary-container` | `#d0d8ff` | Purple container               |
| `--color-outline`            | `#999077` | Borders, separators            |
| `--color-outline-variant`    | `#4d4732` | Subtle borders                 |

### MTA line colors (CSS variables)

| Token          | Hex       | Lines      |
|----------------|-----------|------------|
| `--mta-123`    | `#EE352E` | 1, 2, 3    |
| `--mta-456`    | `#00933C` | 4, 5, 6    |
| `--mta-7`      | `#B933AD` | 7          |
| `--mta-ace`    | `#0039A6` | A, C, E    |
| `--mta-bdfm`   | `#FF6319` | B, D, F, M |
| `--mta-nqrw`   | `#FCCC0A` | N, Q, R, W |
| `--mta-g`      | `#6CBE45` | G          |
| `--mta-jz`     | `#996633` | J, Z       |
| `--mta-l`      | `#A7A9AC` | L          |
| `--mta-s`      | `#808183` | S (Shuttle)|
| `--mta-sir`    | `#003DA5` | SI (SIR)   |

---

## Shadows

| Token                  | Usage                              |
|------------------------|------------------------------------|
| `--shadow-card`        | Default card elevation             |
| `--shadow-card-hover`  | Hovered card                       |
| `--shadow-card-shame`  | High-severity shame card (red glow)|
| `--shadow-gold-glow`   | Gold accent glow                   |

---

## Special Classes

| Class               | Description                                              |
|---------------------|----------------------------------------------------------|
| `.receipt-edge`     | Clip-path torn receipt edge on bottom of element         |
| `.gold-glow`        | Gold drop-shadow filter for header/accent elements       |
| `.gold-border-header` | Subtle gold bottom border (border-b-2 at 20% opacity) |
| `.halftone`         | Radial dot texture overlay                               |
| `.structural-card`  | Brutalist top+left 4px borders                           |
| `.severity-*`       | Stamped badge labels (limping, pain-train, meltdown, dumpster) |
| `.stagger-section`  | Entrance animation with blur + translateY                |
| `.alert-marquee`    | Scrolling ticker animation                               |
| `.font-label`       | Lexend label font                                        |
| `.font-display`     | Bebas Neue display font                                  |
| `.font-headline`    | Epilogue headline font                                   |
| `.font-mono-data`   | JetBrains Mono with tabular-nums                         |

---

## Design Principles

1. **Dark brutalist.** Pure black background, hard shadows, no rounded corners above 4px.
2. **Gold over red.** Gold (#ffd700) is the primary accent. Red is reserved for severity/danger only.
3. **Warm neutrals.** Text uses cream (#fff6df) and warm white (#F5F0E8), not pure white.
4. **Transit DNA.** MTA circle badges, receipt-edge clip paths, ticker marquees.
5. **Earned drama.** Animations are staggered entrances and severity pulses, not decoration.
