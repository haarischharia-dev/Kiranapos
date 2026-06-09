---
name: Digital Storefront
colors:
  surface: '#fff8f5'
  surface-dim: '#e8d7cb'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1e8'
  surface-container: '#fdebdf'
  surface-container-high: '#f7e5d9'
  surface-container-highest: '#f1dfd3'
  on-surface: '#231a13'
  on-surface-variant: '#554336'
  inverse-surface: '#392e27'
  inverse-on-surface: '#ffeee2'
  outline: '#887364'
  outline-variant: '#dbc2b0'
  surface-tint: '#8f4e00'
  primary: '#8f4e00'
  on-primary: '#ffffff'
  primary-container: '#ff9933'
  on-primary-container: '#693800'
  inverse-primary: '#ffb77a'
  secondary: '#4f6073'
  on-secondary: '#ffffff'
  secondary-container: '#d2e4fb'
  on-secondary-container: '#556679'
  tertiary: '#006685'
  on-tertiary: '#ffffff'
  tertiary-container: '#00c0f7'
  on-tertiary-container: '#004a62'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc2'
  primary-fixed-dim: '#ffb77a'
  on-primary-fixed: '#2e1500'
  on-primary-fixed-variant: '#6d3a00'
  secondary-fixed: '#d2e4fb'
  secondary-fixed-dim: '#b7c8de'
  on-secondary-fixed: '#0b1d2d'
  on-secondary-fixed-variant: '#38485a'
  tertiary-fixed: '#bfe9ff'
  tertiary-fixed-dim: '#6cd2ff'
  on-tertiary-fixed: '#001f2a'
  on-tertiary-fixed-variant: '#004d65'
  background: '#fff8f5'
  on-background: '#231a13'
  surface-variant: '#f1dfd3'
typography:
  headline-lg:
    fontFamily: Anybody
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Anybody
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
  body-lg:
    fontFamily: Work Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Archivo Narrow
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 16px
  price-display:
    fontFamily: JetBrains Mono
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
  price-sub:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  touch-min: 56px
  gutter: 16px
  margin-page: 24px
  stack-gap: 12px
  grid-cols: '12'
---

## Brand & Style
The design system is engineered for the high-velocity, high-friction environment of Indian retail. The brand personality is "The Reliable Digital Clerk"—authoritative yet accessible, blending traditional retail cues with modern enterprise efficiency.

The visual style is a hybrid of **Brutalism** and **Tactile Modernism**. It prioritizes extreme legibility and physical feedback to ensure the UI remains usable under harsh fluorescent lighting or direct sunlight. We avoid all "soft" UI trends like glassmorphism or subtle shadows. Instead, we use thick borders, high-contrast color blocks, and oversized interactive zones. The goal is to evoke a sense of digital "sturdiness" that matches the physical endurance of a busy grocery store counter.

## Colors
The palette uses high-chroma signals to distinguish between brand identity and functional status.

- **Primary Saffron (#ff9933):** Used for primary actions, branding, and "active" checkout states. It provides a warm, culturally resonant touchpoint that stands out against gray environments.
- **Deep Navy (#1a2b3c):** The foundational color for navigation and text. It provides the necessary "enterprise" weight and high-contrast grounding.
- **Functional Colors:** Success Green and Warning Red are used in high-saturation variants to ensure instant recognition of transaction statuses and inventory alerts.
- **Surface Strategy:** We use a neutral Light Gray background to reduce eye strain, while using pure White (#FFFFFF) for the actual "Work Tiles" to create clear spatial separation.

## Typography
Typography is the core of this design system. It uses a three-tier font strategy:

1.  **Headlines (Anybody):** An ultra-modern, flexible sans-serif with a technical edge that commands attention for store names and major categories.
2.  **UI/Body (Work Sans):** A grounded, professional font for general reading, settings, and descriptions.
3.  **Labels & Metadata (Archivo Narrow):** A condensed sans-serif used for labels, status chips, and secondary UI elements, allowing for high information density.
4.  **Data/Pricing (JetBrains Mono):** All currency, quantities, and weights must use this monospaced font. This ensures that decimal points align perfectly in vertical lists (receipts/inventories), making it easier for shopkeepers to scan totals quickly.

**Mobile Scaling:** Headlines scale down by 20% on mobile, but Price-Display remains at 48px to ensure the total is visible even if the phone is sitting on a counter a few feet away from the user.

## Layout & Spacing
The layout follows a **Rigid Grid** philosophy. Every interactive element is built around a minimum 56px touch target to accommodate fast, high-volume input where precision is secondary to speed.

- **Desktop/Tablet:** A 12-column grid. The right 4 columns are usually reserved for the "Current Bill" persistent sidebar.
- **Mobile:** A single-column stack with a "Sticky Total" bar at the bottom.
- **Rhythm:** We use a strict 8px incremental scale. Margins between logical groups are 24px, while internal component spacing is 12px to keep the UI feeling "tight" and efficient.

## Elevation & Depth
This design system rejects shadows in favor of **Structural Outlines**. Depth is communicated through thickness and contrast rather than light simulation.

- **Level 0 (Background):** A neutral, low-strain surface.
- **Level 1 (Cards/Tiles):** White surface with a 2px solid border in a light contrast color.
- **Level 2 (Interactive/Focus):** White surface with a 3px solid border in the Primary Saffron or Secondary Navy.
- **Layering:** When a modal is used, we use a 60% opacity Navy backdrop to completely "kill" the background context, forcing focus on the task at hand. No blurs are used to ensure maximum performance on low-end Android hardware.

## Shapes
We use a **Rounded (0.5rem)** logic for standard components. This provides a friendlier, more approachable interface while still respecting the structural integrity of the grid.

Buttons and input fields use a consistent 8px radius. We avoid pill shapes or fully rounded circles as they waste valuable screen real estate in a data-dense POS environment. The increased corner radius compared to previous iterations helps soften the "industrial" feel, making the tool feel more like a modern consumer-facing app.

## Components
- **Chunky Buttons:** Primary buttons must be at least 64px tall for the main "Checkout" action. They use solid Saffron fills with Navy text. Secondary buttons use a 2px Navy outline.
- **Numeric Keypad:** A custom, oversized on-screen component for price/quantity entry. Buttons are 80x80px squares with `JetBrains Mono` labels.
- **Product Tiles:** Cards featuring the product name in `Headline-MD` and the price in `Price-Sub`. The "Add" action is a large '+' in the corner, occupying at least 25% of the card's surface area.
- **Status Chips:** Rectangular tags with high-contrast fills (Green/Red/Orange) for "Paid," "Unpaid," or "Stock Low."
- **Data Tables:** High-density rows with 2px horizontal separators. Alternate rows use a very faint tint to help the eye track across long lists of items.
- **Input Fields:** Thick 2px borders that change to Saffron on focus. Labels (in `Archivo Narrow`) are always visible to prevent context loss during rapid typing.