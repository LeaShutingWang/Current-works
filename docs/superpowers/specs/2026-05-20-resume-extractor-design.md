# Resume Project Extractor Design

## Summary

Build a lightweight single-page web tool that helps the user turn messy project materials into resume-ready work experience. The first version focuses on one complete workflow: paste or upload project materials, extract structured project cards, generate editable resume bullets, and let the user copy the result.

The tool is intentionally scoped as a local-first MVP. It will not include accounts, cloud storage, JD matching, PDF parsing, full resume export, or version history in the first version.

## Goals

- Accept pasted text and uploaded `.txt`, `.md`, and `.docx` files.
- Convert all inputs into normalized source documents.
- Generate one or more structured project cards from the source material.
- Generate 3-5 editable Chinese resume bullets per project.
- Keep the AI integration behind a provider interface so the first version can use mock output and later switch to a real OpenAI provider.
- Preserve user input and editable results in frontend state during the session.

## Non-Goals

- PDF parsing.
- User accounts or persistent cloud storage.
- Resume template export to Word or PDF.
- JD matching and targeted resume rewriting.
- Real OpenAI API integration in the initial MVP implementation.

## Chosen Approach

Use a lightweight React/Vite single-page application. The page is a three-column workbench:

- Left: source input area for pasted text and uploaded files.
- Middle: structured project cards for reviewing extracted facts.
- Right: editable resume bullets for copying into a resume.

This approach was chosen because it gets the core value in front of the user quickly while keeping the code ready for a later real AI provider.

## Page Structure

### Source Input Area

The left column supports:

- Pasting raw project text, weekly reports, OKRs, PRD notes, technical plans, or retrospective notes.
- Dragging or selecting `.txt`, `.md`, and `.docx` files.
- Showing each source document with file name, type, parse status, and delete action.
- A primary action equivalent to "Extract work experience". The implementation should display this in Chinese.

Unsupported file types are rejected with a clear message. Failed `.docx` parsing keeps the file visible and suggests pasting the document text manually.

### Project Card Area

The middle column displays one card per extracted project. Each card includes:

- Project title.
- Project context.
- User role.
- Key actions.
- Tech stack or working methods.
- Challenges.
- Outcomes.
- Metrics.

This area is for review and correction awareness, not full editing in the first version.

### Resume Bullet Editor

The right column displays editable bullets grouped by project. Each project has:

- 3-5 generated bullets.
- Inline editing for each bullet.
- Copy single bullet action.
- Copy all bullets for the project action.

Edits are stored only in frontend state for the MVP.

## Data Model

```ts
type SourceDocument = {
  id: string;
  name: string;
  type: "pasted" | "txt" | "md" | "docx";
  text: string;
  status: "ready" | "parsing" | "error";
  error?: string;
};

type ExtractionRequest = {
  sources: SourceDocument[];
  language: "zh-CN";
  style: "big-tech";
};

type ExtractedProject = {
  id: string;
  title: string;
  context: string;
  role: string;
  actions: string[];
  techStack: string[];
  challenges: string[];
  outcomes: string[];
  metrics: string[];
  bullets: ResumeBullet[];
};

type ResumeBullet = {
  id: string;
  text: string;
  needsMetric: boolean;
};
```

## Data Flow

1. User pastes text or uploads files.
2. File parsers convert each accepted input into a `SourceDocument`.
3. The user clicks the extract-work-experience action.
4. The page creates an `ExtractionRequest` from all ready documents.
5. `resumeExtractor` sends the request to the active AI provider.
6. The initial provider is `mockAiProvider`, which returns deterministic structured JSON.
7. The UI renders project cards and editable bullets.
8. User edits bullet text in place.
9. User copies one bullet or all bullets for a project.

## Module Boundaries

### `fileParsers`

Responsibilities:

- Parse `.txt` and `.md` as text.
- Parse `.docx` into plain text using a document parsing library.
- Return normalized text and parser errors.

It should not know anything about resume formatting or AI prompts.

### `aiProvider`

Responsibilities:

- Define a shared provider interface.
- Implement `mockAiProvider` for the MVP.
- Leave a compatible boundary for future `openAiProvider`.

Provider interface:

```ts
type AiProvider = {
  extractProjects(request: ExtractionRequest): Promise<ExtractedProject[]>;
};
```

### `resumeExtractor`

Responsibilities:

- Validate that sources contain enough text.
- Build the extraction request.
- Call the active provider.
- Validate the provider response shape before returning it to UI state.

It owns extraction-specific logic, but not rendering.

### `components`

Responsibilities:

- `SourceInputPanel`: paste box, upload control, file list, generate button.
- `ProjectCardsPanel`: structured extracted project cards.
- `BulletEditorPanel`: editable bullets and copy actions.
- Shared status and error presentation components.

## AI Output Rules

Generated output should be Chinese by default and shaped for internet or big-tech resume conventions.

Bullets should:

- Prefer strong Chinese action verbs equivalent to building, optimizing, driving, launching, refactoring, and systematizing.
- Follow the pattern: what was done, how it was done, and what result it created.
- Use metrics when the source material provides them.
- Avoid inventing unsupported numbers.
- Use explicit editable placeholders when metrics are missing, such as "improved XX% (metric needed)" or "supported XX scenario (metric needed)", translated into Chinese in the UI output.
- Avoid weak Chinese phrasing equivalent to "responsible for" and "participated in" when a stronger verb is available.

## Error Handling

- Unsupported file type: show a file-level error and do not add it as a ready source.
- `.docx` parse failure: keep the file item in error status and suggest manual paste.
- Too little input text: prevent generation and ask the user to add project background, goals, actions, or results.
- Provider returns malformed data: show a recoverable error and keep all source inputs.
- Generation in progress: disable the generate button and show progress state.
- Copy failure: show a short failure message and keep the edited bullet text intact.

## Testing Strategy

### Parser Tests

- `.txt` parses into text.
- `.md` parses into text.
- `.docx` parses into text.
- Unsupported file formats return a clear error.

### Extraction Tests

- `mockAiProvider` returns stable structured projects.
- `resumeExtractor` rejects too-short input.
- `resumeExtractor` rejects malformed provider output.

### UI Tests

- User can paste source text.
- User can upload accepted files.
- User can remove a source document.
- User can click generate and see project cards plus bullets.
- User can edit a bullet.
- User can copy a single bullet and all bullets for a project.

## Future Extensions

- Real OpenAI provider with user-supplied API key or server-side API route.
- PDF parsing.
- JD-specific rewriting.
- Project library and version history.
- Export to Markdown, Word, or PDF.
- Full resume section editing.

## Accepted Risks

- Mock output means the first implementation proves the workflow and UI, not final AI quality.
- `.docx` parsing can still miss formatting nuance because the MVP converts documents to plain text.
- Frontend-only state means a browser refresh loses current work in the MVP.
