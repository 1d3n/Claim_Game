import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { ClaimStatus } from '../claimers/types.js';

export interface ClaimedGameRecord {
  id: string; // e.g. "epic_gtav" or "steam_730"
  title: string;
  platform: 'epic' | 'steam' | 'gog' | 'other';
  claimedAt: string;
  status: ClaimStatus;
  error?: string;
  originalPrice?: string;
  url?: string;
}

export interface AppDatabase {
  claimedGames: ClaimedGameRecord[];
  lastCheckTime?: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.resolve(DATA_DIR, 'claimed-games.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadDatabase(): AppDatabase {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    logger.error({ error }, 'Lỗi khi đọc file database');
  }
  return { claimedGames: [] };
}

export function saveDatabase(db: AppDatabase): void {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    logger.info('Đã cập nhật database thành công');
  } catch (error) {
    logger.error({ error }, 'Lỗi khi ghi file database');
  }
}

export function isGameClaimed(id: string): boolean {
  const db = loadDatabase();
  return db.claimedGames.some((g) => g.id === id && (g.status === 'success' || g.status === 'already_owned'));
}

export function addClaimedGame(record: ClaimedGameRecord): void {
  const db = loadDatabase();
  const index = db.claimedGames.findIndex((g) => g.id === record.id);
  if (index >= 0) {
    db.claimedGames[index] = record;
  } else {
    db.claimedGames.push(record);
  }
  db.lastCheckTime = new Date().toISOString();
  saveDatabase(db);
}
