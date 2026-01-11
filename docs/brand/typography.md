---
sidebar_position: 2
---

# Typography

Amply uses **Lexend** as its primary typeface across all platforms.

## Why Lexend

Lexend was designed specifically to improve reading accessibility. Created by Dr. Bonnie Shaver-Troup in partnership with Google, it reduces visual stress and improves reading performance for everyone—including people with dyslexia, visual impairments, and ADHD.

Key design features:
- **Clear letterforms**: Distinct i/l/j shapes prevent confusion
- **Hyper spacing**: Built-in whitespace for smoother reading
- **Full weight range**: Thin (100) to Black (900)
- **Variable font**: Single file, infinite flexibility

This aligns with Amply's commitment to accessibility and transparency.

## Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Thin | 100 | Hero headlines, large display text |
| ExtraLight | 200 | Section headlines, subheadings |
| Light | 300 | — |
| Regular | 400 | Body text, paragraphs |
| Medium | 500 | Emphasis, UI labels |
| SemiBold | 600 | Buttons, navigation |
| Bold | 700 | Strong emphasis |
| ExtraBold | 800 | — |
| Black | 900 | **Brand name only** |

## The Amply Wordmark

The word "**Amply**" is set in **Lexend Black (900)**. This serves as our text logo.

```
Amply
↑ Lexend Black 900
```

This approach follows the pattern established by brands like Stripe—the name itself, in a distinctive weight, becomes the mark.

**Rules:**
- Always use Lexend Black 900 for "Amply"
- Do not use other weights for the brand name
- Maintain consistent letterspacing (default tracking)

## Headline Hierarchy

Headlines use the lighter end of the weight spectrum for a clean, modern aesthetic:

| Element | Weight | Size (relative) |
|---------|--------|-----------------|
| H1 / Hero | Thin 100 or ExtraLight 200 | Largest |
| H2 / Section | ExtraLight 200 | Large |
| H3 / Subsection | Light 300 or Regular 400 | Medium |
| H4+ | Regular 400 or Medium 500 | Standard |

The contrast between ultra-light headlines and the heavy "Amply" wordmark creates visual distinction.

## Body Text

- **Weight**: Regular 400
- **Line height**: 1.5–1.6 for readability
- **Paragraph spacing**: Generous (Lexend benefits from whitespace)

## Implementation

### Google Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet">
```

### CSS Custom Properties

```css
:root {
  --font-family: 'Lexend', sans-serif;

  /* Weight tokens */
  --font-weight-thin: 100;
  --font-weight-extralight: 200;
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
  --font-weight-black: 900;

  /* Semantic tokens */
  --font-weight-headline: var(--font-weight-extralight);
  --font-weight-body: var(--font-weight-regular);
  --font-weight-brand: var(--font-weight-black);
}
```

### Usage Examples

```css
/* Brand name */
.amply-brand {
  font-family: var(--font-family);
  font-weight: var(--font-weight-brand); /* 900 */
}

/* Hero headline */
.hero-title {
  font-family: var(--font-family);
  font-weight: var(--font-weight-thin); /* 100 */
}

/* Section headline */
.section-title {
  font-family: var(--font-family);
  font-weight: var(--font-weight-extralight); /* 200 */
}

/* Body text */
body {
  font-family: var(--font-family);
  font-weight: var(--font-weight-regular); /* 400 */
  line-height: 1.5;
}
```

## Resources

- [Lexend on Google Fonts](https://fonts.google.com/specimen/Lexend)
- [Lexend Project](https://www.lexend.com/)
- [Google Design: Lexend Readability](https://design.google/library/lexend-readability)

---

**Related:**
- [Brand Overview](./overview.md)
