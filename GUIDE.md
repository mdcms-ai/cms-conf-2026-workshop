# Workshop guide

Follow along at your own pace. Each part ends with a checkpoint so you know
you are ready for the next one.

You need: Node.js 22.18+, Bun 1.3+, Chrome or Firefox, and an AI coding agent
with MCP support. The server URL and the access code are provided in the room.

## 0. Run the starter

```bash
npm install
npm run dev
```

Open http://localhost:3000. You see six posts. The badge in the header says
`content: files`: every post is a Markdown file in `content/posts`.

Check that Bun is installed, because the `mdcms` CLI runs on it:

```bash
bun --version
```

No Bun? `npm install -g bun`.

Create your account on the workshop server: open `<server URL>/join`, fill in
your name, email, a password and a **project name** such as
`field-notes-<your-name>`, and enter the access code from the screen. The
project is yours alone; nobody else in the room can see it. The confirmation
shows the server URL, your email and your project name. You need all three
below.

## 1. Schema in TypeScript

### 1.1 Import your content

```bash
npm install -D @mdcms/cli
npx mdcms init
```

Answer the wizard:

| Prompt                     | Answer                                  |
| -------------------------- | --------------------------------------- |
| Server URL                 | the workshop server URL                 |
| Project name               | the project name you registered         |
| Environment name           | press Enter for `production`            |
| Browser login              | sign in with the account you registered |
| Select content directories | press `a` to select all, then Enter     |
| Confirm inferred types?    | Yes                                     |
| Import 8 files to server?  | Yes                                     |
| Untrack them?              | Yes                                     |

What happened:

- A project was created on the server.
- `mdcms.config.ts` was written with a schema inferred from your frontmatter.
- All 8 files were imported as draft documents.
- `content/posts` and `content/authors` were added to `.gitignore`. The server
  is now the source of truth for content; the repo keeps code and schema.

```bash
npx mdcms status
git add -A && git commit -m "Adopt MDCMS"
```

### 1.2 Refine the schema

Open `mdcms.config.ts` and replace the `types` with named definitions:

```ts
import { defineConfig, defineType, fieldTypes } from "@mdcms/cli";
import { z } from "zod";

const author = defineType("author", {
  directory: "content/authors",
  fields: {
    name: z.string().min(1),
    role: z.string().min(1),
  },
});

const post = defineType("post", {
  directory: "content/posts",
  fields: {
    title: z.string().min(1),
    slug: z.string().min(1),
    summary: z.string().min(1),
    publishedAt: z.string(),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
    author: fieldTypes.reference("author").optional(),
  },
});

export default defineConfig({
  // keep your own project, environment and serverUrl here
  project: "field-notes-<your-name>",
  environment: "production",
  serverUrl: "<workshop server URL>",
  contentDirectories: ["content/authors", "content/posts"],
  environments: {
    production: {},
  },
  types: [author, post],
});
```

Send the schema to the server:

```bash
npx mdcms schema sync
```

**Checkpoint:** `npx mdcms status` prints `Unchanged: 8 files` and
`Schema: In sync`.

## 2. CLI sync

Edit a post in your editor, for example change the title in
`content/posts/hello-world.md`. Then:

```bash
npx mdcms status          # "Modified locally (1)"
npx mdcms push --dry-run  # shows the plan, writes nothing
npx mdcms push            # confirm with Enter
```

Your edit is now a draft on the server. Prove that the files are only a
working copy:

```bash
rm -rf content
npx mdcms pull
ls content/posts
```

Everything is back. `pull` also normalizes the frontmatter, so the key order in
your files may change.

**Checkpoint:** `content/posts` has six files again and `npx mdcms status`
reports no drift.

## 3. Studio in your app

```bash
npm install @mdcms/studio
```

Create `app/admin/[[...path]]/page.tsx`:

```tsx
import { prepareStudioConfig } from "@mdcms/studio/runtime";

import config from "../../../mdcms.config";
import { AdminStudioClient } from "./admin-studio-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Runs on the server, where the full schema is available. The schema hash
  // it computes is what lets Studio write to the project.
  const prepared = await prepareStudioConfig(config, { cwd: process.cwd() });

  return (
    <AdminStudioClient
      project={prepared.project}
      environment={prepared.environment}
      serverUrl={prepared.serverUrl}
      schemaHash={prepared._schemaHash}
      documentRouteMetadata={prepared._documentRouteMetadata}
    />
  );
}
```

Create `app/admin/[[...path]]/admin-studio-client.tsx`:

```tsx
"use client";

import { Studio, type MdcmsConfig } from "@mdcms/studio";

export function AdminStudioClient(props: {
  project: string;
  environment: string;
  serverUrl: string;
  schemaHash?: string;
  documentRouteMetadata?: MdcmsConfig["_documentRouteMetadata"];
}) {
  const config = {
    project: props.project,
    environment: props.environment,
    serverUrl: props.serverUrl,
    ...(props.schemaHash ? { _schemaHash: props.schemaHash } : {}),
    ...(props.documentRouteMetadata
      ? { _documentRouteMetadata: props.documentRouteMetadata }
      : {}),
  } as MdcmsConfig;

  return <Studio config={config} basePath="/admin" />;
}
```

Open http://localhost:3000/admin and sign in with the account you
registered.

Try it:

1. Content, post, open "Hello, world". Change some text. It autosaves a draft.
2. Open the panel on the right. The fields come from your schema.
3. Click **Publish** and add a change summary. Look at the History tab.
4. Go back to the post list, tick the checkbox in the header to select all
   posts, and click **Publish**.
5. Settings, API keys, **Create API Key**. Label `site-read`, scope
   `content:read` only. Copy the key; it is shown once.

