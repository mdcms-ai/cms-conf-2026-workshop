# Workshop guide

Follow along at your own pace. Most steps are a prompt you give your AI coding
agent. Each one is followed by a **Without an agent** section that reaches the
same result by hand: use it if your agent gets stuck or you do not have one.
Each part ends with a checkpoint so you know you are ready for the next one.

You need: Node.js 22.18+, pnpm, Chrome or Firefox, and an AI coding agent with
MCP support. The server URL and the join link are provided in the room.

## 0. Set up

```bash
git clone https://github.com/mdcms-ai/cms-conf-2026-workshop
cd cms-conf-2026-workshop
pnpm install
pnpm dev
```

No pnpm? `npm install -g pnpm`.

Open http://localhost:3000. You see six posts. The badge in the header says
`content: files`: every post is a Markdown file in `content/posts`. Keep the
blog on port 3000; Studio sign-in only works from `http://localhost:3000`.

Create your account on the workshop server: open `<server URL>/join` and fill
in your name, email and a password. The **project name** fills in from your
name; you can change it. No access code is needed. The project is yours alone;
nobody else in the room can see it. The panel next to the form shows the
answers `mdcms init` will ask for: the server URL, your project name and
`production`. Keep the page open after you register.

**Checkpoint:** the blog runs with the `content: files` badge, you are
registered, and your agent starts in the `cms-conf-2026-workshop` folder.

## 1. Bring your content in

Everyone does this part by hand.

```bash
pnpm add -D @mdcms/cli
pnpm mdcms init
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
pnpm mdcms status
git add -A && git commit -m "Adopt MDCMS"
```

**Checkpoint:** `pnpm mdcms status` prints `Unchanged: 8 files` and
`Schema: In sync`.

## 2. Connect your agent

Install the MDCMS skills pack. It teaches your agent how to set up Studio, the
SDK, schema changes and content edits. The installer asks which agents to
install for; pick yours.

```bash
pnpm dlx skills add mdcms-ai/mdcms/skills
```

Add the MDCMS MCP server. It gives your agent typed tools on the content API:
`get_schema`, `list_documents`, `get_document`, `create_document`,
`update_document`, `publish_document`, `sync_schema`. Writes through these
tools are drafts.

Claude Code:

```bash
claude mcp add mdcms -- npx mdcms mcp
```

Other clients, in `.mcp.json` at the project root (check your client's docs
for the file it reads):

```json
{
  "mcpServers": {
    "mdcms": { "command": "npx", "args": ["mdcms", "mcp"] }
  }
}
```

`npx` comes with Node and runs the CLI that pnpm installed. The MCP server
reuses the login from `mdcms init`, so your agent has the same permissions as
your CLI.

Restart your agent from the project folder so it loads the skills and the MCP
server. Check that `mdcms` is connected (in Claude Code: `/mcp`). Then ask:

```text
What content types does this MDCMS project have?
```

The agent calls `get_schema` and names the `author` and `post` types.

Troubleshooting:

- `mcp` is not listed in `pnpm mdcms --help`: run
  `pnpm add -D @mdcms/cli@latest`.
- The MCP server does not start in a desktop app (Cursor, Claude Desktop): the
  app does not see Node on its PATH. Use a terminal agent, or put the full
  path to `npx` in the MCP config.

`mdcms mcp` is a preview.

### Without an agent

Skip this part. In part 3, follow the **Without an agent** section of each
step.

**Checkpoint:** your agent answers with the `author` and `post` types.

## 3. Let the agent drive

### 3.1 Extend the schema

```text
Add an author field to the post type that references the author type, fill it in for every post, and sync the schema to MDCMS.
```

The agent adds an `author` reference to the `post` type in `mdcms.config.ts`,
syncs the schema to the server, then sets an author on each of the six posts.
A reference holds an author document id; the server checks that the id points
to an author. The post changes are drafts.

#### Without an agent

Open `mdcms.config.ts` and replace the `types` with named definitions:

```ts
import { defineConfig, defineType, fieldTypes, z } from "@mdcms/cli";

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
pnpm mdcms schema sync
```

Setting an author on each post is optional in this path; the rest of the
workshop does not depend on it.

**Checkpoint:** `mdcms.config.ts` has the `author` field and
`pnpm mdcms status` prints `Schema: In sync`.

### 3.2 Add Studio

```text
Add MDCMS Studio to this Next.js app at /admin.
```

The agent installs `@mdcms/studio` and adds a route under
`app/admin/[[...path]]`. The workshop server already allows
`http://localhost:3000`, so nothing needs to change on the server.

Open http://localhost:3000/admin and sign in with the account you registered.

Try it:

1. Content, post, open "Hello, world". Change some text. It autosaves a draft.
2. Open the panel on the right. The fields come from your schema, including
   `author`.
3. Click **Publish** and add a change summary. Look at the History tab.

#### Without an agent

