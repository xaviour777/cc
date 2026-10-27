export default function ArticleBody({ content }: { content: string }) {
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
            <li key={i}>{li}</li>
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
    if (line.startsWith("### ")) blocks.push(<h3 key={key++}>{line.slice(4)}</h3>);
    else if (line.startsWith("## ")) blocks.push(<h2 key={key++}>{line.slice(3)}</h2>);
    else if (line.startsWith("> ")) blocks.push(<blockquote key={key++}>{line.slice(2)}</blockquote>);
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
    } else blocks.push(<p key={key++}>{line}</p>);
  }
  flushList();

  return <div className="prose-colony">{blocks}</div>;
}
