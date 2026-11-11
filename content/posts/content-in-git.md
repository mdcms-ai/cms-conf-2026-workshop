---
title: The limits of content in Git
slug: content-in-git
summary: A pull request is a great review tool and a poor publishing workflow.
publishedAt: 2026-09-29
tags:
  - Engineering
  - content
  - git
featured: false
---

Keeping content next to code has real benefits: history, review, and one
source of truth. It also has costs we kept running into.

## What hurt

1. Every typo fix triggered a full rebuild and deploy.
2. Two editors on the same page meant a merge conflict.
3. Marketing could not publish without an engineer.

## What we wanted to keep

We still wanted files. Our tools, our scripts and our agents all work with
files.
