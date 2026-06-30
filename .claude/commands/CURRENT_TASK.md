# Current Task — Session Briefing

> The agent reads this file first before touching any code.
> All decisions are locked. Do not ask clarifying questions.

---

## Active session

```
Date:          [29th July]
Phase:         Frontend — Customer pages (Nuxt 3)
Stack:         Nuxt 3 · Composition API · <script setup> · Pinia · Tailwind CSS
Active module: Customer-facing pages
```

---

## What we are building this session

Four distinct customer pages that currently either don't exist or share the same content:

1. **Home page** (`pages/app/index.vue`) — personal dashboard with active jobs spotlight and recent history
2. **Orders list page** (`pages/app/orders/index.vue`) — full job history with filter tabs and infinite scroll
3. **Job detail page** (`pages/app/orders/[id].vue`) — live progress tracker + receipt (moved from its current location)
4. **Profile page** (`pages/app/profile.vue`) — user info, notification preferences, stats, security, logout

Also update:
5. **Customer layout** (`layouts/customer.vue`) — ensure bottom nav links all four tabs correctly

---

## Decisions locked in — do not re-debate

| Decision | Choice |
|---|---|
| Home — no active jobs | Show recent jobs immediately, no empty state |
| Orders pagination | Infinite scroll — cursor-based, 10 items per load |
| Profile edit mode | Both — inline edit AND a separate `/app/profile/edit` page |
| Stats location | Both Home page (compact bar) and Profile page (full detail) |
| Framework | Nuxt 3, Composition API, `<script setup>` throughout |
| State | Pinia stores |
| Styling | Tailwind CSS with the existing Stitch design tokens |

---

## Nuxt page/layout structure to create

```
pages/
  app/
    index.vue              ← Home dashboard       [CREATE]
    orders/
      index.vue            ← Orders list          [CREATE]
      [id].vue             ← Job detail           [CREATE / move existing]
    profile/
      index.vue            ← Profile view         [CREATE]
      edit.vue             ← Profile edit page    [CREATE]
    new-job.vue            ← Already exists — do not touch
    payment.vue            ← Already exists — do not touch

layouts/
  customer.vue             ← Update bottom nav    [UPDATE]

middleware/
  auth.ts                  ← Redirect to /auth if no valid token [CREATE if missing]
```

---

## Page 1 — Home (`pages/app/index.vue`)

**Layout:** `customer`
**Auth:** required (use `definePageMeta({ middleware: 'auth', layout: 'customer' })`)

### Sections in order from top to bottom:

**1. Top bar** (part of customer layout, not this page)

**2. Greeting**
```
Hello {firstName}
House {houseNumber}                ← orange/secondary color
```

**3. Active jobs spotlight**
- Query jobs where `status` is `pending`, `printing`, or `ready`
- If 1 or more active jobs exist: show each as a card with the 5-step progress tracker (compact version — just the circles and connector line, no labels), filename, and status badge
- If zero active jobs: show the last 3 jobs from history as compact cards (same as recent section below, just show them here instead)
- Each card is tappable → navigates to `/app/orders/{id}`

**4. "New print job" CTA button**
- Full width, orange (`#F97316`), always visible
- Navigates to `/app/new-job`

**5. Stats bar**
- 3 cards in a row: **Jobs this month** | **Loyalty points** | **Credit (KES)**
- Pull from user store (`auth.user.loyaltyPoints`, `auth.user.creditBalance`)
- Jobs this month: count of jobs created in the current calendar month from the jobs store

**6. Recent orders section**
- Heading: "Recent orders" with "See all →" link to `/app/orders`
- Show the 3 most recent jobs regardless of status
- Each card: job ID, filename or instruction preview, status badge, date, cost
- Only show this section if there ARE recent jobs AND the active spotlight above is NOT already showing recent jobs (i.e. hide it if the spotlight fell back to recent jobs)

### Pinia stores to use:
- `useAuthStore()` — `user` (name, houseNumber, loyaltyPoints, creditBalance)
- `useJobsStore()` — `jobs`, `fetchMyJobs()`, `setActiveJob()`

---

## Page 2 — Orders list (`pages/app/orders/index.vue`)

**Layout:** `customer`
**Auth:** required

### Sections:

**1. Filter tabs**
Three tabs: `All` | `Active` | `Completed`
- `All` — every job
- `Active` — status is `pending`, `printing`, or `ready`
- `Completed` — status is `delivered`
- Active tab has orange underline indicator matching the auth page tab style
- Default tab: `All`

