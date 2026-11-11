import Link from "next/link";

import { getPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <ul className="post-list">
      {posts.map((post) => (
        <li key={post.slug}>
          <h2>
            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
          </h2>
          <p>{post.summary}</p>
          <div className="meta">
            <time dateTime={post.publishedAt}>{post.publishedAt}</time>
            {post.featured ? <span className="featured">Featured</span> : null}
            {post.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
