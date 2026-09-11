# UI/UX Pro Max Skill — Design Intelligence & Standards

This document embeds the complete **UI/UX Pro Max Skill** design intelligence guidelines, design system reasoning, accessibility standards, and pre-delivery checks into the workspace.

---

## 1. Design Intelligence & Core Principles

1. **Holistic Design Thinking**:
   - Balance aesthetic elegance, technical performance, and intuitive usability.
   - Design with mathematical and optical intent; every pixel, margin, color, and font selection must serve a distinct functional or optical purpose.

2. **Anti-Slop Directives**:
   - **Banned Clichés**: No generic purple-to-blue gradient backgrounds, no cyan-on-dark glow text, no floating multi-layer glass cards with heavy drop shadows.
   - **Container Flattening**: Never nest cards inside cards. Use subtle dividing lines, spacing, or background value shifts to establish visual hierarchy.
   - **No Artificial Hero Metrics**: Avoid arbitrary 3-box hero counters with tiny uppercase labels unless required by product domain data.

---

## 2. Layout, Rhythm & Mathematical Spacing

1. **8pt Grid & Rhythmic Spacing**:
   - Base all layout spacing on 4px/8px increments (4, 8, 12, 16, 20, 24, 32, 40, 48, 64px).
   - Container outer padding must always be equal to or exceed internal child element gaps. Minimum container padding is 16px.
   - Interactive control padding rule: Button horizontal padding must be exactly $2\times$ vertical padding (e.g., `px-4 py-2` or `px-6 py-3`).

2. **Corner Radius Nesting Formula**:
   - When placing a rounded container inside another rounded parent:
     $$\text{Inner Radius} = \text{Outer Radius} - \text{Padding}$$
   - Cap standard card radii at 12–16px. Reserve pill radii (9999px) strictly for badges, chips, and small pill buttons.

---

## 3. Typography & Mathematical Scale

1. **Font Pairings & Archetypes**:
   - Pair distinctive, high-craft display typography with ultra-legible body fonts.
   - Maintain clear scale ratios (step ratio $\ge 1.25$ for products, $\ge 1.333$ for editorial).
   - Never skip heading levels (H1 $\rightarrow$ H2 $\rightarrow$ H3).

2. **Legibility Standards**:
   - Minimum body size: 16px (14px strictly for secondary metadata, 12px for micro-labels).
   - Body line-height: 1.5 to 1.7.
   - Line length: Constrain long-form reading text to 65–75 characters (`max-w-prose` or `max-w-2xl`).
   - Labels in buttons, tags, chips, and tabs must always remain on ONE single line (`whitespace-nowrap`).

---

## 4. Color, Palette & Contrast Hierarchy

1. **Sophisticated Neutrals**:
   - Never use pure `#000000` or `#FFFFFF`. Inject subtle tinting ($<5\%$ saturation) using strictly warm (slate/zinc) or cool (neutral/gray) tone families.
   - Ensure brightness differences between backgrounds and surface containers remain within optical limits ($\le 7\%$ in light mode, $\le 12\%$ in dark mode).

2. **WCAG AA Accessibility Compliance**:
   - Body text: Contrast ratio $\ge 4.5:1$ against the background.
   - Large text / Headings: Contrast ratio $\ge 3.0:1$.
   - Interactive UI components and borders: Contrast ratio $\ge 3.0:1$.
   - Never use muted gray text on colored or tinted backgrounds.

---

## 5. Micro-Interactions & Fluid Motion

1. **Tactile Feedback**:
   - Provide clear hover, active (`active:scale-[0.98]`), and focus-visible states for all interactive controls.
   - All touch targets must be at least 44x44px for accessibility.

2. **Animation Parameters**:
   - Micro-transitions: 150ms – 250ms with natural easing (`ease-out` or `cubic-bezier(0.16, 1, 0.3, 1)`).
   - Avoid jarring or sluggish keyframe loops.

---

## 6. Pre-Delivery Quality Checklist

- [ ] All interactive elements have descriptive IDs and ARIA labels.
- [ ] Contrast ratios meet or exceed WCAG AA standards.
- [ ] No wrapped or truncated badge/button labels.
- [ ] Responsive layout verified across mobile, tablet, and desktop viewports.
- [ ] Smooth dark/light theme switching without unstyled flashes.

---

## 7. 21st.dev MCP Component System
- **Endpoint**: `https://21st.dev/api/mcp`
- **Configured**: Enabled across `.cursor/mcp.json`, `.mcp.json`, and `mcp.json` with standard Tailwind CSS and accessible React component primitives.
