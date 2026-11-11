import Link from "next/link";
import { notFound } from "next/navigation";

import { getPost } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="post">
      <Link href="/" className="back">
        ← All posts
      </Link>
      <h1>{post.title}</h1>
      <p className="summary">{post.summary}</p>
      <div className="meta">
        <time dateTime={post.publishedAt}>{post.publishedAt}</time>
        {post.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
      <div className="body">{post.content}</div>
    </article>
  );
}
