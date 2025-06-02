import { Room, Session, NormalizedSchedule, Speaker, TimeBlock, EventGridPlacement } from '../types/schedule';

export function normalizeSchedule(data: { sessions: Session[]; rooms: Room[]; speakers: Speaker[] }): NormalizedSchedule {
  const { sessions, rooms, speakers } = data;
  // Build room map
  const roomMap: Record<number, Room> = {};
  rooms.forEach(room => {
    roomMap[room.id] = room;
  });
  // Sessions by room
  const sessionsByRoom: Record<number, Session[]> = {};
  rooms.forEach(room => {
    sessionsByRoom[room.id] = [];
  });
  sessions.forEach(session => {
    if (sessionsByRoom[session.roomId]) {
      sessionsByRoom[session.roomId].push(session);
    }
  });
  // Unique, sorted time slots
  const timeSet = new Set<string>();
  sessions.forEach(session => {
    timeSet.add(session.startsAt);
    timeSet.add(session.endsAt);
  });
  const timeSlots = Array.from(timeSet).sort();
  // Speaker map
  const speakerMap: Record<string, Speaker> = {};
  speakers.forEach(speaker => {
    speakerMap[speaker.id] = speaker;
  });
  return {
    rooms: rooms.slice().sort((a, b) => a.sort - b.sort),
    sessions,
    timeSlots,
    roomMap,
    sessionsByRoom,
    speakerMap,
  };
}

export function getScheduleForDay(
  data: { sessions: Session[]; rooms: Room[]; speakers: Speaker[] },
  date: string
) {
  // Filter sessions for the given day
  const sessions = data.sessions.filter(session => session.startsAt.startsWith(date));
  // Only include rooms that have at least one session on that day
  const roomIds = Array.from(new Set(sessions.map(s => s.roomId)));
  const rooms = data.rooms.filter(room => roomIds.includes(room.id));
  return { sessions, rooms, speakers: data.speakers };
}

export function buildEventGridPlacements(sessions: Session[], rooms: Room[]) {
  // Build time blocks: 9:00am to 7:00pm, 10-min intervals
  const startHour = 9;
  const endHour = 19;
  const timeBlocks: TimeBlock[] = [];
  let idx = 0;
  for (let hour = startHour; hour < endHour; ++hour) {
    for (let min = 0; min < 60; min += 10) {
      timeBlocks.push({
        label: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
        hour,
        minute: min,
        index: idx++
      });
    }
  }
  // Map roomId to column index
  const roomIdToIndex: Record<number, number> = {};
  rooms.forEach((room, i) => {
    roomIdToIndex[room.id] = i;
  });
  // For each session, compute startBlock and endBlock
  function timeToBlockIndex(dateStr: string) {
    const d = new Date(dateStr);
    const hour = d.getHours();
    const min = d.getMinutes();
    return (hour - startHour) * 6 + Math.floor(min / 10);
  }
  const eventPlacements: EventGridPlacement[] = sessions.map(session => {
    const startBlock = timeToBlockIndex(session.startsAt);
    const endBlock = timeToBlockIndex(session.endsAt);
    return {
      session,
      roomIndex: roomIdToIndex[session.roomId],
      startBlock,
      endBlock,
    };
  });
  return { timeBlocks, eventPlacements };
} 