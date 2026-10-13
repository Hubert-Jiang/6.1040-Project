## Running the app

- `bun run dev` starts MongoDB in a container, then the backend at http://127.0.0.1:3000 and the frontend at http://127.0.0.1:8080, both in watch mode.
- `bun run up` runs all three in containers. `bun run down` stops them, and `bun run db:reset` deletes the local data.
- Change `design/` before the code. Check it with `bun run check:design`, then run `bun run generate` and `bun run check`.

## Development Guidelines & Structural Context

- **Environment**: Bun binary is located at `~/.bun/bin/bun`. Ensure PATH includes `~/.bun/bin`.
- **Source of Truth**: `/design` is the authoritative source of truth for concept specifications, application types, instances, and compositions. `README.md` provides background documentation.
- **Design Verification**: Always verify design files with `bun run check:design` before proceeding with TypeScript implementation.
- **Git Policy**: Never execute `git commit` without explicit permission from the user.
- **Concept Independence & Pseudonymity**:
  - `Auctioning` operates on `Alias` (not `User`), ensuring bidders and sellers are masked behind pseudonyms.
  - `Pseudonyming` is scoped to a `Listing` context to provide bijective mappings between `User` and `Alias`.
  - `Profiling` stores sensitive user contact info (phone/email) out-of-band from public listings.
  - `Sessioning` manages authentication sessions for Touchstone users; endpoints must resolve the current user from active sessions rather than trusting untrusted inputs.
- **Read Models**: All UI reads must use sync-engine `former` or `view` constructs in composition and be documented with typed links (`former:...` or `view:...`) in `design/compositions/*.md`.

