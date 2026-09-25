<div align="center">

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](CONTRIBUTING.md)
[![Türkçe](https://img.shields.io/badge/Dil-T%C3%BCrk%C3%A7e-red?style=for-the-badge)](CONTRIBUTING.tr.md)

</div>

# Contributing to Corvus

Thank you for your interest in contributing to Corvus! We welcome contributions from the community to help build the best lightweight, Native AOT server launcher and observability dashboard.

To ensure our codebase remains clean, professional, and easy to maintain as an open-source project, please read and follow our architectural principles and coding guidelines below.

---

## 🛠️ Local Development Setup

### Prerequisites
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20+](https://nodejs.org/)
- [Docker Engine or Docker Desktop](https://www.docker.com/)

### Getting Started
1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/brhnshn/Corvus.git
   cd Corvus
   ```
2. **Install frontend dependencies and build assets:**
   ```bash
   cd src/Corvus.Web
   npm install
   npm run build
   ```
3. **Run backend unit & integration tests:**
   ```bash
   cd ../..
   dotnet test tests/Corvus.Api.Tests
   ```
4. **Start the backend locally:**
   ```bash
   dotnet run --project src/Corvus.Api
   ```
   Open `http://localhost:8090` in your browser.

---

## 🏛️ Clean Architecture & Code Standards

Corvus follows strict modularity rules. Please respect these conventions when proposing changes:

### 1. 🚫 No Monolithic Files (Anti-Blob Rule)
- Never cram hundreds of lines of mixed logic, JSX, modals, and data fetching into a single file.
- Keep components focused and under **200–300 lines**. If a file grows large, decompose it into sub-components.

### 2. 📂 Modular Page Structure
- Every page lives in its own feature folder under `src/Corvus.Web/src/pages/<PageName>/index.tsx`.
- Modals, tabs, and sub-views used exclusively by that page must be placed inside that folder:
  ```
  pages/Containers/
  ├── index.tsx                 # Page orchestrator & state container
  ├── ContainerList.tsx         # Mobile cards & desktop table layout
  ├── ComposeStackGroup.tsx     # Docker Compose stack accordions
  ├── ContainerStatsBadges.tsx  # Live resource badges (CPU, RAM, Net)
  ├── ContainerActionButtons.tsx# Action triggers (Start, Stop, etc.)
  └── ContainerLogsModal.tsx    # Live terminal modal
  ```

### 3. 🧩 Shared Components vs. Page Components
- `src/Corvus.Web/src/components/` is **strictly reserved** for components shared across multiple pages (e.g. `Sidebar.tsx`, `StatusBadge.tsx`, `LanguageSwitch.tsx`, `RegistrationPromptModal.tsx`).
- If a component is only used by one page, it belongs in that page's feature folder.

### 4. 🌐 Centralized API Client
- **Never call raw `fetch()` directly inside UI components.**
- Add any new API methods and their TypeScript interfaces to `src/Corvus.Web/src/api/client.ts`. Pages should import and consume `api.yourMethod()`.

### 5. 🛠️ Utilities and Helpers
- Helper logic, byte/date formatters, and URL transformations must be extracted into `src/Corvus.Web/src/utils/` (`url.ts`, `format.ts`).

### 6. ⚙️ Backend Clean Architecture
- **Endpoints (`src/Corvus.Api/Endpoints/`):** Define route mapping in static extension classes (`MapXEndpoints()`). No inline database queries or heavy business logic.
- **Services (`src/Corvus.Api/Services/`):** Encapsulate business logic and external integrations (Docker, Notifications, SSO).
- **Data Access (`src/Corvus.Api/Data/`):** Repositories handle database interactions using Dapper.AOT and parameterized SQL.
- **Background Workers (`src/Corvus.Api/BackgroundServices/`):** Autonomous background tasks inheriting from `BackgroundService`.

---

## 💡 How to Add a New Page / Feature

1. **Backend Endpoint:**
   - Create or update an endpoint file in `src/Corvus.Api/Endpoints/YourEndpoints.cs`.
   - Register it in `src/Corvus.Api/Program.cs` via `app.MapYourEndpoints()`.
   - If database schema changes are required, add an ordered migration script in `src/Corvus.Api/Data/Migrations/`.

2. **API Client:**
   - Define TypeScript types and API client functions in `src/Corvus.Web/src/api/client.ts`.

3. **Frontend Page:**
   - Create a new directory `src/Corvus.Web/src/pages/YourFeature/`.
   - Place the main orchestrator in `index.tsx` and extract tabs/modals into adjacent files.
   - Add routes in `src/Corvus.Web/src/App.tsx` and navigation links in `src/Corvus.Web/src/components/Sidebar.tsx`.

4. **Localization (i18n):**
   - Add all new user-facing strings to both `src/Corvus.Web/src/i18n/en.ts` and `src/Corvus.Web/src/i18n/tr.ts`.

5. **Automated Verification:**
   - Ensure frontend builds cleanly: `npm run build`.
   - Add unit/integration tests to `tests/Corvus.Api.Tests/` and run `dotnet test`.

---

## 📝 Commit Guidelines

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat:` introduces a new feature
- `fix:` patches a bug
- `docs:` documentation updates
- `style:` code formatting without logic changes
- `refactor:` code restructuring without behavior modifications
- `test:` adding or updating tests
- `chore:` build, CI/CD, or dependency maintenance

---

## 🚀 Pull Request Workflow

1. Create a dedicated feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Implement your changes following the architectural standards above.
3. Verify that both frontend builds (`npm run build`) and all backend tests pass (`dotnet test`).
4. Commit with descriptive Conventional Commit messages.
5. Push your branch and open a Pull Request against the `main` branch.
