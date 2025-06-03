import React from 'react';
import { Session, Speaker } from '../types/schedule';

interface SidebarProps {
  event: Session | null;
  speakers: Speaker[];
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onClose?: () => void;
  mobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ event, speakers, isSelected, onSelect, onDeselect, onClose, mobile }) => {
  const sidebarStyle: React.CSSProperties = mobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#fff',
        zIndex: 1000,
        transition: 'transform 0.3s cubic-bezier(.4,0,.2,1), opacity 0.3s cubic-bezier(.4,0,.2,1)',
        boxShadow: '0 0 16px #eee',
        overflowY: 'auto',
      }
    : {
        padding: 24,
        height: '100vh',
        overflowY: 'auto',
        position: 'relative',
      };

  if (!event) {
    return (
      <div style={{ ...sidebarStyle, color: '#888' }}>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'none',
              border: 'none',
              fontSize: 22,
              color: '#888',
              cursor: 'pointer',
              zIndex: 2,
            }}
            aria-label="Close sidebar"
          >
            ×
          </button>
        )}
        Select an event to see details.
      </div>
    );
  }
  return (
    <div style={sidebarStyle}>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            fontSize: 28,
            color: '#888',
            cursor: 'pointer',
            zIndex: 2,
          }}
          aria-label="Close sidebar"
        >
          ×
        </button>
      )}
      <div style={mobile ? { padding: 24, paddingTop: 48 } : {}}>
        <button
          onClick={isSelected ? onDeselect : onSelect}
          style={{
            padding: '8px 20px',
            background: isSelected ? '#fff' : '#1890ff',
            color: isSelected ? '#1890ff' : '#fff',
            border: `2px solid #1890ff`,
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            margin: '20px 0',
            width: '100%',
          }}
        >
          {isSelected ? 'Deselect' : 'Select'}
        </button>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>{event.title}</h2>
        <div style={{ marginBottom: 16, color: '#444', fontWeight: 500 }}>
          {formatTimeRange(event.startsAt, event.endsAt)}
        </div>
        <div style={{ marginBottom: 16 }}>
          <ul style={{ margin: '8px 0', padding: 0, listStyle: 'none' }}>
            {speakers.length === 0 && <li style={{ color: '#aaa' }}>None</li>}
            {speakers.map(speaker => (
              <li key={speaker.id} style={{ marginBottom: 6, display: 'flex', alignItems: 'center' }}>
                {speaker.profilePicture && (
                  <img src={speaker.profilePicture} alt={speaker.fullName} style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 8 }} />
                )}
                <span>{speaker.fullName}</span>
                {speaker.tagLine && <span style={{ color: '#888', marginLeft: 6, fontSize: 12 }}>({speaker.tagLine})</span>}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ marginBottom: 12, color: '#666' }}>{event.description}</div>
      </div>
      {/* Detailed speakers list at the bottom */}
      {speakers.length > 0 && (
        <div style={{ borderTop: '1px solid #eee', marginTop: 24, paddingTop: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10 }}>Bios</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {speakers.map(speaker => (
              <li key={speaker.id} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {speaker.profilePicture && (
                    <img src={speaker.profilePicture} alt={speaker.fullName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', background: '#f3f3f3' }} />
                  )}
                  <span style={{ fontWeight: 500, fontSize: 15 }}>{speaker.fullName}</span>
                </div>
                {speaker.tagLine && (
                  <div style={{ color: '#888', fontSize: 13, margin: '4px 0 0 0', fontStyle: 'italic' }}>{speaker.tagLine}</div>
                )}
                {speaker.bio && (
                  <div style={{ color: '#555', fontSize: 13, marginTop: 4, whiteSpace: 'pre-line' }}>{speaker.bio}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

function formatTimeRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  return `${formatTime(start)} - ${formatTime(end)}`;
}

function formatTime(date: Date) {
  let h = date.getHours();
  const m = date.getMinutes();
  const ampm = h < 12 ? 'am' : 'pm';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
} 