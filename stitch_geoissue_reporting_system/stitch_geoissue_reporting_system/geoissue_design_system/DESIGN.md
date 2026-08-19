---
name: GeoIssue Design System
colors:
  surface: '#fbf9fb'
  surface-dim: '#dbd9dc'
  surface-bright: '#fbf9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f5'
  surface-container: '#efedf0'
  surface-container-high: '#e9e7ea'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1e'
  on-surface-variant: '#44474d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f2f0f3'
  outline: '#75777e'
  outline-variant: '#c5c6ce'
  surface-tint: '#4e5f7c'
  primary: '#04162f'
  on-primary: '#ffffff'
  primary-container: '#1a2b45'
  on-primary-container: '#8293b2'
  inverse-primary: '#b6c7e8'
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e6'
  on-secondary-container: '#626567'
  tertiary: '#001b05'
  on-tertiary: '#ffffff'
  tertiary-container: '#113116'
  on-tertiary-container: '#779b77'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b6c7e8'
  on-primary-fixed: '#091c35'
  on-primary-fixed-variant: '#374763'
  secondary-fixed: '#e0e3e6'
  secondary-fixed-dim: '#c4c7ca'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#44474a'
  tertiary-fixed: '#c6edc4'
  tertiary-fixed-dim: '#abd0a9'
  on-tertiary-fixed: '#012108'
  on-tertiary-fixed-variant: '#2e4e30'
  background: '#fbf9fb'
  on-background: '#1b1b1e'
  surface-variant: '#e4e2e4'
typography:
  headline-lg:
    fontFamily: Work Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Work Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  data-table:
    fontFamily: Work Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is built for utility, reliability, and civic engagement. It prioritizes the efficient processing of urban maintenance data by student administrators and city officials. The aesthetic is rooted in **Minimalism** with a heavy emphasis on **Functionalism**, stripping away decorative elements to focus entirely on information density and task completion.

The UI evokes a sense of organized civic duty. It avoids modern SaaS trends like vibrant gradients or soft shadows, instead opting for a "Digital Paper" approach that feels official, stable, and straightforward.

## Colors
The palette is restricted to high-contrast, functional tones:
- **Primary (Dark Navy):** Used for navigation, primary actions, and headers to establish authority and focus.
- **Secondary (Light Gray):** Applied to background fills and container surfaces to separate content areas without visual noise.
- **Tertiary (Muted Green):** Specifically reserved for map-based data visualizations and "resolved" status indicators.
- **Error (Deep Red):** Used strictly for destructive CRUD actions (Delete/Remove) and critical alerts.
- **Accent (Warm Yellow):** Used sparingly for "Pending" statuses or small highlights to draw attention without signaling an emergency.

## Typography
This design system utilizes **Work Sans** (as a high-quality alternative to standard sans-serifs) to ensure maximum readability in data-heavy environments. The type scale is conservative, favoring legibility over expressive sizing.

Headlines use tighter letter spacing and heavier weights to define section hierarchy. Body text is optimized for long-form reading of issue reports. Labels use a slightly smaller, often uppercase treatment to distinguish meta-data from primary content.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for the admin dashboard to maintain consistency across desktop monitors. 
- **Grid:** A 12-column system with 16px gutters.
- **Sidebar:** A fixed 240px left-hand navigation bar.
- **Content Area:** Centered with a maximum width of 1280px for standard views, extending to 100% for data tables.
- **Rhythm:** All spacing is based on a 4px baseline grid. Use 16px for standard padding between elements and 24px for page margins.

## Elevation & Depth
This design system eschews shadows and blurs. Depth is communicated through **Tonal Layers** and **Bold Outlines**:
- **Level 0 (Background):** Light Gray (#F2F4F7).
- **Level 1 (Cards/Containers):** White (#FFFFFF) with a 1px solid border (#D1D5DB).
- **Level 2 (Active States):** Subtle shift to a darker gray stroke or primary color highlight.

No drop shadows are permitted. Visual separation must be achieved through color contrast and 1px lines.

## Shapes
The shape language is strictly geometric and professional.
- **Corners:** A uniform 4px (Soft) radius is applied to all buttons, input fields, and card containers.
- **Buttons:** Rectangular with minimal rounding.
- **Icons:** Boxy, stroke-based icons with consistent 2px weights to match the thin-border aesthetic.

## Components
- **Buttons:** Rectangular with 4px radius. Primary buttons are Navy with White text. Secondary buttons are White with a 1px Gray border and Navy text. Destructive buttons use the Deep Red.
- **Input Fields:** White backgrounds, 1px Gray borders. On focus, the border thickens to 2px Primary Navy. Labels must be positioned above the field.
- **Data Tables:** The core of the system. Use a White background with 1px horizontal dividers only. Header rows use a Light Gray background with bold, small-caps labels.
- **Chips/Status Tags:** Small, rectangular tags with 2px radius. Use the Muted Green for "Closed", Warm Yellow for "In Progress", and Light Gray for "New".
- **Cards:** Used for grouping report details. Should have a 1px border and no shadow. Headers within cards should have a subtle bottom border to separate them from the content.
- **Maps:** Integrated with 1px borders. Use the Muted Green as the primary color for landmasses or areas to maintain the civic color palette.