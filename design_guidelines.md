# Design Guidelines: Sistema de Controle de Materiais

## Design Approach
**Selected System:** Material Design 3  
**Justification:** Enterprise inventory system requiring clear data hierarchy, robust component library for tables/forms/dashboards, and proven patterns for information-dense applications.

---

## Typography System

**Font Family:** Roboto (via Google Fonts CDN)
- **Headings:** Roboto Medium (500)
  - H1: 2.5rem (Dashboard titles)
  - H2: 2rem (Section headers)
  - H3: 1.5rem (Card titles)
  - H4: 1.25rem (Form labels, table headers)
- **Body:** Roboto Regular (400)
  - Large: 1rem (Primary content, table cells)
  - Medium: 0.875rem (Secondary info, metadata)
  - Small: 0.75rem (Captions, timestamps)
- **Monospace:** Roboto Mono (400) for códigos GCE and numerical data

---

## Layout System

**Spacing Units:** Tailwind primitives: 2, 4, 6, 8, 12, 16, 24
- Tight spacing (p-2, gap-2): Within table cells, compact lists
- Standard spacing (p-4, gap-4): Form fields, card padding
- Generous spacing (p-8, py-12): Section separation, page containers

**Grid Structure:**
- Dashboard: 4-column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4) for stat cards
- Item List: Single column with full-width data table
- Detail View: 2-column layout (8-4 split) - main content left, metadata/timeline right

**Container Widths:**
- Full-width tables: w-full with px-4 lg:px-8
- Forms: max-w-4xl mx-auto
- Modals: max-w-2xl

---

## Component Library

### Navigation
**Sidebar (Fixed Left):**
- Width: 256px desktop, collapsible to 64px (icon-only)
- Sections: Dashboard, Setores (6 items with icons), Importação, Relatórios
- Active state: Filled background indicator
- Icons: Material Icons (CDN)

**Top Bar:**
- Height: 64px, contains: breadcrumbs, search, user profile, notifications bell
- Search: Expandable width with clear icon

### Dashboard Cards
**Stat Cards (4 across desktop):**
- Structure: Large number (text-3xl font-bold), label (text-sm), icon (top-right, 48px)
- Status indicators: Border-left accent (4px) colored by status
- Hover: Subtle elevation increase (shadow-md to shadow-lg)

**Alert List:**
- Compact table with status badges
- Row height: 48px
- Columns: Status Badge | Código GCE | Item Name | Current Stock | Actions

**Chart:**
- Horizontal bar chart showing item distribution by setor
- Height: 320px, uses grid for alignment

### Data Tables
**Structure:**
- Sticky header (top-0 z-10)
- Zebra striping for alternating rows
- Row height: 56px standard, 48px compact mode toggle
- Hover: Subtle background change
- Selected: Checkbox column + highlighted state
- Actions: Icon buttons (Edit, Delete) appear on row hover

**Columns:**
- Fixed-width: 80px (Código GCE), 120px (Setor), 100px (Status)
- Flex-width: Item name (flex-1), stock numbers (text-right, 100px each)

### Forms
**Layout:**
- Two-column grid on desktop (grid-cols-2 gap-6)
- Full-width on mobile
- Required fields marked with asterisk
- Helper text below inputs (text-sm, muted)

**Input Components:**
- Height: 48px
- Label above input (text-sm font-medium, mb-2)
- Borders: 1px solid, rounded-md
- Focus: 2px outline with offset

**Status Badges:**
- Pill-shaped (rounded-full, px-3 py-1, text-xs font-medium)
- Variants: Success (Estoque OK), Warning (Baixo Estoque), Error (Negativos), Neutral (Desativado)

### Modals
**Item Detail Modal:**
- Width: max-w-4xl
- Sections: Header (item name + código), Data Grid (2-col), Movimentos Timeline
- Timeline: Vertical line with dated entries, icons for movement types

**Import Wizard:**
- Stepper header (3 steps: Upload, Validação, Confirmação)
- Content area: 600px height, scrollable
- Progress indicator for processing

### Buttons
**Primary Actions:** Filled, medium size (px-6 py-2.5, text-sm font-medium, rounded-md)
**Secondary Actions:** Outlined version
**Icon Buttons:** 40x40px, rounded-full for floating actions

---

## Animations

**Minimal, Purposeful Only:**
- Page transitions: None (instant load for data apps)
- Table row hover: 150ms ease background change
- Modal: 200ms fade-in + subtle scale (0.95 to 1)
- Alerts/Toasts: Slide-in from top-right, 300ms
- Loading states: Subtle skeleton screens, no spinners

---

## Key Interaction Patterns

**Setor Navigation:** Click sidebar item → instant filter of main view
**Quick Actions:** Row-level actions (Edit, Delete, View Details) via icon buttons
**Bulk Operations:** Multi-select checkboxes → floating action bar appears at bottom
**Stock Alerts:** Color-coded badges + optional notification bell badge count
**Movement Log:** Expandable timeline within item detail, chronological newest-first

**Validation Feedback:**
- Inline error messages below invalid fields
- Success toasts (top-right, auto-dismiss 3s)
- Blocking alerts for critical actions (stock negative confirmation)

---

## Mobile Adaptations
- Sidebar collapses to hamburger menu
- Tables convert to card stack (each row = card)
- 2-column forms stack to single column
- Dashboard cards stack vertically
- Fixed bottom navigation for primary actions