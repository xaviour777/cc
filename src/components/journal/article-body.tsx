import type { ReactNode } from "react";

/** Renders **bold** and *italic* inside a line. */
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  if (parts.length === 1 && !/^\*/.test(parts[0])) return text;
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
      <em key={i}>{part.slice(1, -1)}</em>
    ) : (
      part
    )
  );
}

/**
 * Light markdown renderer for journal articles. When `cta` is given it is placed
 * near the middle of the article, just before the closest section heading.
 */
export default function ArticleBody({ content, cta }: { content: string; cta?: ReactNode }) {
  const blocks: React.ReactNode[] = [];
  const lines = content.split("\n");
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length) {
      const items = listItems;
      blocks.push(
        <ul key={`ul-${key++}`}>
          {items.map((li, i) => (
            <li key={i}>{inline(li)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
      continue;
    }
    flushList();
    if (line.startsWith("### ")) blocks.push(<h3 key={key++}>{inline(line.slice(4))}</h3>);
    else if (line.startsWith("## ")) blocks.push(<h2 key={key++}>{inline(line.slice(3))}</h2>);
    else if (line.startsWith("> ")) blocks.push(<blockquote key={key++}>{inline(line.slice(2))}</blockquote>);
    else if (line === "---") blocks.push(<hr key={key++} />);
    else if (line.startsWith("[youtube:")) {
      const id = line.slice(9, -1);
      blocks.push(
        <div className="embed" key={key++}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    } else if (line.startsWith("![") && line.includes("](")) {
      const alt = line.slice(2, line.indexOf("]("));
      const src = line.slice(line.indexOf("](") + 2, -1);
      blocks.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img key={key++} src={src} alt={alt} loading="lazy" className="rounded-2xl w-full my-8" />
      );
    } else blocks.push(<p key={key++}>{inline(line)}</p>);
  }
  flushList();

  if (cta && blocks.length > 6) {
    const mid = Math.floor(blocks.length / 2);
    const headings = blocks
      .map((b, i) => ((b as { type?: unknown })?.type === "h3" || (b as { type?: unknown })?.type === "h2" ? i : -1))
      .filter((i) => i > 2 && i < blocks.length - 3);
    const at = headings.length ? headings.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a)) : mid;
    blocks.splice(at, 0, <div key="cta" className="not-prose my-10">{cta}</div>);
  }

  return <div className="prose-colony">{blocks}</div>;
}
