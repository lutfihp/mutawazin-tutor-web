# mutawazin-tutor-web

Frontend for [Mutawazin](https://github.com/lutfihp/mutawazin-tutor-api) — an online tutoring platform connecting teachers and students for group courses and 1-on-1 sessions.

Built with **SvelteKit**, **Tailwind CSS v3**, and **TypeScript**. Supports English and Bahasa Indonesia.

---

## Prerequisites

- Node.js 18+
- The backend API running at `http://localhost:8000` ([mutawazin-tutor-api](https://github.com/lutfihp/mutawazin-tutor-api))

---

## Getting started

```bash
# 1. Clone the repo
git clone https://github.com/lutfihp/mutawazin-tutor-web.git
cd mutawazin-tutor-web

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# or create .env manually with:
# VITE_API_URL=http://localhost:8000

# 4. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> Pages degrade gracefully when the backend is offline — you'll see empty states rather than errors.

---

## Available commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at `localhost:5173` |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run check` | TypeScript + Svelte type check |

---

## Project structure

```
src/
├── lib/
│   ├── api.ts              # API client (fetch wrapper, auto token refresh)
│   ├── i18n.ts             # EN / ID localization setup
│   ├── actions/            # Svelte actions (focusTrap)
│   ├── components/         # UI + layout components
│   ├── locales/            # en.json, id.json translation files
│   ├── stores/             # Auth and sidebar Svelte stores
│   └── utils/              # Avatar, date, classname helpers
└── routes/                 # SvelteKit file-based routing
    ├── +page.svelte         # Landing page
    ├── login/
    ├── register/
    ├── dashboard/           # Teacher / student dashboard (role-aware)
    ├── admin/
    ├── teachers/[id]/
    ├── students/[id]/
    ├── courses/
    ├── calendar/
    └── reports/[studentId]/
```

---

## Related

- **Backend:** [mutawazin-tutor-api](https://github.com/lutfihp/mutawazin-tutor-api) — FastAPI, runs on `localhost:8000`