**2. Search bar**
- Sits below the tabs
- Placeholder: "Search by file name or job ID…"
- Filters the visible list client-side (no API call needed for search since we're loading paginated data)
- Clear button (×) when input has text

**3. Job list with infinite scroll**
- Load 10 jobs at a time
- Implement with an `IntersectionObserver` watching a sentinel `<div>` at the bottom of the list
- When the sentinel enters the viewport and there are more items to load, call `loadMore()`
- Show a small spinner below the last card while loading the next page
- When all jobs are loaded, show "You've reached the end" text instead of the spinner
- Each card shows: job ID (small gray), filename or instruction preview (bold), status badge, delivery type badge, date, cost (KES)
- Card tap → navigate to `/app/orders/{id}` and call `jobs.setActiveJob(job)`

**4. Empty states**
- `All` tab empty: "No print jobs yet." + New print job button
- `Active` tab empty: "No active jobs right now." + New print job button
- `Completed` tab empty: "No completed jobs yet."

### Infinite scroll implementation pattern:
```vue
<script setup>
const PAGE_SIZE = 10
const page = ref(1)
const allLoaded = ref(false)
const loading = ref(false)
const sentinel = ref(null)

// Load next page of jobs
async function loadMore() {
  if (loading.value || allLoaded.value) return
  loading.value = true
  const newJobs = await jobs.fetchPage(page.value, PAGE_SIZE)
  if (newJobs.length < PAGE_SIZE) allLoaded.value = true
  page.value++
  loading.value = false
}

// IntersectionObserver watching the sentinel div
useIntersectionObserver(sentinel, ([entry]) => {
  if (entry.isIntersecting) loadMore()
})

onMounted(() => loadMore())
</script>
```

Use `useIntersectionObserver` from `@vueuse/core` (available in Nuxt via the VueUse module or direct import).

### Pinia store additions needed:
Add to `useJobsStore()`:
```js
// Simulates cursor-based pagination from dummy data
async function fetchPage(page, size) {
  await delay(400)
  const start = (page - 1) * size
  return JOBS.slice(start, start + size)
}
```

---

## Page 3 — Job detail (`pages/app/orders/[id].vue`)

**Layout:** `customer` — but with a CUSTOM top bar (back arrow + job ID + status text) instead of the standard nav bar. Hide the standard top bar for this page.

**Auth:** required

This page already exists in the project (previously at a different route). Move/recreate it here.

### Two states based on `job.status`:

**In-progress state** (status is `pending`, `printing`, `ready`):
- Custom top bar: back arrow → `/app/orders`, job ID, status text right-aligned
- 5-step progress tracker with pulsing animation on active step
- Job details card: filename, pages, copies, colour mode, delivery type, estimated ready time
- Notification preference toggles: SMS and WhatsApp (reads and writes `notifySms`, `notifWhatsapp`)
- "Something wrong with your order?" + Contact Support button

**Complete state** (status is `delivered`):
- Custom top bar same as above but status shows "Complete"
- "COMPLETE WITH RECEIPT" green badge
- All-complete progress tracker (all steps orange with checkmarks)
- Full receipt card with: PAID stamp, receipt ref, timestamp, customer name + house, file details inner card, cost breakdown, payment method row with M-Pesa ref
- Two orange action buttons side by side: "Save PDF" | "Share"

### Bottom nav on this page:
Orders tab should be highlighted (active).

---

## Page 4 — Profile view (`pages/app/profile/index.vue`)

**Layout:** `customer`
**Auth:** required

### Sections:

**1. Profile header**
- Large circle with user initials (first letter of first + last name), navy background
- Name below (bold, large)
- Phone number below name (gray)
- "Edit profile" button → navigates to `/app/profile/edit`

**2. Account stats**
- 2×2 grid of stat cards (same style as Home stats but larger):
  - Total jobs printed
  - Total spent (KES)
  - Loyalty points  
  - Credit balance (KES)
- Pull totals from jobs store (compute on the client from jobs array for now)

**3. Notification preferences**
- Section heading "Notifications"
- SMS toggle row: sms icon + "Notify me via SMS" + toggle switch
- WhatsApp toggle row: chat icon + "Notify me via WhatsApp" + toggle switch
- Toggles bound to `auth.user.notifSms` and `auth.user.notifWhatsapp`
- On toggle change: call `users.updateNotifPrefs({ notifSms, notifWhatsapp })` (store method, hits API when connected)

**4. Security section**
- Section heading "Security"
- Single row: lock icon + "Change password" + chevron_right icon
- Tap → navigates to `/app/profile/edit#password` (the edit page scrolls to password section)

**5. Support section**
- Section heading "Support"
- "WhatsApp Support" row → opens `https://wa.me/{BUSINESS_PHONE}` in new tab
- "Business hours" row → shows a modal or expander: "Mon–Sat, 7 AM – 8 PM"

**6. Logout button**
- Full width, red-tinted (`bg-red-50 text-red-600 border border-red-200`)
- On tap: call `auth.logout()` which clears localStorage tokens, resets store, navigates to `/`

---

## Page 5 — Profile edit (`pages/app/profile/edit.vue`)

**Layout:** `customer`  
**Auth:** required

### Sections:

**1. Personal info form**
- Full name input (pre-filled)
- Phone number (read-only — shown but not editable; changing phone requires OTP which comes later)
- House number input (pre-filled)
- Estate / Street input (pre-filled)
- "Save changes" orange button → calls `users.updateProfile(form)`, shows success toast, navigates back to `/app/profile`

**2. Change password section** (id="password" for scroll targeting)
- Current password input (with show/hide toggle)
- New password input (min 8 chars, with show/hide toggle)
- Confirm new password input
- "Update password" navy button → validates match, calls `auth.changePassword(form)`, shows success toast, clears inputs

**3. Danger section**
- "Delete account" row in red — for now shows a "Contact support to delete your account" message (no actual delete yet)

---

## Customer layout bottom nav update (`layouts/customer.vue`)

Update the bottom nav to have exactly these four tabs with correct active detection:

| Tab | Icon | Route | Active when |
|---|---|---|---|
| Home | `home` (filled when active) | `/app` | `route.path === '/app'` |
| Services | `print_connect` | `/app/new-job` | `route.path.startsWith('/app/new-job')` |
| Orders | `receipt_long` (filled when active) | `/app/orders` | `route.path.startsWith('/app/orders')` |
| Profile | `person` (filled when active) | `/app/profile` | `route.path.startsWith('/app/profile')` |

The job detail page (`/app/orders/[id]`) must make the Orders tab active.
The profile edit page (`/app/profile/edit`) must make the Profile tab active.

**Hide the standard top bar on job detail page:**
```vue
// In layouts/customer.vue
const route = useRoute()
const hideTopBar = computed(() =>
  route.path.startsWith('/app/orders/') && route.params.id
)
```

---

## Pinia store additions needed this session

### `useJobsStore` — add these methods

```js
// Fetch a single page for infinite scroll
async function fetchPage(page, size = 10) {
  await delay(400)
  const start = (page - 1) * size
  return JOBS.slice(start, start + size)
}

// Active jobs getter
const activeJobs = computed(() =>
  jobs.value.filter(j => ['pending', 'printing', 'ready'].includes(j.status))
)

// Jobs this month getter
const jobsThisMonth = computed(() => {
  const now = new Date()
  return jobs.value.filter(j => {
    const d = new Date(j.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
})

// Total spent getter
const totalSpent = computed(() =>
  jobs.value.reduce((sum, j) => sum + (j.paymentStatus === 'paid' ? (j.cost + j.deliveryFee) : 0), 0)
)
```

### `useUsersStore` — create this store (new)

```js
// stores/users.js
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useUsersStore = defineStore('users', () => {
  const auth = useAuthStore()
  const loading = ref(false)

  // Replace with: axios.patch('/users/me')
  async function updateProfile(payload) {
    loading.value = true
    await delay(600)
    // Update the auth store user object
    Object.assign(auth.user, payload)
    loading.value = false
  }

  // Replace with: axios.patch('/users/me/notifications')
  async function updateNotifPrefs({ notifSms, notifWhatsapp }) {
    await delay(300)
    auth.user.notifSms = notifSms
    auth.user.notifWhatsapp = notifWhatsapp
  }

  // Replace with: axios.patch('/users/me/password')
  async function changePassword({ currentPassword, newPassword }) {
    loading.value = true
    await delay(800)
    // In real implementation: validate currentPassword server-side
    loading.value = false
    return { success: true }
  }

  return { loading, updateProfile, updateNotifPrefs, changePassword }
})
```

---

## Constraints for this session

- Do NOT touch `pages/app/new-job.vue` or `pages/app/payment.vue`
- Do NOT connect to the real API — all data comes from Pinia stores backed by dummy data
- Do NOT modify any backend files
- Use `<script setup>` on every component — no Options API
- Use the existing Stitch design tokens (navy `#1B2D5B`, orange `#F97316`, Hanken Grotesk, Material Symbols)
- The bottom nav must show the correct active tab on every page including nested routes
- Every page must have `definePageMeta({ middleware: 'auth', layout: 'customer' })`

---

## Definition of done

- [ ] `/app` loads with greeting, active job spotlight (or recent jobs), stats bar, CTA, and recent section
- [ ] `/app/orders` loads with filter tabs, search bar, and job cards
- [ ] Scrolling to the bottom of `/app/orders` loads the next 10 jobs (infinite scroll)
- [ ] Switching filter tabs correctly filters the visible jobs
- [ ] Tapping a job card on any page navigates to `/app/orders/{id}`
- [ ] `/app/orders/{id}` shows the in-progress view for a pending/printing/ready job
- [ ] `/app/orders/{id}` shows the complete receipt view for a delivered job
- [ ] `/app/profile` shows all sections: header, stats, notifications, security, support, logout
- [ ] Toggling notifications on profile updates the store values
- [ ] "Edit profile" navigates to `/app/profile/edit`
- [ ] `/app/profile/edit` saves profile changes and navigates back
- [ ] Logout clears the session and redirects to `/`
- [ ] Bottom nav shows correct active tab on all pages including `/app/orders/{id}` and `/app/profile/edit`
- [ ] No TypeScript errors on `nuxt dev`
