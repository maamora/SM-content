# Maamora AI Studio Git Strategy

This document outlines the professional Git strategy for the Maamora AI Studio project to ensure maintainability, clear history, and smooth collaboration.

## 1. Branch Naming Conventions

All branches should follow a consistent naming structure based on the type of work being done.

**Format:** `<type>/<issue-id-or-short-description>`

*   **`feat/`**: For new features (e.g., `feat/auth-system`, `feat/34-prompt-engine`)
*   **`fix/`**: For bug fixes (e.g., `fix/header-layout-bug`, `fix/42-auth-crash`)
*   **`docs/`**: For documentation changes only (e.g., `docs/api-endpoints`)
*   **`chore/`**: For routine tasks, maintenance, tool configurations, or updates that don't modify source or test files (e.g., `chore/update-dependencies`, `chore/eslint-setup`)
*   **`refactor/`**: For code changes that neither fix a bug nor add a feature, but improve code structure (e.g., `refactor/extract-button-component`)
*   **`test/`**: For adding missing tests or correcting existing tests (e.g., `test/button-component-tests`)
*   **`hotfix/`**: For urgent fixes in production (e.g., `hotfix/critical-db-lock`)

**Main Branches:**
*   **`main`** or **`master`**: The production-ready state. Code here is always deployable.
*   **`develop`** (optional but recommended depending on workflow): The integration branch for features before they go to production.

## 2. Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

**Format:**
```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

**Allowed Types:**
*   `feat`: A new feature
*   `fix`: A bug fix
*   `docs`: Documentation only changes
*   `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
*   `refactor`: A code change that neither fixes a bug nor adds a feature
*   `perf`: A code change that improves performance
*   `test`: Adding missing tests or correcting existing tests
*   `build`: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
*   `ci`: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
*   `chore`: Other changes that don't modify src or test files
*   `revert`: Reverts a previous commit

**Examples:**
*   `feat(auth): implement JWT-based login`
*   `fix(ui): resolve overlapping text in responsive nav`
*   `chore: bump next.js version to 15.0.0`

*Rules:* Messages should be written in the imperative mood ("add", not "adds" or "added").

## 3. Pull Requests (PRs)

All changes must go through a Pull Request before being merged into the main development line.

**PR Requirements:**
*   **Descriptive Title**: Following the commit convention (e.g., `feat: Add user profile management`).
*   **Description**: Explain *what* was changed and *why*. Include screenshots or screen recordings for visual changes.
*   **Link Iteration/Issue**: Reference any specific tasks, Jira tickets, or GitHub issues the PR resolves (e.g., `Resolves #42`).
*   **Atomic PRs**: Keep PRs small and focused on a single logical change. This makes reviewing easier and safer.
*   **Review**: Require at least one approving review before merging.
*   **CI/CD Passage**: All automated tests, linters, and build checks must pass before merging.

## 4. Versioning

We use [Semantic Versioning](https://semver.org/) (SemVer).

**Format:** `MAJOR.MINOR.PATCH`

*   **MAJOR**: Incremented for incompatible API changes or major overhauls. (e.g., `1.0.0` -> `2.0.0`)
*   **MINOR**: Incremented when you add functionality in a backwards compatible manner. (e.g., `1.1.0` -> `1.2.0`)
*   **PATCH**: Incremented when you make backwards compatible bug fixes. (e.g., `1.1.1` -> `1.1.2`)

*Note:* Initial development is usually `0.y.z`. Public API should not be considered stable until `1.0.0`.

## 5. Release Workflow

1.  **Development**: Work is done on feature branches (`feat/...`) off of `develop` (or `main` in a simpler trunk-based workflow).
2.  **Pull Request**: A PR is opened to merge the feature into `develop` (or `main`).
3.  **QA/Testing**: The PR is reviewed, automated tests run, and manual testing is performed if necessary.
4.  **Merge**: Once approved, the PR is squash-merged to keep history clean.
5.  **Release Branching (Optional)**: For a new release, a branch like `release/v1.2.0` is cut from `develop`.
6.  **Tagging**: When ready to deploy to production, the `main` branch is tagged with the new version (e.g., `v1.2.0`), which triggers the CI/CD deployment pipeline.
7.  **Changelog**: A changelog is automatically or manually generated based on the conventional commits since the last release.
