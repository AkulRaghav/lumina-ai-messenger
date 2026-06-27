# Server — Auth Backend

Prisma + SQLite backend for Lumina authentication.

## Structure

```
server/
├── prisma/schema.prisma   # Database schema (User, Session)
├── generated/prisma/      # Auto-generated Prisma client (gitignored)
├── db.ts                  # Prisma client singleton
├── auth.ts                # Password hashing, session management
└── api/auth.ts            # TanStack Start server functions (register, login, logout, getSession)
```

## Setup

```bash
bun install                # installs deps + runs postinstall (prisma generate)
bun run db:push            # creates/migrates the SQLite database
bun run dev                # starts dev server
```

## Database

SQLite file stored at `data/lumina.db` (gitignored). To reset:

```bash
rm -rf data/
bun run db:push
```

## API (Server Functions)

| Function     | Method | Description                          |
|-------------|--------|--------------------------------------|
| `register`  | POST   | Create account + auto-login          |
| `login`     | POST   | Authenticate + set session cookie    |
| `logout`    | POST   | Clear session cookie + delete record |
| `getSession`| GET    | Check current session, return user   |

All auth state is managed via an httpOnly cookie (`lumina_session`).
