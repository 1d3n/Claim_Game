import { fetch } from 'undici';
import { DetectorResult, FreeGame } from './types.js';
import { logger } from '../utils/logger.js';

const EPIC_PROMOTIONS_URL =
  'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US';

export async function detectEpicFreeGames(): Promise<DetectorResult> {
  const currentFreeGames: FreeGame[] = [];
  const upcomingFreeGames: FreeGame[] = [];

  try {
    const res = await fetch(EPIC_PROMOTIONS_URL);
    if (!res.ok) {
      throw new Error(`Epic API status ${res.status}`);
    }

    const data = (await res.json()) as any;
    const elements =
      data?.data?.Catalog?.searchStore?.elements || [];

    for (const game of elements) {
      const promotions = game.promotions;
      if (!promotions) continue;

      const title = game.title;
      const productSlug =
        game.productSlug ||
        game.urlSlug ||
        (game.offerMappings && game.offerMappings[0]?.pageSlug) ||
        '';

      const url = productSlug
        ? `https://store.epicgames.com/p/${productSlug}`
        : 'https://store.epicgames.com/free-games';

      const keyImages = game.keyImages || [];
      const imageObj =
        keyImages.find(
          (img: any) =>
            img.type === 'OfferImageWide' ||
            img.type === 'Thumbnail' ||
            img.type === 'DieselStoreFrontWide'
        ) || keyImages[0];
      const imageUrl = imageObj?.url || '';

      const originalPriceFmt = game.price?.totalPrice?.fmtPrice?.originalPrice || '';

      // Active promotional offers
      const activeOffers = promotions.promotionalOffers || [];
      for (const offerGroup of activeOffers) {
        for (const offer of offerGroup.promotionalOffers || []) {
          const discountPercentage = offer.discountSetting?.discountPercentage;
          if (discountPercentage === 0) {
            currentFreeGames.push({
              id: `epic_${game.id || productSlug || title}`,
              title,
              platform: 'epic',
              url,
              imageUrl,
              originalPrice: originalPriceFmt,
              startDate: offer.startDate,
              endDate: offer.endDate,
              isUpcoming: false,
              productSlug,
            });
          }
        }
      }

      // Upcoming promotional offers
      const upcomingOffers = promotions.upcomingPromotionalOffers || [];
      for (const offerGroup of upcomingOffers) {
        for (const offer of offerGroup.promotionalOffers || []) {
          const discountPercentage = offer.discountSetting?.discountPercentage;
          if (discountPercentage === 0) {
            upcomingFreeGames.push({
              id: `epic_${game.id || productSlug || title}_upcoming`,
              title,
              platform: 'epic',
              url,
              imageUrl,
              originalPrice: originalPriceFmt,
              startDate: offer.startDate,
              endDate: offer.endDate,
              isUpcoming: true,
              productSlug,
            });
          }
        }
      }
    }
  } catch (error) {
    logger.error({ error }, 'Lỗi khi detect game free Epic Games Store');
  }

  return { currentFreeGames, upcomingFreeGames };
}
