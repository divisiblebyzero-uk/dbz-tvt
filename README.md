# 🎬 Collaborative Media Tracker Matrix

A high-density, single-viewport Kanban dashboard engineered for couples to collaboratively track, shortlist, and synchronize their Movie and TV Series watch status. Built using Next.js 15, Supabase (PostgreSQL), Docker, and a native HTML5 drag-and-drop state execution engine.

---

## 🚀 Key Functional Features

*   **Stitch High-Density Light Mode**: An ultra-clean, off-white command console framing an executive 5-column horizontal matrix, built for maximum information density without page scrolling.
*   **The Collapsing & Splitting Transformer Matrix**:
    *   *Convergent Tracking*: If both users share an identical lane state (e.g., *Game of Thrones* in "Watching"), the engine collapses the duplicates into a single card featuring a unified `Both` badge.
    *   *Divergent Tracking*: If users are tracking separate statuses (e.g., *Fight Club* is short-listed by Husband but long-listed by Wife), the interface splits the entity across both lane columns simultaneously with distinct `Husband` or `Wife` identity flags.
*   **Availability-Driven Lanes**: Integrated database constraints automatically isolate and force media with no active subscription streaming services into the "Not Available" column.
*   **Predictive Hydration**: Integrates server-side TMDB API autocomplete lookups and caches metadata locally in your relational database to eliminate redundant network operations.
*   **Zero-Overhead Drag & Drop**: Implements native browser HTML5 Drag and Drop triggers to handle responsive cross-lane column updates instantly.

---

## 🛠️ Workstation Prerequisites

Before setting up the project on your new development machine, ensure you install the following core software utilities:

1.  **Node.js & npm**: Install Node.js (v18.x or v20+ recommended) -> [nodejs.org](https://nodejs.org)
2.  **Docker Desktop**: Required to run the local decoupled Supabase database infrastructure and dashboard instances -> [://docker.com](https://www.://docker.com/)
3.  **Supabase CLI**: Install via package managers depending on your new OS:
    *   *macOS (Homebrew)*: `brew install supabase/tap/supabase`
    *   *Windows (Scoop)*: `scoop bucket add supabase https://github.com` then `scoop install supabase`
    *   *Windows (NPM Alternative)*: `npm install -g supabase`

---

## 💻 Step-by-Step Local Development Setup

Follow this sequence to clone, seed, and spin up your development environment on your new computer:

### 1. Initialize Project Repositories
Clone your workspace and install the front-end package dependencies:
```powershell
# Navigate into the project folder container
cd media-tracker-repo/web-app

# Execute a clean local node dependency installation
npm install
```

### 2. Configure Environment Variables
Create an environmental configuration file inside your front-end container:
*   File Location: `web-app/.env.local`

Paste the following environment template block into it:
```env
# 1. Local Supabase Infrastructure Credentials
# (The real keys will output in your terminal window when running 'supabase start')
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key_string_goes_here

# 2. Secure Upstream Third-Party Data API Keys
TMDB_API_KEY=your_tmdb_developer_api_key_here
OMDB_API_KEY=your_omdb_developer_api_key_here

# 3. Google OAuth App Redirection Constants (For Production Build Gates)
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here
```

### 3. Launch Local Docker Infrastructure
Ensure **Docker Desktop** is open and actively running on your machine, then navigate back one level to the repository root directory and fire up your local database engines:
```powershell
# Navigate back to the repository base folder root
cd ..

# Initialize and pull Supabase local infrastructure images
supabase start
```
*Note: On successful completion, this command will output a summary table containing your local API keys. Copy the `anon key` string from that printout and paste it directly over the placeholder inside your `web-app/.env.local` file.*

### 4. Build Schema & Load Collaborative Test Seed Rows
Wipe any temporary initial container logs and build your relational tables, custom check constraints, permissions layout, and multi-user test states natively:
```powershell
supabase db reset
```
*(This programmatic reset sequence automatically runs your programmatic sql files under `/supabase/migrations` chronologically, grants table read privileges to the web client role, and inserts your divergent multi-user test data straight out of `/supabase/seed.sql`)*

### 5. Launch the Front-End Server Engine
Navigate back into your Next.js project directory container and trigger the development environment compiler:
```powershell
cd web-app

# Force clean out any old static snapshot layout compilation cache states
Remove-Item -Recurse -Force .next

# Start your local workspace server
npm run dev
```

Open your web browser window and load **`http://localhost:3000/dashboard`**.

---

## 🛠️ Essential Windows PowerShell Operational Diagnostics Macro

If your dashboard ever throws a silent compilation state layout loop or if you adjust structural component boundaries, run this multi-stage cleanup macro in your **Windows PowerShell** terminal to wipe your build cache, terminate hanging background worker threads, and trigger a fresh runtime hot-reload:

```powershell
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue; Remove-Item -Recurse -Force .next; npm run dev
```

---

## 📈 Active Roadmap Focus

We are currently advancing through **Phase 4: Real-time Sync & Polish** of our master specification roadmap:
1.  [x] Pivot data model tracking to four simplified states (`long_list`, `short_list`, `watching`, `watched`).
2.  [x] Grant explicit database role privileges to eliminate `42501` select permission walls.
3.  [x] Refactor core layout components into isolated, reusable modular components (`MediaRowCard`, `KanbanLaneUI`).
4.  [x] Integrate HTML5 draggable parameters to enable zero-overhead fluid card shifts.
5.  [ ] Connect client-side Supabase Real-time Channel WebSocket subscriptions (`supabase.channel().on('postgres_changes')`) to synchronize card movements across concurrent browser frames instantaneously.
