import { detectEpicFreeGames } from '../detectors/epic.detector.js';
import { detectSteamFreeGames } from '../detectors/steam.detector.js';
import { detectGamerPowerFreeGames } from '../detectors/gamerpower.detector.js';
import { logger } from '../utils/logger.js';

async function main() {
  console.log('=== TEST DETECT EPIC GAMES ===');
  const epicResult = await detectEpicFreeGames();
  console.log(`Hiện tại: ${epicResult.currentFreeGames.length} game free`);
  for (const g of epicResult.currentFreeGames) {
    console.log(`- [${g.title}] | Giá gốc: ${g.originalPrice} | URL: ${g.url}`);
  }
  console.log(`Sắp tới: ${epicResult.upcomingFreeGames?.length || 0} game`);
  for (const g of epicResult.upcomingFreeGames || []) {
    console.log(`- [${g.title}] | Từ: ${g.startDate} đến ${g.endDate}`);
  }

  console.log('\n=== TEST DETECT STEAM GAMES ===');
  const steamResult = await detectSteamFreeGames();
  console.log(`Hiện tại: ${steamResult.currentFreeGames.length} game free`);
  for (const g of steamResult.currentFreeGames) {
    console.log(`- [${g.title}] (AppID: ${g.appId}) | URL: ${g.url}`);
  }

  console.log('\n=== TEST DETECT GAMERPOWER ===');
  const gpResult = await detectGamerPowerFreeGames();
  console.log(`Tổng số deal: ${gpResult.currentFreeGames.length}`);
  const sample = gpResult.currentFreeGames.slice(0, 5);
  for (const g of sample) {
    console.log(`- [${g.platform.toUpperCase()}] ${g.title} | ${g.url}`);
  }
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
