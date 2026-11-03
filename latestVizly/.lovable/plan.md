## nutriX Restro — Pixel-Faithful Landing Page

Build a single dark-themed landing page that matches your screenshots exactly, with a premium animated background and modern hover interactions.

### Page sections (top to bottom)

1. **Sticky top navigation**
   - Left: "nutriX Restro" wordmark
   - Center: Features (active, with blue underline), Charts, Docs, Solutions
   - Right: dark "Login" pill button + blue→purple gradient "Start Creating" button
   - Subtle blur/translucent background that intensifies on scroll

2. **Hero section**
   - Massive headline: "Turn Data into Intelligent Visual Stories" with a soft white-to-grey gradient on the text
   - Subcopy: "AI-powered platform to generate and visualize data instantly. From raw data to insightful dashboards in seconds."
   - Prompt bar: rounded pill input "What would you like to visualize today?" with a sparkle icon, file/image icons, and a blue gradient "Generate →" button (visual only)

3. **Recent Projects grid**
   - Heading "Recent Projects" + caption "A glimpse into what We've been building."
   - 4 dark glassmorphic cards, each with a colored gradient icon tile (bar chart, sparkle/trend, lightning bolt, shield):
     - Smart Data Viz
     - AI Report Gen
     - Real-time Insights
     - Enterprise Grade
   - Cards lift, brighten their border, and the icon glows on hover

4. **Big "Ready to visualize the data?" CTA card**
   - Large rounded dark card centered on the page
   - Headline + supporting copy
   - White "Create Your First Viz" button + dark "Watch Demo" button

5. **Footer**
   - Brand block (nutriX Restro + tagline) on the left
   - Four columns: PRODUCT, RESOURCES, COMPANY, SOCIAL
   - Giant faded "Vizly" watermark behind the columns
   - Bottom row: "© 2026 nutriX Restro. All systems operational." and Privacy / Terms links

### Visuals & motion

- **Background**: deep near-black base with slowly drifting blurred aurora blobs (blue + indigo + violet) behind the hero and CTA, plus a faint vignette. Pure CSS animation, GPU-friendly, respects `prefers-reduced-motion`.
- **Typography**: large, tight, modern sans (Inter / system) with bold display weights for headlines.
- **Hover effects**:
  - Nav links: animated underline sweep
  - Buttons: subtle scale + glow shadow in their accent color
  - Project cards: lift, border highlight, icon tile glow
  - CTA buttons: gradient shift / shadow bloom
- **Entrance**: hero text and cards fade-and-rise in on load.

### Design system

- Update `src/styles.css` tokens for a true dark theme: near-black background, soft white foreground, blue (`Start Creating`) and purple accents, glassy card surface, subtle border.
- Add reusable utilities for the aurora background and the gradient button.

### Routing

- All content lives on `/` (`src/routes/index.tsx`), replacing the placeholder.
- Nav and footer links render as styled anchors (no extra routes) so the page matches the screenshots without dead-end stubs. Easy to upgrade to real routes later.
- Update `__root.tsx` meta: title "nutriX Restro — Turn Data into Intelligent Visual Stories" and matching description / OG tags.

### Out of scope (can add later)

- Real auth / Login flow
- Actually wiring the Generate prompt to an AI backend
- Separate pages for Features / Charts / Docs / Solutions
- Light mode