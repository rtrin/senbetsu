import type React from 'react';
import { useEffect, useRef, useState } from 'react';

interface NoteEditProps {
  value: string;
  onSave: (text: string) => void;
}

export function NoteEdit({ value, onSave }: NoteEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  const commit = () => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    onSave(draft);
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
        className="mb-0.5 ml-2 w-[calc(100%-8px)] rounded border border-white/20 light:border-black/15 bg-white/10 light:bg-white px-2 py-0.5 font-sans text-[11px] text-(--color-grey) outline-none focus:border-blue-500"
        value={draft}
        placeholder="Add note..."
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    );
  }

  if (value) {
    return (
      <button
        type="button"
        className="mb-0.5 ml-2 cursor-text truncate border-0 bg-transparent px-2 text-left font-sans text-[11px] text-(--color-grey) italic"
        onClick={() => {
          setDraft(value);
          setIsEditing(true);
        }}
      >
        {value}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="mb-0.5 ml-2 cursor-text truncate border-0 bg-transparent px-2 text-left font-sans text-[11px] text-(--color-grey)/50 italic"
      onClick={() => {
        setDraft('');
        setIsEditing(true);
      }}
    >
      Add note here...
    </button>
  );
}
