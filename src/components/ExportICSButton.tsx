import React from 'react';
import { createEvents } from 'ics';
import { Session, Room } from '../types/schedule';

interface ExportICSButtonProps {
  sessions: Session[];
  rooms: Room[];
  filename?: string;
}

const ExportICSButton: React.FC<ExportICSButtonProps> = ({ sessions, rooms, filename = 'my-schedule.ics' }) => {
  const handleExport = () => {
    if (!sessions.length) {
      alert('No events to export!');
      return;
    }
    const roomMap = Object.fromEntries(rooms.map(r => [r.id, r.name]));
    const events = sessions.map(session => {
      const start = new Date(session.startsAt);
      const end = new Date(session.endsAt);
      // ics expects [Y, M, D, H, M] (all 5 elements)
      const startArr = [
        start.getFullYear(),
        start.getMonth() + 1,
        start.getDate(),
        start.getHours(),
        start.getMinutes(),
      ];
      const endArr = [
        end.getFullYear(),
        end.getMonth() + 1,
        end.getDate(),
        end.getHours(),
        end.getMinutes(),
      ];
      return {
        start: startArr as [number, number, number, number, number],
        end: endArr as [number, number, number, number, number],
        title: session.title,
        description: session.description || '',
        location: roomMap[session.roomId] || '',
        uid: session.id + '@aiewf',
      };
    });
    createEvents(events, (error, value) => {
      if (error) {
        alert('Error generating calendar file');
        return;
      }
      const blob = new Blob([value], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <button
      onClick={handleExport}
      aria-label="Download My Schedule as ICS"
      style={{
        fontWeight: 600,
        fontSize: 16,
        padding: '6px 10px',
        borderRadius: 6,
        border: '1px solid #1890ff',
        background: '#1890ff',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 36,
        width: 36,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 3V13M10 13L6 9M10 13L14 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="15" width="14" height="2" rx="1" fill="white"/>
      </svg>
    </button>
  );
};

export default ExportICSButton; 