```bash
pnpm add @mdcms/studio
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

Then open http://localhost:3000/admin and try it as described above.

Troubleshooting:

- Studio looks unstyled or squashed: your global CSS has a `* { margin: 0;
padding: 0 }` reset. The starter avoids it; remove it from your own app.
- The editor says "Read-only": the page must use `prepareStudioConfig` as
  shown above so Studio receives the schema hash.
- Sign-in does nothing: use Chrome or Firefox and allow third-party cookies
  for this page.
- 404 on `/admin`: the folder name must be exactly `[[...path]]`.

**Checkpoint:** you are signed in to Studio at `/admin` and one post is
published.

### 3.3 Normalize the tags

Keep Studio's post list (Content, post) open next to your agent and prompt:

```text
Normalize the tags on all posts to lowercase-kebab-case. Save the changes as drafts in MDCMS; do not publish.
```

The agent updates the posts whose tags need it. They are drafts: in Studio,
"Hello, world" (published in 3.2) shows unpublished changes again. Open it and
compare the draft with the published version.

Then review and publish: on the post list, tick the checkbox in the header to
select all six posts and click **Publish**. All six now show `PUBLISHED`. The
site reads only published content in 3.4, so do not skip this.

#### Without an agent

Bring your files up to date with the server first, then edit the tags in
`content/posts/*.md` by hand:

```bash
pnpm mdcms pull
# edit the tags, for example "AI" to "ai" and "Engineering" to "engineering"
pnpm mdcms status          # "Modified locally (...)"
pnpm mdcms push --dry-run  # shows the plan, writes nothing
pnpm mdcms push            # confirm with Enter
```

Your edits are now drafts on the server. Review and publish them in Studio as
described above.

**Checkpoint:** all six posts show `PUBLISHED` in Studio.

### 3.4 Read content with the SDK

First, by hand (an agent cannot create API keys): in Studio, go to Settings,
API keys, **Create API Key**. Label `site-read`, scope `content:read` only.
Copy the key; it is shown once. Add it to `.env.local`:

```bash
echo "MDCMS_SITE_API_KEY=<paste your site-read key>" >> .env.local
```

Use the name `MDCMS_SITE_API_KEY`, not `MDCMS_API_KEY`. The CLI reads
`MDCMS_API_KEY` from `.env` files and would use this read-only key instead of
your login.

Then prompt:

```text
Render the posts from MDCMS with @mdcms/sdk instead of reading the files in content/posts. The API key is in MDCMS_SITE_API_KEY.
```

The agent installs `@mdcms/sdk` and rewrites `lib/posts.ts`. The pages do not
change. Open http://localhost:3000: the badge says `content: mdcms`. If it
still says `content: files`, ask the agent to set `contentSource` in
`lib/posts.ts` to `"mdcms"`. If you see an authorization error, restart
`pnpm dev` so `.env.local` is loaded.

Try it: edit a post in Studio and refresh the site. Nothing changes. Publish
the post and refresh again. Now it changes, with no rebuild and no deploy.

#### Without an agent

Create the key as described above, then:

```bash
pnpm add @mdcms/sdk
```

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

**Checkpoint:** the site lists six posts and the badge says `content: mdcms`.

### 3.5 See the guardrails

Two prompts that should fail, safely:

```text
Publish all posts.
```

Publishing is refused with `FORBIDDEN`: the key from `mdcms init` does not
have the `content:publish` scope. The agent drafts, a person publishes. If the
agent answers that everything is already published, ask it to call
`publish_document` for the hello-world post.

```text
Use the mdcms MCP tool update_document to set the title of hello-world to the number 42 (a number, not text), and show me exactly what the server answers.
```

The update is rejected with `INVALID_FRONTMATTER` and nothing is written. The
error names the field and the expected type, so the agent can correct itself.

These are the four properties from the start of the workshop: a schema the
agent can read, errors it can act on, drafts by default, and scoped
credentials.

#### Without an agent

There is no CLI command for publishing; publishing happens in Studio. To see
validation catch a bad value, set `title: 42` in
`content/posts/hello-world.md` and run:

```bash
pnpm mdcms push --validate --dry-run
```

The CLI reports the field that does not match the schema. Change the title
back afterwards.

## 4. Back to files

```bash
pnpm mdcms pull
git diff mdcms.config.ts
```

Everything the agent and Studio changed is now in your working copy: lowercase
tags, an author on each post, your Studio edits. The schema change is an
ordinary diff in `mdcms.config.ts`. `pull` also normalizes the frontmatter, so
the key order in your files may change.

Prove that the files are only a working copy:

```bash
rm -rf content
pnpm mdcms pull
ls content/posts
```

Everything is back. On Windows without a Unix shell, use
`Remove-Item -Recurse content` instead of `rm -rf content`.

**Checkpoint:** `content/posts` has six files and `pnpm mdcms status` reports
no drift.

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
