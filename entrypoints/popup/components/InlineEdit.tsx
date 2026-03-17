import type React from 'react';
import { useEffect, useRef, useState } from 'react';

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  suffix?: React.ReactNode;
}

export function InlineEdit({ value, onSave, className = '', suffix }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  const commit = () => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setIsEditing(false);
  };

  const cancel = () => {
    cancelledRef.current = true;
    setDraft(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit();
    else if (e.key === 'Escape') cancel();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className={`flex-1 rounded border border-white/20 light:border-black/15 bg-white/10 light:bg-white px-1.5 py-0.5 font-sans text-inherit outline-none focus:border-blue-500 ${className}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <>
      <span className={`min-w-0 flex-1 truncate ${className}`}>{value}</span>
      {suffix}
      <button
        type="button"
        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-inherit opacity-0 transition-opacity duration-150 group-hover/header:opacity-100"
        onClick={() => {
          setDraft(value);
          setIsEditing(true);
        }}
        title={`Rename "${value}"`}
      >
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
          aria-label="Rename"
        >
          <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
          <path d="m15 5 4 4" />
        </svg>
      </button>
    </>
  );
}
