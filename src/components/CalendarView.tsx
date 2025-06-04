import React, { useEffect, useState } from 'react';
import { normalizeSchedule, buildEventGridPlacements } from '../utils/scheduleUtils';
import { Room, Session, Speaker, EventGridPlacement } from '../types/schedule';
import {
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  BLOCKS_PER_HOUR,
  BLOCKS_PER_30_MIN,
  TOTAL_BLOCKS,
  TOTAL_ROWS,
  CELL_HEIGHT,
  MOBILE_CELL_HEIGHT,
  BASE_BORDER_COLOR,
  ROOM_COLUMN_WIDTH,
  TIME_COLUMN_WIDTH,
} from '../constants';

interface CalendarViewProps {
  sessions: Session[];
  rooms: Room[];
  speakers: Speaker[];
  selectedEventIds?: string[];
  activeEventId?: string | null;
  onEventClick?: (id: string) => void;
  hideConflicts?: boolean;
  selectedDate?: Date;
}

function isOverlap(a: Session, b: Session) {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  sessions,
  rooms,
  speakers,
  selectedEventIds = [],
  activeEventId = null,
  onEventClick,
  hideConflicts = false,
  selectedDate,
}) => {
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null);
  const [minuteOffsetRemainder, setMinuteOffsetRemainder] = useState<number>(0);

  const normalized = normalizeSchedule({ sessions, rooms, speakers });
  const { speakerMap } = normalized;
  const { timeBlocks, eventPlacements } = buildEventGridPlacements(sessions, rooms);

  // Calculate total table width
  const totalTableWidth = TIME_COLUMN_WIDTH + (rooms.length * ROOM_COLUMN_WIDTH);

  // Update current time position every minute
  useEffect(() => {
    const updateCurrentTime = () => {
      if (!selectedDate) {
        setCurrentTimePosition(null);
        return;
      }

      const now = new Date();
      // Compare year, month, and day separately to avoid timezone issues
      const isToday = 
        now.getFullYear() === selectedDate.getFullYear() &&
        now.getMonth() === selectedDate.getMonth() &&
        now.getDate() === selectedDate.getDate();

      if (!isToday) {
        setCurrentTimePosition(null);
        return;
      }

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Calculate position based on current time
      const hourOffset = currentHour - CALENDAR_START_HOUR;
      if (hourOffset < 0) {
        setCurrentTimePosition(null);
        return;
      }

      // Calculate exact position in 5-minute blocks
      const minuteOffset = Math.floor(currentMinute / 5); // Round down to nearest 5 minutes
      setMinuteOffsetRemainder(currentMinute % 5);
      const totalOffset = (hourOffset * BLOCKS_PER_HOUR) + minuteOffset;
      
      setCurrentTimePosition(totalOffset);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [selectedDate]);

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
  const grid: (null | EventGridPlacement)[][] = Array.from({ length: TOTAL_BLOCKS }, () => Array(rooms.length).fill(null));
  eventPlacements.forEach(placement => {
    for (let b = placement.startBlock; b < placement.endBlock; ++b) {
      grid[b][placement.roomIndex] = placement;
    }
  });

  // Helper to get time label for each 30-min interval
  function getTimeLabel(rowIdx: number) {
    // Only show labels at 30-minute intervals
    if (rowIdx % BLOCKS_PER_30_MIN !== 0) return '';
    
    const blockIdx = rowIdx;
    const block = timeBlocks[blockIdx];
    if (!block) return '';
    const hour = block.hour % 12 === 0 ? 12 : block.hour % 12;
    const ampm = block.hour < 12 ? 'am' : 'pm';
    return `${hour}:${block.minute.toString().padStart(2, '0')} ${ampm}`;
  }

  // Helper to determine if a row should have a border
  function shouldHaveBorder(rowIdx: number) {
    return rowIdx % BLOCKS_PER_30_MIN === 0;
  }

  // Helper to determine if this is a time label row
  function isTimeLabelRow(rowIdx: number) {
    return rowIdx % BLOCKS_PER_30_MIN === 0;
  }

  // Helper to determine if a session should have a bottom border
  function sessionShouldHaveBorderBottom(rowIdx: number, roomIdx: number, isSpecial: boolean) {
    // Check if there's a session starting in the next block in the same room
    const nextBlockPlacement = grid[rowIdx + 1]?.[roomIdx];
    return !nextBlockPlacement || nextBlockPlacement.startBlock !== rowIdx + 1 || isSpecial;
  }

  return (
    <div className="w-full h-full overflow-x-auto pt-6">
      {/* {title && <h2 className="my-4 text-[20px]">{title}</h2>} */}
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(${rooms.length}, ${ROOM_COLUMN_WIDTH}px)`,
          gridTemplateRows: `${CELL_HEIGHT * 4}px repeat(${TOTAL_ROWS}, ${CELL_HEIGHT}px)`,
        }}
      >
        {/* Current time indicator */}
        {currentTimePosition !== null && (
          <div
            className="absolute left-0 right-0 z-50 pointer-events-none"
            style={{
              top: `${(currentTimePosition + 4 + minuteOffsetRemainder / 5) * CELL_HEIGHT}px`, // +4 to account for header row (which is 4 blocks tall)
              height: '2px',
              background: 'rgba(255, 0, 0, 0.33)',
              width: `${totalTableWidth}px`,
            }}
          >
          </div>
        )}
        {/* Header Row */}
        <div
          className={`bg-[#f8f8f8] font-bold border border-b-0 border-l-0 border-[${BASE_BORDER_COLOR}] z-20 sticky left-0 flex items-center`}
          style={{ 
            gridColumn: '1 / span 1', 
            gridRow: '1 / span 2',
            borderColor: BASE_BORDER_COLOR,
          }}
        />
        {rooms.map((room, i) => (
          <div
            key={room.id}
            className={`bg-[#f4f4f4] font-bold border border-b-0 border-l-0 border-[${BASE_BORDER_COLOR}] text-center z-20 flex items-center justify-center`}
            style={{
              gridColumn: `${i + 2} / span 1`,
              gridRow: '1 / span 1',
              width: ROOM_COLUMN_WIDTH,
              minWidth: ROOM_COLUMN_WIDTH,
              maxWidth: ROOM_COLUMN_WIDTH,
              boxSizing: 'border-box',
              lineHeight: 1.25,
              borderColor: BASE_BORDER_COLOR,
            }}
          >
            {room.name}
          </div>
        ))}
        {/* Time labels and grid cells */}
        {Array.from({ length: TOTAL_ROWS }).map((_, rowIdx) => (
          <React.Fragment key={rowIdx}>
            {/* Time label - spans 6 blocks (30 minutes) */}
            {isTimeLabelRow(rowIdx) ? (
              <div
                className={`bg-[#fafafa] text-[12px] text-right z-20 sticky left-0 flex items-center justify-center`}
                style={{
                  gridColumn: '1 / span 1',
                  gridRow: `${rowIdx + 2} / span ${BLOCKS_PER_30_MIN}`,
                  backgroundClip: 'padding-box',
                  borderTop: `1px solid ${BASE_BORDER_COLOR}`,
                  borderRight: `1px solid ${BASE_BORDER_COLOR}`,
                  borderBottom: `1px solid ${BASE_BORDER_COLOR}`,
                }}
              >
                {getTimeLabel(rowIdx)}
              </div>
            ) : (
              <div
                className="bg-[#fafafa]"
                style={{
                  gridColumn: '1 / span 1',
                  gridRow: `${rowIdx + 2} / span 1`,
                  borderRight: `1px solid ${BASE_BORDER_COLOR}`,
                }}
              />
            )}
            {/* Room columns for this 5-min row */}
            {rooms.map((room, colIdx) => {
              const blockStart = rowIdx;
              let event: EventGridPlacement | null = null;
              let eventBlockIdx = -1;
              
              const placement = grid[blockStart][colIdx];
              if (placement && placement.startBlock === blockStart) {
                event = placement;
                eventBlockIdx = blockStart;
              }

              if (!event) {
                // Empty cell
                return (
                  <div
                    key={room.id + '-' + rowIdx}
                    className="relative"
                    style={{
                      gridColumn: `${colIdx + 2} / span 1`,
                      gridRow: `${rowIdx + 2} / span 1`,
                      minHeight: CELL_HEIGHT,
                      width: ROOM_COLUMN_WIDTH,
                      minWidth: ROOM_COLUMN_WIDTH,
                      maxWidth: ROOM_COLUMN_WIDTH,
                      boxSizing: 'border-box',
                      borderTop: shouldHaveBorder(rowIdx) ? `1px solid ${BASE_BORDER_COLOR}` : 'none',
                      borderRight: `1px solid ${BASE_BORDER_COLOR}`,
                      // borderBottom: shouldHaveBorder(rowIdx + 1) ? `1px solid ${BASE_BORDER_COLOR}` : 'none',
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
              let borderLeftRightColor = BASE_BORDER_COLOR;
              let borderTopBottomColor = BASE_BORDER_COLOR;

              // Check if this is the only event in the row and has no overlap
              const eventsInRow: { event: EventGridPlacement; colIdx: number }[] = [];
              rooms.forEach((r, cIdx) => {
                const placement = grid[blockStart][cIdx];
                if (placement && placement.startBlock === blockStart) {
                  eventsInRow.push({ event: placement, colIdx: cIdx });
                }
              });

              if (
                eventsInRow.length === 1 &&
                !sessions.some(
                  (s) => s.id !== event.session.id && isOverlap(event.session, s)
                )
              ) {
                borderLeftRightColor = '#888';
                borderTopBottomColor = '#888';
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

              const isSpecial = borderTopBottomColor !== BASE_BORDER_COLOR;

              const borderLeft = borderLeftRightColor === BASE_BORDER_COLOR ? '1px solid transparent' : `1px solid ${borderLeftRightColor}`;
              return (
                <div
                  key={room.id + '-' + rowIdx}
                  className="bg-[#e6f7ff] relative overflow-hidden"
                  style={{
                    gridColumn: `${colIdx + 2} / span 1`,
                    gridRow: `${rowIdx + 2} / span ${spanBlocks}`,
                    borderTop: `1px solid ${borderTopBottomColor}`,
                    borderRight: `1px solid ${borderLeftRightColor}`,
                    borderBottom: sessionShouldHaveBorderBottom(rowIdx + spanBlocks - 1, colIdx, isSpecial) ? `1px solid ${borderTopBottomColor}` : 'none',
                    borderLeft,
                    width: ROOM_COLUMN_WIDTH,
                    minWidth: ROOM_COLUMN_WIDTH,
                    maxWidth: ROOM_COLUMN_WIDTH,
                    boxSizing: 'border-box',
                    cursor: onEventClick ? 'pointer' : undefined,
                    zIndex: 1,
                    lineHeight: 1.33,
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