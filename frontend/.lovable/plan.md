## TRAI Complaint & Workflow Management Portal — Build Plan

### Stack reconciliation (important)

Your spec calls for **Vite + React Router**. This Lovable project is on **TanStack Start v1** (Vite under the hood, file-based routing via TanStack Router). I'll adapt:

- **TanStack Router** instead of React Router DOM (file-based routes under `src/routes/`, same nested-layout/role-gating capabilities).
- Everything else from your spec stays: TanStack Query, Axios, Recharts, React Hook Form, Zod, Tailwind v4.
- No backend yet — all data wired through Axios + TanStack Query against a mock API layer (`src/services/mock/*`) so swapping to real endpoints is one-line per service.

If you require literal React Router DOM, say so and I'll swap — but TanStack Router is the idiomatic choice here and the route shapes will look the same to consumers.

### Design system (TRAI institutional)

- Primary `#00448B` (TRAI Bondi Deep Blue), darker/lighter variants for hover/borders/panels.
- Neutral greys, warm amber accent for warnings/highlights.
- System sans-serif stack, formal government feel — no gradients, subtle shadows, clear hierarchy.
- All tokens in `src/styles.css` via `@theme inline` + `oklch` semantic tokens (`--primary`, `--primary-hover`, `--accent-warn`, `--surface`, `--surface-muted`, status colors for Open/Resolved/Closed, priority colors).
- Shared primitives: Button, Input, Select, Textarea, Modal, Drawer, Card, Table, Badge (Status/Priority), Tabs, Alert, Toast (sonner), Pagination, PageHeader, FilterBar, EmptyState, LoadingSpinner, FormField wrappers.

### Folder structure

```
src/
  routes/                    # TanStack file-based routing
    __root.tsx              # providers (QueryClient, Auth, Toaster)
    index.tsx               # redirects by role
    login.tsx
    _app.tsx                # AppShell layout (topbar + sidebar + Outlet)
    _app.admin.*            # admin routes
    _app.user.*             # user routes
    _app.l2.*               # l2 routes
    _app.l3.*               # l3 routes
    _app.tickets.$ticketId.tsx  # shared ticket detail
  components/
    ui/                     # design-system primitives
    layout/                 # TopBar, Sidebar, AppShell
    tables/, charts/, forms/
  features/
    auth/ admin/ user/ l2/ l3/ tickets/ audit/ sla/ mis/ notifications/
  services/
    api/client.ts           # axios + interceptors (access/refresh token)
    api/{auth,employees,tickets,trail,analytics,audit,sla,mis,notifications}.ts
    mock/                   # in-memory mock data + adapters
  hooks/                    # useAuth, useDebounce, useIstFormat, query hooks
  types/                    # Employee, Ticket, TrailLog, Notification, AuditLog, ...
  utils/                    # date (IST dd-MM-yyyy), formatters, role helpers, ticketId
  lib/                      # auth context/store, query keys, role guards
```

### Routing & role gating

- `/login` — public.
- `_app` layout — auth-required, renders TopBar + role-aware Sidebar + `<Outlet />`.
- Role guard in `_app` `beforeLoad`: redirect to `/login` if no session; nested `_app/admin`, `_app/user`, `_app/l2`, `_app/l3` each check role and redirect to the user's own dashboard if mismatched.
- `/` redirects to `/{role}/dashboard` based on Auth context.

### Auth (frontend)

- Zustand or React context store holding `{empId, name, email, role, subRole, division, designation, floor, isActive, accessToken, refreshToken}`.
- Axios request interceptor injects Bearer; response interceptor handles 401 → refresh → retry → logout on failure.
- Login page: TRAI branding, EmpId/Email toggle, password, error banner, RHF+Zod.
- Change Password modal accessible from profile menu (RHF+Zod with confirm + complexity).

### Admin portal