**Checkpoint:** all six posts show `PUBLISHED` and you have a `site-read` key.

Troubleshooting:

- Studio looks unstyled or squashed: your global CSS has a `* { margin: 0;
padding: 0 }` reset. The starter avoids it; remove it from your own app.
- The editor says "Read-only": the page must use `prepareStudioConfig` as
  shown above so Studio receives the schema hash.
- Sign-in does nothing: use Chrome or Firefox and allow third-party cookies
  for this page.

## 4. Read content with the SDK

```bash
npm install @mdcms/sdk
echo "MDCMS_SITE_API_KEY=<paste your site-read key>" >> .env.local
```

Use the name `MDCMS_SITE_API_KEY`, not `MDCMS_API_KEY`. The CLI reads
`MDCMS_API_KEY` from `.env` files and would use this read-only key instead of
your login.

Replace `lib/posts.ts` with:

```ts
import type { ReactNode } from "react";

import { createClient } from "@mdcms/sdk";
import { createMdcmsRenderer } from "@mdcms/sdk/react";

import config from "../mdcms.config";

export const contentSource = "mdcms";

export type PostSummary = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  tags: string[];
  featured: boolean;
};

export type Post = PostSummary & {
  content: ReactNode;
};

const cms = createClient({
  serverUrl: config.serverUrl,
  project: config.project,
  environment: config.environment,
  apiKey: process.env.MDCMS_SITE_API_KEY!,
});

const renderer = createMdcmsRenderer(config);

function toSummary(frontmatter: Record<string, unknown>): PostSummary {
  return {
    slug: String(frontmatter.slug ?? ""),
    title: String(frontmatter.title ?? "Untitled"),
    summary: String(frontmatter.summary ?? ""),
    publishedAt: String(frontmatter.publishedAt ?? ""),
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
    featured: frontmatter.featured === true,
  };
}

export async function getPosts(): Promise<PostSummary[]> {
  const { data } = await cms.list("post", { limit: 100 });

  return data
    .map((document) => toSummary(document.frontmatter))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const { data } = await cms.list("post", { slug, limit: 1 });
  const document = data[0];

  if (!document) {
    return undefined;
  }

  return {
    ...toSummary(document.frontmatter),
    content: await renderer.render(document),
  };
}
```

You can now uninstall `gray-matter` and `marked`.

Open http://localhost:3000. The badge says `content: mdcms`. If you see an
authorization error, restart `npm run dev` so `.env.local` is loaded.

Try it: edit a post in Studio and refresh the site. Nothing changes. Publish
the post and refresh again. Now it changes, with no rebuild and no deploy.

**Checkpoint:** the site lists six posts and the badge says `content: mdcms`.

## 5. Agents

### 5.1 Connect the MCP server

`mdcms mcp` is a preview. It needs `@mdcms/cli` with MCP support; run
`npx mdcms --help` and check that `mcp` is listed. If it is not, run
`npm install -D @mdcms/cli@latest`.

Claude Code:

```bash
claude mcp add mdcms -- npx mdcms mcp
```

Cursor and other clients, in `.mcp.json` at the project root:

```json
{
  "mcpServers": {
    "mdcms": { "command": "npx", "args": ["mdcms", "mcp"] }
  }
}
```

Start your agent from the project root. The MCP server reuses the login from
`mdcms init`.

Tools: `get_schema`, `list_documents`, `get_document`, `create_document`,
`update_document`, `publish_document`, `sync_schema`.

### 5.2 Exercise: a bulk edit

Keep Studio open next to your agent and prompt:

> Use the mdcms tools. Look at the tags on all posts and normalize them to
> lowercase kebab-case.

In Studio the touched posts now show unpublished changes. The site has not
changed. Review, then publish them from the post list.

### 5.3 Exercise: change the schema from a prompt

> Add a numeric `readingTime` field (minutes) to the post type in
> mdcms.config.ts, sync the schema, then set it for every post based on its
> word count.

The agent edits `mdcms.config.ts`, calls `sync_schema`, then updates each post.

Bonus prompts:

> Link every post to one of our authors.

> Draft a new post announcing that our blog now runs on MDCMS.

### 5.4 See the guardrails

Ask the agent to set a post title to a number, or to publish everything.

- Invalid frontmatter is rejected with `INVALID_FRONTMATTER` and nothing is
  written.
- Publishing is refused with `FORBIDDEN`: the key from `mdcms init` does not
  have the `content:publish` scope. The agent drafts, a person publishes.

### 5.5 Back to files

```bash
npx mdcms pull
git diff mdcms.config.ts
```

The agent's content edits are in your working copy, and the schema change is an
ordinary diff in `mdcms.config.ts`.

### Optional: the skills pack

```bash
npx skills add mdcms-ai/mdcms/skills
```

This teaches your agent the file-based workflow from part 2: edit local
files, validate, push.

## Running your own server

The workshop uses a shared server. To run MDCMS yourself:

```bash
git clone https://github.com/mdcms-ai/mdcms.git
cd mdcms
echo "MDCMS_STUDIO_ALLOWED_ORIGINS=http://localhost:3000" >> .env
echo "MDCMS_COLLAB_ALLOWED_ORIGINS=http://localhost:3000" >> .env
docker compose up -d --build
curl http://localhost:4000/healthz
```

Create the first user, who becomes the owner:

```bash
curl -X POST http://localhost:4000/api/v1/auth/sign-up/email \
  -H "content-type: application/json" \
  -d '{"email":"you@example.com","password":"choose-a-password","name":"You"}'
```

Then use `http://localhost:4000` as the server URL in `mdcms init`.
