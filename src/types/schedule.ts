export interface Room {
  id: number;
  name: string;
  sort: number;
}

export interface Session {
  id: string;
  title: string;
  description: string | null;
  startsAt: string; // ISO string
  endsAt: string;   // ISO string
  roomId: number;
  speakers: string[];
  // ...other fields as needed
}

export interface Speaker {
  id: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  tagLine: string | null;
  profilePicture: string | null;
  isTopSpeaker: boolean;
  links: any[];
  sessions: (string | number)[];
  fullName: string;
  categoryItems: any[];
  questionAnswers: any[];
}

export interface NormalizedSchedule {
  rooms: Room[];
  sessions: Session[];
  timeSlots: string[]; // ISO strings, sorted
  roomMap: Record<number, Room>;
  sessionsByRoom: Record<number, Session[]>;
  speakerMap: Record<string, Speaker>;
}

export interface TimeBlock {
  label: string; // e.g. '09:00', '09:10', ...
  hour: number;
  minute: number;
  index: number; // 0 = 9:00am, 1 = 9:10am, ...
}

export interface EventGridPlacement {
  session: Session;
  roomIndex: number; // column index
  startBlock: number; // index of 10-min block from 9:00am
  endBlock: number;   // exclusive
} 