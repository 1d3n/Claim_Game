import { fetch } from 'undici';
import { DetectorResult, FreeGame } from './types.js';
import { logger } from '../utils/logger.js';

const GAMERPOWER_API_URL =
  'https://www.gamerpower.com/api/giveaways?type=game';

export async function detectGamerPowerFreeGames(): Promise<DetectorResult> {
  const currentFreeGames: FreeGame[] = [];

  try {
    const res = await fetch(GAMERPOWER_API_URL);
    if (!res.ok) {
      throw new Error(`GamerPower API status ${res.status}`);
    }

    const data = (await res.json()) as any[];
    if (Array.isArray(data)) {
      for (const item of data) {
        const platformsStr = (item.platforms || '').toLowerCase();
        let platform: 'epic' | 'steam' | 'gog' | 'other' = 'other';

        if (platformsStr.includes('epic')) platform = 'epic';
        else if (platformsStr.includes('steam')) platform = 'steam';
        else if (platformsStr.includes('gog')) platform = 'gog';

        currentFreeGames.push({
          id: `gp_${item.id}`,
          title: item.title,
          platform,
          url: item.open_giveaway_url || item.gamerpower_url || '',
          imageUrl: item.image || item.thumbnail || '',
          originalPrice: item.worth || 'Free',
          endDate: item.end_date,
          isUpcoming: false,
        });
      }
    }
  } catch (error) {
    logger.error({ error }, 'Lỗi khi detect game free GamerPower');
  }

  return { currentFreeGames, upcomingFreeGames: [] };
}
