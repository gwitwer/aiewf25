'use client';
import React, { useState, useEffect } from "react";
import CalendarView from "@/src/components/CalendarView";
import Sidebar from "@/src/components/Sidebar";
import scheduleData from "../app/schedule.json";
import { getScheduleForDay } from "@/src/utils/scheduleUtils";
import { Session, Speaker } from "@/src/types/schedule";

const days = [
  { date: "2025-06-03", label: "Tuesday, June 3, 2025" },
  { date: "2025-06-04", label: "Wednesday, June 4, 2025" },
  { date: "2025-06-05", label: "Thursday, June 5, 2025" },
];

// Precompute all day data
const allDayData = days.map(day => ({
  ...day,
  ...getScheduleForDay(scheduleData, day.date),
}));

export default function Home() {
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(days[0].date);
  const [view, setView] = useState<'full' | 'my'>('full');

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('selectedEventIds');
    if (stored) {
      try {
        setSelectedEventIds(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Save to localStorage when selectedEventIds changes
  useEffect(() => {
    localStorage.setItem('selectedEventIds', JSON.stringify(selectedEventIds));
  }, [selectedEventIds]);

  const dayData = allDayData.find(d => d.date === selectedDay)!;

  // Filter for My Schedule view
  const mySessions = dayData.sessions.filter(s => selectedEventIds.includes(s.id));
  const myRoomIds = Array.from(new Set(mySessions.map(s => s.roomId)));
  const myRooms = dayData.rooms.filter(r => myRoomIds.includes(r.id));

  // Find the active event and speakers for the selected day
  const activeEvent: Session | null = dayData.sessions.find(s => s.id === activeEventId) || null;
  const activeSpeakers: Speaker[] = activeEvent
    ? (activeEvent.speakers || []).map((id: string) => dayData.speakers.find(s => s.id === id)).filter(Boolean) as Speaker[]
    : [];
  const isSelected = !!(activeEvent && selectedEventIds.includes(activeEvent.id));

  const handleSelect = () => {
    if (activeEvent && !isSelected) setSelectedEventIds(prev => [...prev, activeEvent.id]);
  };
  const handleDeselect = () => {
    if (activeEvent && isSelected) setSelectedEventIds(prev => prev.filter(eid => eid !== activeEvent.id));
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDay(e.target.value);
    setActiveEventId(null);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <div style={{ flex: 1, minWidth: 0, background: '#f9f9f9', display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100vh' }}>
        <div style={{ padding: 24, paddingBottom: 0, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div>
            <button
              onClick={() => setView('full')}
              style={{
                fontWeight: 600,
                fontSize: 16,
                padding: '6px 18px',
                borderRadius: 6,
                border: view === 'full' ? '2px solid #1890ff' : '1px solid #ccc',
                background: view === 'full' ? '#1890ff' : '#fff',
                color: view === 'full' ? '#fff' : '#222',
                marginRight: 8,
                cursor: 'pointer',
              }}
            >
              Full Schedule
            </button>
            <button
              onClick={() => setView('my')}
              style={{
                fontWeight: 600,
                fontSize: 16,
                padding: '6px 18px',
                borderRadius: 6,
                border: view === 'my' ? '2px solid #1890ff' : '1px solid #ccc',
                background: view === 'my' ? '#1890ff' : '#fff',
                color: view === 'my' ? '#fff' : '#222',
                cursor: 'pointer',
              }}
            >
              My Schedule
            </button>
          </div>
          <div>
            <label htmlFor="day-select" style={{ fontWeight: 600, marginRight: 12 }}>Day:</label>
            <select
              id="day-select"
              value={selectedDay}
              onChange={handleDayChange}
              style={{ fontSize: 16, padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc' }}
            >
              {days.map(day => (
                <option key={day.date} value={day.date}>{day.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, overflowX: 'auto', width: '100%' }}>
          {view === 'full' ? (
            <CalendarView
              sessions={dayData.sessions}
              rooms={dayData.rooms}
              speakers={dayData.speakers}
              title={dayData.label}
              selectedEventIds={selectedEventIds}
              activeEventId={activeEventId}
              onEventClick={setActiveEventId}
            />
          ) : (
            <CalendarView
              sessions={mySessions}
              rooms={myRooms}
              speakers={dayData.speakers}
              title={dayData.label + ' — My Schedule'}
              selectedEventIds={selectedEventIds}
              activeEventId={activeEventId}
              onEventClick={setActiveEventId}
              hideConflicts={true}
            />
          )}
        </div>
      </div>
      <div style={{ width: 350, borderLeft: '1px solid #eee', background: '#fff', minHeight: '100vh', boxShadow: '0 0 8px #eee' }}>
        <Sidebar
          event={activeEvent}
          speakers={activeSpeakers}
          isSelected={isSelected}
          onSelect={handleSelect}
          onDeselect={handleDeselect}
        />
      </div>
    </div>
  );
}
