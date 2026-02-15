# Frontend Architecture

## Layout
- App source: `src/`
- Features: `src/features/`
- Shared components: `src/components/`
- Redux state: `src/app/`
- Page entries: `src/pages/`
- Services/API clients: `src/services/`

## Import Rules
- Use alias imports (`@/...`) instead of deep relative paths.
- Feature-to-feature dependencies should be minimal and acyclic.

## Runtime
- Vite dev server (`npm run dev`)
- Env variable: `VITE_API_BASE_URL`

## Testing
- Vitest + Testing Library in `src/test/`.
