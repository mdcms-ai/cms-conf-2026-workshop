---
title: Schemas belong in code
slug: schemas-as-code
summary: A content model you can review, type-check and version.
publishedAt: 2026-10-08
tags:
  - engineering
  - typescript
featured: true
---

A content model defined by clicking through an admin panel is invisible to
code review. A content model defined in TypeScript is just another change in a
pull request.

```ts
const post = defineType("post", {
  directory: "content/posts",
  fields: {
    title: z.string().min(1),
    slug: z.string().min(1),
  },
});
```

The same definition validates content, generates editor forms, and tells an
agent what a valid document looks like.
