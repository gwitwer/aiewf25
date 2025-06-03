'use client';
import React, { useState, useEffect } from "react";
import CalendarView from "@/src/components/CalendarView";
import Sidebar from "@/src/components/Sidebar";
import scheduleData from "../app/schedule.json";
import { getScheduleForDay } from "@/src/utils/scheduleUtils";
import { Session, Speaker } from "@/src/types/schedule";
import { useIsMobile } from "@/src/utils/useIsMobile";
import ExportICSButton from "@/src/components/ExportICSButton";

const days = [
  { date: "2025-06-03", label: "Tuesday, June 3, 2025" },
  { date: "2025-06-04", label: "Wednesday, June 4, 2025" },
  { date: "2025-06-05", label: "Thursday, June 5, 2025" },
];

function isValidRemoteSchedule(data: any) {
  return (
    data &&
    Array.isArray(data.sessions) &&
    Array.isArray(data.rooms) &&
    Array.isArray(data.speakers)
  );
}

export default function Home() {
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(days[0].date);
  const [view, setView] = useState<'full' | 'my'>('full');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scheduleSource, setScheduleSource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  // Fetch remote schedule on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('https://sessionize.com/api/v2/w3hd2z8a/view/All')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(remoteData => {
        // Try to normalize remoteData to {sessions, rooms, speakers}
        // Sessionize format: sessions in sessions, rooms in rooms, speakers in speakers
        if (isValidRemoteSchedule(remoteData)) {
          if (!cancelled) {
            setScheduleSource(remoteData);
            setLoading(false);
          }
        } else {
          throw new Error('Remote data missing expected fields');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setScheduleSource(scheduleData);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

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

  // Open sidebar when an event is selected
  useEffect(() => {
    if (activeEventId) setSidebarOpen(true);
  }, [activeEventId]);

  // Compute allDayData and dayData from loaded scheduleSource
  const allDayData = React.useMemo(() => {
    if (!scheduleSource) return [];
    return days.map(day => ({
      ...day,
      ...getScheduleForDay(scheduleSource, day.date),
    }));
  }, [scheduleSource]);

  const dayData = allDayData.find(d => d.date === selectedDay)!;

  // Filter for My Schedule view
  const mySessions = dayData?.sessions?.filter(s => selectedEventIds.includes(s.id)) || [];
  const myRoomIds = Array.from(new Set(mySessions.map(s => s.roomId)));
  const myRooms = dayData?.rooms?.filter(r => myRoomIds.includes(r.id)) || [];

  // Find the active event and speakers for the selected day
  const activeEvent: Session | null = dayData?.sessions?.find(s => s.id === activeEventId) || null;
  const activeSpeakers: Speaker[] = activeEvent
    ? (activeEvent.speakers || []).map((id: string) => dayData.speakers.find((s: Speaker) => s.id === id)).filter(Boolean) as Speaker[]
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
    setSidebarOpen(false);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setActiveEventId(null);
  };

  // Sidebar width
  const SIDEBAR_WIDTH = 350;

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 20 }}>Loading schedule from ai.engineer…</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: '#f9f9f9',
          display: isMobile && sidebarOpen && activeEvent ? 'none' : 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          height: '100vh',
          transition: 'width 0.3s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* Header controls */}
        {isMobile ? (
          <>
            <div style={{ display: 'flex', gap: 8, padding: '16px 16px 0 16px', justifyContent: 'center' }}>
              <button
                onClick={() => setView('full')}
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                  padding: '6px 18px',
                  borderRadius: 6,
                  border: view === 'full' ? '1px solid #1890ff' : '1px solid #ccc',
                  background: view === 'full' ? '#1890ff' : '#fff',
                  color: view === 'full' ? '#fff' : '#222',
                  cursor: 'pointer',
                  flex: 1,
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
                  border: view === 'my' ? '1px solid #1890ff' : '1px solid #ccc',
                  background: view === 'my' ? '#1890ff' : '#fff',
                  color: view === 'my' ? '#fff' : '#222',
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                My Schedule
              </button>
              <ExportICSButton sessions={mySessions} rooms={myRooms} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 16px 16px' }}>
              <select
                id="day-select"
                value={selectedDay}
                onChange={handleDayChange}
                style={{ fontSize: 16, padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', width: '100%' }}
              >
                {days.map(day => (
                  <option key={day.date} value={day.date}>{day.label}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div style={{ padding: 24, paddingBottom: 0, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setView('full')}
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                  padding: '6px 18px',
                  borderRadius: 6,
                  border: view === 'full' ? '1px solid #1890ff' : '1px solid #ccc',
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
                  border: view === 'my' ? '1px solid #1890ff' : '1px solid #ccc',
                  background: view === 'my' ? '#1890ff' : '#fff',
                  color: view === 'my' ? '#fff' : '#222',
                  cursor: 'pointer',
                }}
              >
                My Schedule
              </button>
              <div style={{ marginLeft: 8 }}>
                <ExportICSButton sessions={mySessions} rooms={myRooms} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
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
        )}
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
      {/* Desktop sidebar */}
      {!isMobile && (
        <div
          style={{
            width: sidebarOpen && activeEvent ? SIDEBAR_WIDTH : 0,
            minWidth: sidebarOpen && activeEvent ? SIDEBAR_WIDTH : 0,
            maxWidth: sidebarOpen && activeEvent ? SIDEBAR_WIDTH : 0,
            borderLeft: '1px solid #eee',
            background: '#fff',
            minHeight: '100vh',
            boxShadow: '0 0 8px #eee',
            position: 'relative',
            transition: 'width 0.3s cubic-bezier(.4,0,.2,1)',
            zIndex: 10,
            overflow: 'hidden',
          }}
        >
          {sidebarOpen && activeEvent && (
            <Sidebar
              event={activeEvent}
              speakers={activeSpeakers}
              isSelected={isSelected}
              onSelect={handleSelect}
              onDeselect={handleDeselect}
              onClose={handleCloseSidebar}
            />
          )}
        </div>
      )}
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && activeEvent && (
        <Sidebar
          event={activeEvent}
          speakers={activeSpeakers}
          isSelected={isSelected}
          onSelect={handleSelect}
          onDeselect={handleDeselect}
          onClose={handleCloseSidebar}
          mobile
        />
      )}
    </div>
  );
}
