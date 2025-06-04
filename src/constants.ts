// Calendar time block constants
export const CALENDAR_START_HOUR = 9;
export const CALENDAR_END_HOUR = 18;
export const BLOCKS_PER_HOUR = 12; // 5-minute intervals
export const BLOCKS_PER_30_MIN = 6; // 6 blocks per 30-minute interval
export const TOTAL_BLOCKS = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * BLOCKS_PER_HOUR;
export const TOTAL_ROWS = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * BLOCKS_PER_HOUR;
export const CELL_HEIGHT = 15; // Height of each 5-minute block
export const MOBILE_CELL_HEIGHT = 15; // Height of each 5-minute block on mobile

// Calendar styling constants
export const BASE_BORDER_COLOR = '#eee';
export const ROOM_COLUMN_WIDTH = 200;
export const TIME_COLUMN_WIDTH = 80; 