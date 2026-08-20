import { fetch } from 'undici';
import { DetectorResult, FreeGame } from './types.js';
import { logger } from '../utils/logger.js';

const STEAM_SEARCH_URL =
  'https://store.steampowered.com/search/results/?query=&json=1&category1=998&specials=1&maxprice=0';

export async function detectSteamFreeGames(): Promise<DetectorResult> {
  const currentFreeGames: FreeGame[] = [];

  try {
    const res = await fetch(STEAM_SEARCH_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      throw new Error(`Steam API status ${res.status}`);
    }

    const data = (await res.json()) as any;
    const items = data?.items || [];

    for (const item of items) {
      // Steam search result structure or fallback parse
      const title = item.name || item.title || '';
      const logo = item.logo || item.tiny_image || '';

      // Match App ID or Package ID from item
      let appId: number | undefined;
      const idMatch = (item.ds_appid || item.id || '').toString().match(/\d+/);
      if (idMatch) {
        appId = parseInt(idMatch[0], 10);
      }

      if (!title || !appId) continue;

      const url = `https://store.steampowered.com/app/${appId}/`;

      currentFreeGames.push({
        id: `steam_${appId}`,
        title,
        platform: 'steam',
        url,
        imageUrl: logo,
        originalPrice: 'Miễn phí giới hạn thời gian',
        isUpcoming: false,
        appId,
      });
    }
  } catch (error) {
    logger.error({ error }, 'Lỗi khi detect game free Steam Store');
  }

  return { currentFreeGames, upcomingFreeGames: [] };
}
