# 🎨 AssetFlow Frontend Design & Theme Specification

This document defines the visual layout, theme variables, and page-by-page screen requirements for the AssetFlow application based on the official wireframe mockup.

---

## 🛠️ Technical Stack Recommendations
To build this rapidly within our tight timeline while matching the UI requirements, use:
* **Framework:** React.js (Vite template for ultra-fast startup).
* **Styling:** **Tailwind CSS** (Recommended for rapid utility classes) or standard CSS variables.
* **Icons:** `lucide-react` or `react-icons` (For clean UI icons like boxes, calendars, alerts).
* **Charts:** `recharts` or `chart.js` (For Screen 9 Analytics charts).

---

## 🎨 Visual Identity & Theme Tokens

### 1. Typography
* **Primary Font Family:** `Inter`, `Segoe UI`, or `System-UI` (Clean, professional, high-readability sans-serif font suited for ERP systems).
* **Font Sizes:**
    * Main Titles (Page headers): `24px` (`text-2xl`), Semibold
    * Section Headers (Table names, card titles): `18px` (`text-lg`), Medium
    * Body Text (Directory lists, forms): `14px` (`text-sm`), Regular
    * Metadata/Logs (Timestamps, tags): `12px` (`text-xs`), Regular

### 2. Color Palette
To match the professional, modern look of the wireframe without becoming cluttered:

| Element | Color Name | Hex Code | Tailwind Class | UI Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Brand** | Teal Blue / Steel Slate | `#2C3E50` | `bg-slate-700` | Sidebar backgrounds, primary buttons, active states. |
| **Background** | Clean Off-White | `#F8FAFC` | `bg-slate-50` | Main application background. |
| **Card / Canvas** | Pure White | `#FFFFFF` | `bg-white` | Active form blocks, data tables, and card panels. |
| **Error / Alert** | Soft Crimson | `#EF4444` | `bg-red-500` | Double-allocation blocks, missing assets, overdue flags. |
| **Warning** | Warm Amber | `#F59E0B` | `bg-amber-500` | Pending approvals, maintenance in progress. |
| **Success** | Emerald Green | `#10B981` | `bg-emerald-500` | Available asset badges, resolved workflows. |

### 3. Shared UI Layout Rule
* **The Main Grid:** All internal screens (Screens 2–10) share a two-column structural frame:
    * **Left Sidebar (20% width):** Sticky navigation panel containing the asset logo, user profile token, and navigation links.
    * **Main Content Area (80% width):** Scrollable container with consistent `padding: 24px` (`p-6`) holding the specific page content.

---

## 🖥️ Page-by-Page Layout Blueprint

### Screen 1: Login / Signup (The Gatekeeper)
* **Visual Layout:** Centered, vertical card layout on a soft gray background.
* **What it displays:** * Top circular logo block (`AF` branding placeholder).
    * Input fields for Email and Password.
    * A prominent disclaimer block stating: *"Sign up creates an employee account only. Admin roles assigned later."*
    * Action Button: "Create Account" / "Login".

### Screen 2: Dashboard / Home Screen
* **Visual Layout:** Grid layout with KPI summary counters on top, a highlight banner below, and a split log timeline.
* **What it displays:**
    * **KPI Row:** 6 small card grids (Assets Available, Allocated, Maintenance, Active Bookings, Pending Transfers, Upcoming Returns).
    * **Overdue Alert Banner:** A bright amber/red notification strip highlighting assets past their expected return date.
    * **Quick Action Bar:** Side-by-side shortcut buttons ("Register Asset", "Book Resource", "Raise Maintenance Request").
    * **Recent Activity:** A linear data feed listing chronologically timestamped system events.

### Screen 3: Organization Setup (Admin Only)
* **Visual Layout:** A singular data table view controlled by a 3-tab horizontal header strip.
* **What it displays:**
    * **Tab A (Departments):** List grid showcasing Name, assigned Head, and Status switches.
    * **Tab B (Asset Categories):** Row entries defining categories (Electronics, Furniture, etc.) along with text fields for custom fields.
    * **Tab C (Employee Directory):** Master user spreadsheet showing Name, Email, Department, and a drop-down selector to assign/promote Roles.

### Screen 4: Asset Registration & Directory
* **Visual Layout:** Search filter utility bar positioned directly above a broad master data inventory table.
* **What it displays:**
    * **Search Component:** Input field matching Tag, Serial Number, or Categories.
    * **Master Inventory Grid:** Rows specifying Asset Tag (e.g., `AF-0001`), Name, Category, Current Location, and a color-coded Status pill (Green for `Available`, Orange for `Under Maintenance`, Red for `Lost`).

### Screen 5: Asset Allocation & Transfer Screen
* **Visual Layout:** A split interface layout: Left side contains a vertical data-entry form, right side lists active assignments.
* **What it displays:**
    * **Allocation Form:** Asset Tag select field, Employee target input, and an Expected Return Date selector.
    * **Conflict Banner (Crucial UI Block):** A red modal window that flashes *only* if the asset is already taken, printing *"Currently held by [Name]. Request a Transfer instead."*

### Screen 6: Resource Booking Screen
* **Visual Layout:** A vertical time-blocked calendar schedule view.
* **What it displays:**
    * Resource target filter drop-down (e.g., Conference Room B2).
    * Hourly block modules mapping out the current day's timeline.
    * Color overlays matching scheduled reservations.
    * Inline validation: Blocks overlap selections and pops open a notification error if a block intersects an active reservation.

### Screen 7: Maintenance Management Screen
* **Visual Layout:** A horizontal Kanban pipeline board divided into five structural columns.
* **What it displays:**
    * **Pipeline Columns:** `Pending` -> `Approved` -> `Technician Assigned` -> `In Progress` -> `Resolved`.
    * **Exercise Cards:** Mini floating blocks nested under columns showing the target Asset Tag, priority level tag, and action triggers for Asset Managers to instantly click "Approve" or "Reject".

### Screen 8: Asset Audit Screen
* **Visual Layout:** A dual-layer workspace: Top section outlines active audit metadata; bottom displays the inspection target rows.
* **What it displays:**
    * **Active Cycle Info:** Shows Scope Location, assigned Auditor, and Deadline bounds.
    * **Audit Target Grid:** Lists assets in scope alongside three quick-select action radio buttons per item: `Verified` | `Missing` | `Damaged`.
    * **Bottom Trigger:** A prominent "Close Audit Cycle & Sync Ledger" button.

### Screen 9: Reports & Analytics
* **Visual Layout:** Symmetric dashboard layout dedicated to operational graphs.
* **What it displays:**
    * **Chart Block 1:** Vertical Bar chart showcasing asset utilization trends (Most-used vs. Idle).
    * **Chart Block 2:** Linear Line graph tracing maintenance request frequencies across categories.
    * **Alert Panel:** Text highlights pinpointing assets due for immediate maintenance or nearing full retirement age boundaries.

### Screen 10: Activity Logs & Notifications
* **Visual Layout:** A full-height, cleanly indexed notification tray timeline.
* **What it displays:**
    * **Filter Pill Row:** `All` | `Alerts` | `Approvals` | `Bookings`.
    * **Audit Feed Rows:** Uniform lists of entries specifying who executed what action, exact timestamps, and automated color highlights matching the severity of the event (e.g., Red indicators for Audit Discrepancies).