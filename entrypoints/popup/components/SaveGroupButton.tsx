import type React from 'react';
import { useState } from 'react';

interface SaveGroupButtonProps {
  isClassifying: boolean;
  onSave: (prompt?: string) => void;
}

export function SaveGroupButton({ isClassifying, onSave }: SaveGroupButtonProps) {
  const [prompt, setPrompt] = useState('');

  const handleSave = () => {
    onSave(prompt.trim() !== '' ? prompt : undefined);
    setPrompt(''); // clear after save
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isClassifying) {
      handleSave();
    }
  };

  return (
    <div className="save-group-container">
      <input
        type="text"
        className="prompt-input"
        placeholder="Optional: How should we group these tabs?"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isClassifying}
        maxLength={100}
      />
      <button
        type="button"
        className="btn btn--primary"
        onClick={handleSave}
        disabled={isClassifying}
      >
        {isClassifying ? 'Organizing Tabs...' : 'Save & Group Tabs'}
      </button>
    </div>
  );
}
