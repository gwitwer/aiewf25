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
            marginBottom: 20,
            width: '100%',
          }}
        >
          {isSelected ? 'Deselect' : 'Select'}
        </button>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>{event.title}</h2>
        <div style={{ marginBottom: 12, color: '#666' }}>{event.description}</div>
        <div style={{ marginBottom: 16 }}>
          <strong>Speakers:</strong>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
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
      </div>
    </div>
  );
};

export default Sidebar; 