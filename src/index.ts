import { validateConfig, config } from './config/index.js';
import { detectEpicFreeGames } from './detectors/epic.detector.js';
import { detectSteamFreeGames } from './detectors/steam.detector.js';
import { detectGamerPowerFreeGames } from './detectors/gamerpower.detector.js';
import { claimEpicGame } from './claimers/epic.claimer.js';
import { claimSteamGame } from './claimers/steam.claimer.js';
import { isGameClaimed, addClaimedGame } from './storage/database.js';
import { notifyClaimResult, sendTelegramMessage } from './telegram/notify.js';
import { logger } from './utils/logger.js';
import { FreeGame } from './detectors/types.js';

async function main() {
  logger.info('🚀 Khởi chạy Free Game Auto Claimer Engine...');
  validateConfig();

  const gamesToProcess: FreeGame[] = [];

  // 1. Detect Epic Games
  if (config.epic.enabled) {
    logger.info('🔍 Đang kiểm tra game free Epic Games Store...');
    const epicRes = await detectEpicFreeGames();
    logger.info(`Tìm thấy ${epicRes.currentFreeGames.length} game free hiện tại trên Epic.`);
    gamesToProcess.push(...epicRes.currentFreeGames);
  }

  // 2. Detect Steam Games
  if (config.steam.enabled) {
    logger.info('🔍 Đang kiểm tra game free Steam Store...');
    const steamRes = await detectSteamFreeGames();
    logger.info(`Tìm thấy ${steamRes.currentFreeGames.length} game free hiện tại trên Steam.`);
    gamesToProcess.push(...steamRes.currentFreeGames);
  }

  // 3. Detect GamerPower (Backup check for Steam/Epic)
  try {
    const gpRes = await detectGamerPowerFreeGames();
    for (const g of gpRes.currentFreeGames) {
      if (g.platform === 'epic' || g.platform === 'steam') {
        const exists = gamesToProcess.some((existing) => existing.title.toLowerCase() === g.title.toLowerCase());
        if (!exists) {
          gamesToProcess.push(g);
        }
      }
    }
  } catch (err) {
    logger.warn({ err }, 'GamerPower backup detection skipped');
  }

  if (gamesToProcess.length === 0) {
    logger.info('ℹ️ Không phát hiện game free mới nào lúc này.');
    return;
  }

  logger.info(`Tổng cộng ${gamesToProcess.length} game free cần kiểm tra.`);

  let newlyClaimedCount = 0;

  for (const game of gamesToProcess) {
    // Check if already claimed in DB
    if (isGameClaimed(game.id)) {
      logger.info({ title: game.title }, 'Game đã được claim trước đó. Bỏ qua.');
      continue;
    }

    logger.info({ title: game.title, platform: game.platform }, 'Tiến hành claim game...');

    let claimResult;
    if (game.platform === 'epic') {
      claimResult = await claimEpicGame(game);
    } else if (game.platform === 'steam') {
      claimResult = await claimSteamGame(game);
    } else {
      claimResult = {
        game,
        status: 'manual_required' as const,
        message: 'Nền tảng chưa được hỗ trợ auto-claim.',
        manualUrl: game.url,
      };
    }

    // Save record to DB
    addClaimedGame({
      id: game.id,
      title: game.title,
      platform: game.platform,
      claimedAt: new Date().toISOString(),
      status: claimResult.status,
      error: claimResult.errorDetails,
      originalPrice: game.originalPrice,
      url: game.url,
    });

    if (claimResult.status === 'success') {
      newlyClaimedCount++;
    }

    // Send Telegram Notification
    await notifyClaimResult(claimResult);
  }

  logger.info(`Hoàn tất! Đã claim thành công ${newlyClaimedCount} game mới.`);
}

main().catch(async (error) => {
  logger.error({ error }, 'Lỗi nghiêm trọng trong main orchestrator');
  await sendTelegramMessage(`❌ <b>Lỗi hệ thống Auto-Claim:</b> ${error.message || error}`);
  process.exit(1);
});
