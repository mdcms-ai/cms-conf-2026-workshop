import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createElement, type ReactNode } from "react";

import matter from "gray-matter";
import { marked } from "marked";

/**
 * Content access for the site. Today every post is a Markdown file in
 * content/posts. The pages only use getPosts() and getPost(), so the source
 * can change without touching them.
 */

export const contentSource = "files";

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

const POSTS_DIRECTORY = join(process.cwd(), "content", "posts");

function toDateString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return typeof value === "string" ? value : "";
}

function toSummary(frontmatter: Record<string, unknown>): PostSummary {
  return {
    slug: String(frontmatter.slug ?? ""),
    title: String(frontmatter.title ?? "Untitled"),
    summary: String(frontmatter.summary ?? ""),
    publishedAt: toDateString(frontmatter.publishedAt),
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
    featured: frontmatter.featured === true,
  };
}

async function readPostFiles() {
  const fileNames = (await readdir(POSTS_DIRECTORY)).filter((name) =>
    /\.mdx?$/.test(name),
  );

  return Promise.all(
    fileNames.map(async (name) =>
      matter(await readFile(join(POSTS_DIRECTORY, name), "utf8")),
    ),
  );
}

export async function getPosts(): Promise<PostSummary[]> {
  const files = await readPostFiles();

  return files
    .map((file) => toSummary(file.data))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const files = await readPostFiles();
  const file = files.find((candidate) => candidate.data.slug === slug);

  if (!file) {
    return undefined;
  }

  return {
    ...toSummary(file.data),
    content: createElement("div", {
      dangerouslySetInnerHTML: { __html: await marked.parse(file.content) },
    }),
  };
}
