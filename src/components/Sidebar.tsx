import React from 'react';
import { Session, Speaker } from '../types/schedule';

interface SidebarProps {
  event: Session | null;
  speakers: Speaker[];
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ event, speakers, isSelected, onSelect, onDeselect }) => {
  if (!event) {
    return (
      <div style={{ padding: 24, color: '#888', height: '100vh', overflowY: 'auto' }}>Select an event to see details.</div>
    );
  }
  return (
    <div style={{ padding: 24, height: '100vh', overflowY: 'auto' }}>
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
  );
};

export default Sidebar; 