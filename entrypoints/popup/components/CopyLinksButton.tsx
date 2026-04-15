import { useEffect, useRef, useState } from 'react';

interface LinkItem {
  title: string;
  url: string;
}

interface CopyLinksButtonProps {
  links: LinkItem[];
  groupName: string;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function copyLinksAsMarkdown(links: LinkItem[]) {
  const markdown = links.map((l) => `- [${l.title}](${l.url})`).join('\n');
  const html = `<ul>${links.map((l) => `<li><a href="${escapeHtml(l.url)}">${escapeHtml(l.title)}</a></li>`).join('')}</ul>`;

  await navigator.clipboard.write([
    new ClipboardItem({
      'text/plain': new Blob([markdown], { type: 'text/plain' }),
      'text/html': new Blob([html], { type: 'text/html' }),
    }),
  ]);
}

export function CopyLinksButton({ links, groupName }: CopyLinksButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleCopy = async () => {
    if (links.length === 0) return;
    try {
      await copyLinksAsMarkdown(links);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard write can fail if popup loses focus
    }
  };

  return (
    <button
      type="button"
      className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 transition-[opacity,color] duration-150 group-hover/header:opacity-100 ${
        copied
          ? 'text-(--color-green) opacity-100'
          : 'text-(--color-grey) opacity-0 hover:text-(--color-blue)'
      }`}
      onClick={handleCopy}
      title={copied ? 'Copied!' : `Copy all links in "${groupName}"`}
    >
      {copied ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          role="img"
          aria-label="Copied"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          role="img"
          aria-label="Copy links"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      )}
    </button>
  );
}
