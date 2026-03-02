import type { TabSession } from '@/lib/types';

interface SessionCardProps {
  session: TabSession;
  onRestore: () => void;
  onDelete: () => void;
}

export function SessionCard({ session, onRestore, onDelete }: SessionCardProps) {
  return (
    <div className="session-card">
      <div className="session-card__meta">
        <span className="session-card__label">{session.label}</span>
        <span className="session-card__count">
          {session.tabs.length} tab{session.tabs.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="session-card__actions">
        <button type="button" className="btn btn--sm btn--primary" onClick={onRestore}>
          Restore
        </button>
        <button type="button" className="btn btn--sm btn--ghost btn--danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
