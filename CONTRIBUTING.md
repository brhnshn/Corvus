<div align="center">

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](CONTRIBUTING.md)
[![Türkçe](https://img.shields.io/badge/Dil-T%C3%BCrk%C3%A7e-red?style=for-the-badge)](CONTRIBUTING.tr.md)

</div>

# Contributing to Corvus

Thank you for your interest in contributing to Corvus! We welcome contributions from the community to help build the best lightweight, self-hosted server launcher and observability dashboard.

## 🛠️ Local Development Setup

### Prerequisites
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/)

### Getting Started
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/brhnshn/Corvus.git
   cd Corvus
   ```
2. Install frontend dependencies and build assets:
   ```bash
   cd src/Corvus.Web
   npm install
   npm run build
   ```
3. Run backend unit & integration tests:
   ```bash
   cd ../..
   dotnet test tests/Corvus.Api.Tests
   ```
4. Start the backend locally:
   ```bash
   dotnet run --project src/Corvus.Api
   ```

---

## 📝 Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
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
2. Implement your changes and verify all tests pass (`dotnet test`).
3. Commit with concise, descriptive commit messages.
4. Open a Pull Request against the `main` branch and fill out the PR template.
