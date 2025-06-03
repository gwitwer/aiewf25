import React from 'react';
import { normalizeSchedule, buildEventGridPlacements } from '../utils/scheduleUtils';
import { Room, Session, Speaker, EventGridPlacement } from '../types/schedule';

interface CalendarViewProps {
  sessions: Session[];
  rooms: Room[];
  speakers: Speaker[];
  selectedEventIds?: string[];
  activeEventId?: string | null;
  onEventClick?: (id: string) => void;
  hideConflicts?: boolean;
}

function isOverlap(a: Session, b: Session) {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

const startHour = 9;
const endHour = 18;
const blocksPerHour = 6; // 10-min intervals
const blocksPer30Min = 3;
const totalBlocks = (endHour - startHour) * blocksPerHour;
const totalRows = (endHour - startHour) * 2; // 30-min intervals
const cellHeight = 48;
const baseBorderColor = '#ccc';

const CalendarView: React.FC<CalendarViewProps> = ({
  sessions,
  rooms,
  speakers,
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
    <div className="w-full h-full overflow-x-auto pt-6">
      {/* {title && <h2 className="my-4 text-[20px]">{title}</h2>} */}
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: `80px repeat(${rooms.length}, 200px)`,
          gridTemplateRows: `repeat(${totalRows}, ${cellHeight}px)`,
        }}
      >
        {/* Header Row */}
        <div
          className={`bg-[#f8f8f8] font-bold border border-b-0 border-l-0 border-[#ccc] z-20 sticky left-0 flex items-center`}
          style={{ gridColumn: '1 / span 1', gridRow: '1 / span 1' }}
        />
        {rooms.map((room, i) => (
          <div
            key={room.id}
            className={`bg-[#f4f4f4] font-bold border border-b-0 border-l-0 border-[#ccc] text-center z-20 flex items-center justify-center`}
            style={{
              gridColumn: `${i + 2} / span 1`,
              gridRow: '1 / span 1',
              width: 200,
              minWidth: 200,
              maxWidth: 200,
              boxSizing: 'border-box',
              lineHeight: 1.2,
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
              className={`bg-[#fafafa] text-[12px] text-right z-20 sticky left-0 border-t border-r border-[#eee] border-r-[${baseBorderColor}] flex items-center justify-center`}
              style={{
                gridColumn: '1 / span 1',
                gridRow: `${rowIdx + 2} / span 1`,
                backgroundClip: 'padding-box',
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
                    className={`border-t border-r border-[#eee] border-r-[${baseBorderColor}] relative`}
                    style={{
                      gridColumn: `${colIdx + 2} / span 1`,
                      gridRow: `${rowIdx + 2} / span 1`,
                      minHeight: cellHeight,
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
              const isSelected = selectedEventIds.includes(event.session.id);
              const isConflicting = conflictIds.has(event.session.id);
              const isActive = activeEventId === event.session.id;
              // Border color logic
              let borderLeftRightColor = baseBorderColor;
              let borderTopBottomColor = '#eee';
              // Check if this is the only event in the row and has no overlap
              const eventsInRow: { event: EventGridPlacement; colIdx: number }[] = [];
              rooms.forEach((r, cIdx) => {
                for (let b = 0; b < blocksPer30Min; ++b) {
                  const placement = grid[blockStart + b][cIdx];
                  if (placement && placement.startBlock === blockStart + b) {
                    eventsInRow.push({ event: placement, colIdx: cIdx });
                    break;
                  }
                }
              });
              if (
                eventsInRow.length === 1 &&
                !sessions.some(
                  (s) => s.id !== event.session.id && isOverlap(event.session, s)
                )
              ) {
                borderLeftRightColor = 'black';
                borderTopBottomColor = 'black';
              }
              if (isSelected) {
                borderLeftRightColor = '#52c41a';
                borderTopBottomColor = '#52c41a';
              }
              if (isConflicting) {
                borderLeftRightColor = '#ffb3b3';
                borderTopBottomColor = '#ffb3b3';
              }
              if (isActive) {
                borderLeftRightColor = '#1890ff';
                borderTopBottomColor = '#1890ff';
              }

              const borderLeft = borderLeftRightColor === baseBorderColor ? '1px solid transparent' : `1px solid ${borderLeftRightColor}`;
              return (
                <div
                  key={room.id + '-' + rowIdx}
                  className="bg-[#e6f7ff] relative overflow-hidden"
                  style={{
                    gridColumn: `${colIdx + 2} / span 1`,
                    gridRow: `${rowIdx + 2} / span ${Math.ceil(spanBlocks / blocksPer30Min)}`,
                    borderTop: `1px solid ${borderTopBottomColor}`,
                    borderRight: `1px solid ${borderLeftRightColor}`,
                    borderBottom: `1px solid ${borderTopBottomColor}`,
                    borderLeft,
                    width: 200,
                    minWidth: 200,
                    maxWidth: 200,
                    boxSizing: 'border-box',
                    cursor: onEventClick ? 'pointer' : undefined,
                    zIndex: 1,
                  }}
                  onClick={onEventClick ? () => onEventClick(event!.session.id) : undefined}
                  title={isConflicting ? 'Conflicts with another selected event' : isSelected ? 'Selected' : 'Click to select'}
                >
                  <div className="font-medium text-[13px] p-1 overflow-hidden text-ellipsis whitespace-normal break-words">
                    {event.session.title}
                    {Array.isArray(event.session.speakers) && event.session.speakers.length > 0 && (
                      <div className="font-normal text-[12px] text-[#555] mt-1">
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
  );
};

export default CalendarView; 