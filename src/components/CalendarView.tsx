import React from 'react';
import { normalizeSchedule, buildEventGridPlacements } from '../utils/scheduleUtils';
import { Room, Session, Speaker, EventGridPlacement } from '../types/schedule';

interface CalendarViewProps {
  sessions: Session[];
  rooms: Room[];
  speakers: Speaker[];
  title?: string;
  selectedEventIds?: string[];
  activeEventId?: string | null;
  onEventClick?: (id: string) => void;
  hideConflicts?: boolean;
}

function isOverlap(a: Session, b: Session) {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

const startHour = 9;
const endHour = 19;
const blocksPerHour = 6; // 10-min intervals
const blocksPer30Min = 3;
const totalBlocks = (endHour - startHour) * blocksPerHour;
const totalRows = (endHour - startHour) * 2; // 30-min intervals

const CalendarView: React.FC<CalendarViewProps> = ({
  sessions,
  rooms,
  speakers,
  title,
  selectedEventIds = [],
  activeEventId = null,
  onEventClick,
  hideConflicts = false,
}) => {
  const normalized = normalizeSchedule({ sessions, rooms, speakers });
  const { speakerMap } = normalized;
  const { timeBlocks, eventPlacements } = buildEventGridPlacements(sessions, rooms);

  // Find conflicts
  let conflictIds = new Set<string>();
  if (!hideConflicts) {
    const selectedSessions = sessions.filter(s => selectedEventIds.includes(s.id));
    for (let i = 0; i < selectedSessions.length; ++i) {
      for (let j = i + 1; j < selectedSessions.length; ++j) {
        if (isOverlap(selectedSessions[i], selectedSessions[j])) {
          conflictIds.add(selectedSessions[i].id);
          conflictIds.add(selectedSessions[j].id);
        }
      }
    }
  }

  // Build a 2D array for event placement: [block][room]
  const grid: (null | EventGridPlacement)[][] = Array.from({ length: totalBlocks }, () => Array(rooms.length).fill(null));
  eventPlacements.forEach(placement => {
    for (let b = placement.startBlock; b < placement.endBlock; ++b) {
      grid[b][placement.roomIndex] = placement;
    }
  });

  // Helper to get time label for each 30-min interval
  function getTimeLabel(rowIdx: number) {
    const blockIdx = rowIdx * blocksPer30Min;
    const block = timeBlocks[blockIdx];
    if (!block) return '';
    const hour = block.hour % 12 === 0 ? 12 : block.hour % 12;
    const ampm = block.hour < 12 ? 'am' : 'pm';
    return `${hour}:${block.minute.toString().padStart(2, '0')} ${ampm}`;
  }

  return (
    <div style={{ marginBottom: 40 }}>
      {title && <h2 style={{ margin: '16px 0', fontSize: 20 }}>{title}</h2>}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `80px repeat(${rooms.length}, 200px)`,
            gridTemplateRows: `repeat(${totalRows}, 40px)`,
            border: '1px solid #ccc',
            position: 'relative',
            minWidth: 80 + rooms.length * 200,
          }}
        >
          {/* Header Row */}
          <div style={{ gridColumn: '1 / span 1', gridRow: '1 / span 1', background: '#f8f8f8', fontWeight: 'bold', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc', zIndex: 2 }} />
          {rooms.map((room, i) => (
            <div
              key={room.id}
              style={{
                gridColumn: `${i + 2} / span 1`,
                gridRow: '1 / span 1',
                background: '#f8f8f8',
                fontWeight: 'bold',
                borderRight: '1px solid #ccc',
                borderBottom: '1px solid #ccc',
                textAlign: 'center',
                zIndex: 2,
                width: 200,
                minWidth: 200,
                maxWidth: 200,
                boxSizing: 'border-box',
              }}
            >
              {room.name}
            </div>
          ))}
          {/* Time labels and grid cells */}
          {Array.from({ length: totalRows }).map((_, rowIdx) => (
            <React.Fragment key={rowIdx}>
              {/* Time label */}
              <div
                style={{
                  gridColumn: '1 / span 1',
                  gridRow: `${rowIdx + 2} / span 1`,
                  borderTop: '1px solid #eee',
                  borderRight: '1px solid #ccc',
                  background: '#fafafa',
                  fontSize: 12,
                  textAlign: 'right',
                  paddingRight: 8,
                  zIndex: 1,
                }}
              >
                {getTimeLabel(rowIdx)}
              </div>
              {/* Room columns for this 30-min row (3 blocks per row) */}
              {rooms.map((room, colIdx) => {
                // For each 30-min row, check if an event starts in any of its 3 blocks
                const blockStart = rowIdx * blocksPer30Min;
                let event: EventGridPlacement | null = null;
                let eventBlockIdx = -1;
                for (let b = 0; b < blocksPer30Min; ++b) {
                  const placement = grid[blockStart + b][colIdx];
                  if (placement && placement.startBlock === blockStart + b) {
                    event = placement;
                    eventBlockIdx = blockStart + b;
                    break;
                  }
                }
                if (!event) {
                  // Empty cell
                  return (
                    <div
                      key={room.id + '-' + rowIdx}
                      style={{
                        gridColumn: `${colIdx + 2} / span 1`,
                        gridRow: `${rowIdx + 2} / span 1`,
                        borderTop: '1px solid #eee',
                        borderRight: '1px solid #ccc',
                        position: 'relative',
                        width: 200,
                        minWidth: 200,
                        maxWidth: 200,
                        boxSizing: 'border-box',
                      }}
                    />
                  );
                }
                // Only render the event once, spanning the correct number of blocks
                const spanBlocks = event.endBlock - event.startBlock;
                const spanRows = Math.ceil(spanBlocks / blocksPer30Min * 1); // in 30-min rows
                const isSelected = selectedEventIds.includes(event.session.id);
                const isConflicting = conflictIds.has(event.session.id);
                const isActive = activeEventId === event.session.id;
                let borderColor = '#e6f7ff';
                if (isActive) borderColor = '#52c41a';
                else if (isConflicting) borderColor = '#ffb3b3';
                else if (isSelected) borderColor = '#1890ff';
                const isHighlighted = isSelected || isConflicting || isActive;
                return (
                  <div
                    key={room.id + '-' + rowIdx}
                    style={{
                      gridColumn: `${colIdx + 2} / span 1`,
                      gridRow: `${rowIdx + 2} / span ${Math.ceil(spanBlocks / blocksPer30Min)}`,
                      borderTop: isHighlighted ? `1px solid ${borderColor}` : '1px solid #eee',
                      borderRight: isHighlighted ? `1px solid ${borderColor}` : '1px solid #ccc',
                      borderBottom: isHighlighted ? `1px solid ${borderColor}` : '1px solid #eee',
                      borderLeft: isHighlighted ? `1px solid ${borderColor}` : '1px solid #ccc',
                      background: '#e6f7ff',
                      position: 'relative',
                      cursor: onEventClick ? 'pointer' : undefined,
                      zIndex: 1,
                      width: 200,
                      minWidth: 200,
                      maxWidth: 200,
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                    }}
                    onClick={onEventClick ? () => onEventClick(event!.session.id) : undefined}
                    title={isConflicting ? 'Conflicts with another selected event' : isSelected ? 'Selected' : 'Click to select'}
                  >
                    <div style={{ fontWeight: 500, fontSize: 13, padding: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {event.session.title}
                      {Array.isArray(event.session.speakers) && event.session.speakers.length > 0 && (
                        <div style={{ fontWeight: 400, fontSize: 12, color: '#555', marginTop: 2 }}>
                          {event.session.speakers
                            .map((id: string) => speakerMap[id]?.fullName)
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarView; 