import Link from "next/link";
import { Fragment, type ReactNode } from "react";

// Минимальный и безопасный рендер markdown-ответов помощника: абзацы,
// списки, заголовки ###, **жирный**, `код` и ссылки. Без
// dangerouslySetInnerHTML — всё собирается из React-элементов, поэтому
// HTML из ответа модели никогда не исполняется. Ссылки — только
// внутренние (/...) и https://.

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)\s]+)\))|(`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${i++}`;
    if (m[1]) {
      out.push(<strong key={key} className="font-semibold text-fg">{m[2]}</strong>);
    } else if (m[3]) {
      const label = m[4];
      const href = m[5];
      if (href.startsWith("/") && !href.startsWith("//")) {
        out.push(
          <Link key={key} href={href} className="text-primary-link underline underline-offset-2 hover:brightness-110">
            {label}
          </Link>,
        );
      } else if (href.startsWith("https://")) {
        out.push(
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-primary-link underline underline-offset-2 hover:brightness-110">
            {label}
          </a>,
        );
      } else {
        out.push(label);
      }
    } else if (m[6]) {
      out.push(
        <code key={key} className="rounded bg-inset px-1 py-0.5 text-[0.85em]">
          {m[7]}
        </code>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function AssistantMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      const k = `p${blocks.length}`;
      blocks.push(
        <p key={k}>
          {para.map((l, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {renderInline(l, `${k}-${i}`)}
            </Fragment>
          ))}
        </p>,
      );
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const k = `l${blocks.length}`;
      const items = list.items.map((it, i) => <li key={i}>{renderInline(it, `${k}-${i}`)}</li>);
      blocks.push(
        list.ordered ? (
          <ol key={k} className="list-decimal space-y-1 pl-5">{items}</ol>
        ) : (
          <ul key={k} className="list-disc space-y-1 pl-5">{items}</ul>
        ),
      );
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (heading) {
      flushPara();
      flushList();
      const k = `h${blocks.length}`;
      blocks.push(<p key={k} className="font-semibold text-fg">{renderInline(heading[1], k)}</p>);
    } else if (bullet || numbered) {
      flushPara();
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? numbered)![1]);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();

  return <div className="flex flex-col gap-2 leading-relaxed">{blocks}</div>;
}
