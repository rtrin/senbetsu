interface SaveGroupButtonProps {
  isWorking: boolean;
  onSave: () => void;
}

export function SaveGroupButton({ isWorking, onSave }: SaveGroupButtonProps) {
  return (
    <button type="button" className="btn btn--primary" onClick={onSave} disabled={isWorking}>
      {isWorking ? 'Organizing…' : 'Save & Group All Tabs'}
    </button>
  );
}
