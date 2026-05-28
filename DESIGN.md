---
name: Provincial Governance Insight
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#434653'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#737784'
  outline-variant: '#c3c6d5'
  surface-tint: '#2559bd'
  primary: '#00327d'
  on-primary: '#ffffff'
  primary-container: '#0047ab'
  on-primary-container: '#a5bdff'
  inverse-primary: '#b1c5ff'
  secondary: '#785900'
  on-secondary: '#ffffff'
  secondary-container: '#fdc003'
  on-secondary-container: '#6c5000'
  tertiary: '#74000a'
  on-tertiary: '#ffffff'
  tertiary-container: '#9f0012'
  on-tertiary-container: '#ffa79f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001946'
  on-primary-fixed-variant: '#00419e'
  secondary-fixed: '#ffdf9e'
  secondary-fixed-dim: '#fabd00'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5b4300'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb3ac'
  on-tertiary-fixed: '#410003'
  on-tertiary-fixed-variant: '#930010'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 32px
  gutter: 24px
  sidebar-width: 280px
  sidebar-collapsed: 80px
---

## Brand & Style
The design system is engineered for the NTT Province SKPP Tracker, prioritizing administrative clarity with a premium SaaS aesthetic. The brand personality is authoritative yet modern, bridging the gap between traditional government stability and forward-thinking digital efficiency. 

The visual style leverages **Modern Corporate** principles with a heavy emphasis on **Minimalism** and **Tactile Depth**. It uses high-contrast typography and generous whitespace to reduce cognitive load for administrators managing complex data. The emotional response should be one of confidence, precision, and ease of use, moving away from "bureaucratic clutter" toward a streamlined fintech-inspired experience.

## Colors
This design system utilizes a high-contrast palette designed for long-duration administrative work.
- **Primary (Cobalt Blue):** Used for navigation, primary actions, and branding. It represents trust and official authority.
- **Secondary (Gold/Yellow):** Reserved for accenting milestones, warnings, or special tracking statuses.
- **Tertiary (Red):** Dedicated exclusively to critical alerts, errors, and overdue SKPP statuses.
- **Background & Surface:** A layered approach using #F8F9FA for the base application canvas and #FFFFFF for cards and containers to create clear visual separation.
- **Text:** Dark Gray (#1A1C1E) is used instead of pure black to maintain readability while ensuring high contrast against white surfaces.

## Typography
The design system relies on **Inter** for its systematic and utilitarian qualities, essential for data-heavy dashboards.
- **Headlines:** Use semi-bold weights with slight negative letter spacing to create a compact, professional look.
- **Body Text:** Standard weight for maximum legibility. Body-md (14px) is the workhorse for data tables and list items.
- **Labels:** Uppercase labels with increased letter spacing are used for table headers and section eyebrows to differentiate them from interactive content.

## Layout & Spacing
The layout follows a **Fixed-Fluid hybrid grid**. The main navigation sidebar is fixed (with a toggle to collapse), while the content area uses a fluid 12-column grid.

- **Desktop:** 32px outer margins, 24px gutters. Elements should align to an 8px base grid.
- **Tablet:** 24px outer margins, 16px gutters. Sidebar automatically collapses to icon-only mode.
- **Mobile:** 16px outer margins, single-column reflow. Bottom navigation replaces the sidebar.

Whitespace is used aggressively to separate disparate data modules, ensuring the dashboard never feels cramped.

## Elevation & Depth
The design system employs **Ambient Shadows** and **Tonal Layering** to define hierarchy. 
- **Level 0 (Background):** #F8F9FA.
- **Level 1 (Cards/Panels):** Pure white surface with a soft, highly-diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.04)).
- **Level 2 (Dropdowns/Modals):** Pure white surface with a more pronounced shadow (0px 12px 32px rgba(0, 0, 0, 0.08)).
- **Level 3 (Interactive Elements):** Buttons and active states use subtle inner glows or primary-colored soft glows to indicate focus.

## Shapes
The shape language is defined by large, friendly radii that soften the administrative nature of the tool. 
- **Standard Cards:** 16px or 24px border-radius depending on size.
- **Buttons & Inputs:** 12px border-radius.
- **Pills & Badges:** Fully rounded (999px) for search bars, status badges, and progress indicators.
- **Icons:** Minimalist 2px stroke weight, 24px bounding box, slightly rounded corners within the icon glyphs themselves.

## Components
- **Buttons:** Primary buttons are Cobalt Blue with white text. Secondary buttons use a subtle gray stroke with cobalt text.
- **Sidebars:** Collapsible with transition effects. Active states use a "vertical bar" indicator on the left side and a subtle background tint.
- **Search Bars:** Pill-shaped (fully rounded) with a subtle light-gray stroke and a search icon prefix.
- **Hero Cards:** Feature Cobalt Blue to Deep Blue gradients (linear, 135deg) with white text for high-level statistics.
- **Data Lists:** High-row height (64px+) with generous horizontal padding. Use pill-shaped badges for status (e.g., "In Progress" in Gold, "Completed" in Green-tinted Blue).
- **Radial Progress:** High-stroke weight (10px+) using Cobalt for the fill and a light gray for the track.
- **Input Fields:** Minimalist outline style. Focus state moves from light gray to Cobalt Blue 2px border.