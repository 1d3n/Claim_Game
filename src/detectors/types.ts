export type Platform = 'epic' | 'steam' | 'gog' | 'other';

export interface FreeGame {
  id: string; // Internal identifier e.g. "epic_slug" or "steam_appid"
  title: string;
  platform: Platform;
  url: string;
  imageUrl?: string;
  originalPrice?: string;
  startDate?: string;
  endDate?: string;
  isUpcoming?: boolean;
  appId?: number; // Steam App ID
  subId?: number; // Steam Package Sub ID
  productSlug?: string; // Epic slug
}

export interface DetectorResult {
  currentFreeGames: FreeGame[];
  upcomingFreeGames?: FreeGame[];
}
