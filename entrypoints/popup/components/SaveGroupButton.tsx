import type React from 'react';
import { useState } from 'react';

interface SaveGroupButtonProps {
  isClassifying: boolean;
  onSave: (prompt?: string) => void;
}

export function SaveGroupButton({ isClassifying, onSave }: SaveGroupButtonProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(prompt.trim() || undefined);
    setPrompt('');
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
      <input
        type="text"
        className="w-full rounded-lg border border-white/20 light:border-black/15 bg-white/5 light:bg-white px-3 py-2.5 font-sans text-[13px] text-inherit outline-none transition-[border-color,background-color] duration-150 placeholder:text-(--color-grey) focus:border-blue-500 light:focus:border-blue-500 focus:bg-white/10"
        placeholder="Optional: How should these be grouped?"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={isClassifying}
      />
      <button
        type="submit"
        className="w-full cursor-pointer rounded-lg border-0 bg-blue-500 px-4 py-2.5 font-sans font-semibold text-sm text-white transition-[opacity,background-color] duration-150 enabled:hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isClassifying}
      >
        {isClassifying ? 'Grouping...' : 'Group Tabs'}
      </button>
    </form>
  );
}
