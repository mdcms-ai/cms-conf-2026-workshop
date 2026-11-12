# Field Notes: MDCMS workshop starter

A small Next.js blog whose posts are Markdown files in `content/posts`.
During the workshop you move this content into MDCMS without giving up the
files.

## Prerequisites

- Node.js 22.18 or newer
- [pnpm](https://pnpm.io) (`npm install -g pnpm` if you do not have it)
- [Bun](https://bun.sh) 1.3 or newer (the `mdcms` CLI runs on Bun)
- Chrome or Firefox
- An AI coding agent with MCP support (Claude Code, Cursor, Codex, ...)

## Run it

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Where things are

| Path                   | What it is                               |
| ---------------------- | ---------------------------------------- |
| `content/posts/*.md`   | Blog posts (Markdown with frontmatter)   |
| `content/authors/*.md` | Author profiles                          |
| `lib/posts.ts`         | The only code that knows where posts are |
| `app/(site)`           | The public site                          |