- **Dashboard**: 6 metric cards (Total/Open/Resolved/Closed/Assigned tickets, Total employees) → click filters ticket table; Recent Tickets table.
- **Employees**: server-side paginated/sorted/filterable table (search by name/empId/email; filters: division/role/subRole); Create/Edit multi-step form (role → subRole when L2/L3 → common fields) with RHF+Zod; View/Delete with confirm.
- **Analytics**: Recharts — division bar, priority pie, status bar, open-vs-resolved line, monthly trend, L2/L3 workload, employee ticket counts, avg resolution/closure cards. Date/division/role filters.
- **Reports/Export**: filter panel + format (Excel/PDF) for Employee export and Ticket export; toasts on start/complete. PDF header/footer + Excel tab spec documented in code (mock generates a stub blob).

### User portal

- **Dashboard**: 4 cards + Recent Tickets.
- **Raise Ticket**: division/priority/type with conditional fields (New Development vs Modification/Reports), multi-file attachments, Level (L2/L3) → Category → Member dynamic dropdowns. On submit: toast + initial trail row.
- **Tickets**: Recent / All views; standard columns; View action.
- **Profile**: info + Change Password.

### L2 / L3 portals

- Dashboards: Assigned / Open / Resolved / Closed counts + recent assigned list.
- Assigned Tickets table (only own tickets, newest first) → View opens shared ticket detail.

### Ticket Details (shared)

- Tabs: **Details** | **Current Status** | **Complete Trail**.
- **Details**: all fields, clickable portal URL, attachments list with download icons.
- **Current Status**: status badge (color-coded), current assignee, last-updated by/date.
- **Trail (TABLE, not feed)**: columns Date & Time | Action By | Role | Action | Comment. Search (name/comment), filters (role/action/date range), sort (latest/oldest), server-side pagination, Excel/PDF export buttons.
- **Inline Manage section** (L2/L3 only, no separate page):
  - Add Comment (textarea + optional attachment).
  - Reassign (L2↔L2, L2↔L3, L3↔L3, L3→L2) via Level→Category→Member dropdowns.
  - Update Status — only Open/Resolved/Closed.
- Auto-close (15-day SRO close) reflected via badge + tooltip when backend flag present.

### Audit, SLA, MIS (admin)

- **Audit Log**: table (Date/Employee/Role/Action/Context), filters, Excel/PDF export.
- **SLA**: cards (avg assignment/resolution/closure/overall, division, member) + Recharts distributions + export.
- **MIS**: Monthly/Quarterly/Yearly filter, division/employee/ticket views, tables+charts+export.

### Notifications

- Top-bar bell + badge + dropdown (icon, title, description, IST timestamp, deep link).
- Toast for critical events (assignment, status change) via sonner.
- Frontend hook `useNotifications()` polls the mock service; wiring point documented for Socket.IO swap.

### Data layer

- Axios singleton with base URL from `import.meta.env.VITE_API_BASE_URL`, token interceptors, refresh queue.
- TanStack Query keys: `["tickets", filters]`, `["employees", filters]`, `["analytics", filters]`, `["trail", ticketId, filters]`, `["audit", filters]`, `["sla", filters]`, `["mis", filters]`, `["notifications"]`.
- All mutations invalidate the right keys; optimistic updates where safe (comments, status).
- Pagination/filter/sort always server-side (params).

### Quality

- Strict TS, exported `interface`s in `src/types/`.
- All dates rendered via `formatIst(date, "dd-MM-yyyy")` / `"dd-MM-yyyy HH:mm"` helper (date-fns + date-fns-tz).
- A11y: focus rings, ARIA on tabs/dialogs/badges, keyboard nav on table actions, ≥4.5:1 contrast against TRAI blue.
- Responsive desktop-first; sidebar collapses under lg.

### Out of scope for this pass

- Real backend integration, real Socket.IO connection, real file storage, real PDF/Excel generation (mocked behind service interface so backend swap is trivial).

### Deliverable

A compiling, navigable app with every route, layout, table, form, chart, modal, and trail described above, hitting mock services so all flows are demoable end-to-end. Then we iterate on visual polish and wire real endpoints when backend is ready.

Confirm and I'll build it.
