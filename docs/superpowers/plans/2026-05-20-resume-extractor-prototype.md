# Resume Extractor Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use $superpower-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking via update_plan.

**Goal:** Build a small local website that accepts pasted project material, shows uploaded source files, generates mock structured project cards, and provides editable resume bullets.

**Architecture:** Use a dependency-free static website so the user can inspect it immediately without package installation. Keep extraction logic in a separate JavaScript module with Node tests, and keep browser UI orchestration in `src/app.js`.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, Node built-in test runner.

---

## File Structure

- `index.html`: App shell and three-column workbench containers.
- `src/styles.css`: Responsive UI styling for the workbench.
- `src/resumeExtractor.js`: Pure extraction helpers, validation, mock project generation, and bullet editing helpers.
- `src/app.js`: Browser state, file upload parsing for `.txt` and `.md`, `.docx` placeholder handling, rendering, editing, and copy actions.
- `test/resumeExtractor.test.js`: Node tests for validation, mock extraction, and bullet updates.
- `package.json`: Minimal scripts for running tests.

## Task 1: Core Extraction Module

**Files:**
- Create: `src/resumeExtractor.js`
- Create: `test/resumeExtractor.test.js`
- Create: `package.json`

- [ ] **Step 1: Write tests for input validation and mock extraction**

Create tests that assert short input is rejected, useful input generates at least one project, project cards contain required fields, and bullets are editable via a pure helper.

- [ ] **Step 2: Run tests and verify they fail**

Run: `node --test`

Expected: fail because `src/resumeExtractor.js` does not exist yet.

- [ ] **Step 3: Implement minimal extraction module**

Implement `validateSources`, `extractProjects`, and `updateBulletText` with deterministic mock output.

- [ ] **Step 4: Run tests and verify they pass**

Run: `node --test`

Expected: all tests pass.

## Task 2: Static Website UI

**Files:**
- Create: `index.html`
- Create: `src/styles.css`
- Create: `src/app.js`

- [ ] **Step 1: Create the page shell**

Build a three-column workbench: source input, project cards, and bullet editor.

- [ ] **Step 2: Implement browser state and rendering**

Support pasted text, `.txt` and `.md` upload parsing, visible `.docx` unsupported-for-prototype status, source removal, generate action, bullet editing, and copy actions.

- [ ] **Step 3: Add polished responsive styles**

Use a practical tool-like layout with dense but readable panels, stable controls, and mobile stacking.

## Task 3: Verification

**Files:**
- Read: all created files

- [ ] **Step 1: Run automated tests**

Run: `node --test`

Expected: all tests pass.

- [ ] **Step 2: Verify the static site can be served**

Run a local static server from the workspace using the bundled Node runtime and open `http://localhost:<port>`.

Expected: the page loads, source input exists, and the app shell renders.

- [ ] **Step 3: Report limitations**

State clearly that `.docx` parsing is represented as a visible placeholder in this static prototype and real parsing can be added in the next iteration.
