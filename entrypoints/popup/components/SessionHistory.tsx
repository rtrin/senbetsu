import type { TabSession } from '@/lib/types';
import { SessionCard } from './SessionCard';

interface SessionHistoryProps {
  sessions: TabSession[];
  onRestore: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

export function SessionHistory({ sessions, onRestore, onDelete }: SessionHistoryProps) {
  return (
    <section>
      <h2 className="section-title">Saved Sessions</h2>
      {sessions.length === 0 ? (
        <p className="session-history__empty">No saved sessions yet.</p>
      ) : (
        sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onRestore={() => onRestore(session.id)}
            onDelete={() => onDelete(session.id)}
          />
        ))
      )}
    </section>
  );
}
