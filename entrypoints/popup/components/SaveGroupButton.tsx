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
    <form className="save-group-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="prompt-input"
        placeholder="Optional: How should these be grouped?"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={isClassifying}
      />
      <button type="submit" className="btn btn--primary" disabled={isClassifying}>
        {isClassifying ? 'Classifying...' : 'Save & Group'}
      </button>
    </form>
  );
}
