// @ts-ignore
import SteamUser from 'steam-user';
import { FreeGame } from '../detectors/types.js';
import { ClaimResult } from './types.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export async function claimSteamGame(game: FreeGame): Promise<ClaimResult> {
  if (!config.steam.username || !config.steam.password) {
    logger.warn('Steam credentials không được cấu hình. Bỏ qua auto-claim Steam.');
    return {
      game,
      status: 'failed',
      message: 'Chưa cấu hình tài khoản Steam trong environment variables.',
      manualUrl: game.url,
    };
  }

  if (!game.appId && !game.subId) {
    return {
      game,
      status: 'failed',
      message: 'Không tìm thấy AppID hoặc SubID của game Steam.',
      manualUrl: game.url,
    };
  }

  return new Promise((resolve) => {
    logger.info({ title: game.title, appId: game.appId }, 'Bắt đầu claim game Steam...');
    const client = new SteamUser();

    const timeoutTimer = setTimeout(() => {
      client.logOff();
      resolve({
        game,
        status: 'failed',
        message: 'Hết thời gian kết nối tới Steam (Timeout 30s).',
        manualUrl: game.url,
      });
    }, 30000);

    client.logOn({
      accountName: config.steam.username,
      password: config.steam.password,
    });

    client.on('loggedOn', () => {
      logger.info('Đã đăng nhập Steam thành công!');
      const targetId = game.appId || game.subId!;

      client.requestFreeLicense([targetId], (err: any, grantedPackages: any, grantedApps: any) => {
        clearTimeout(timeoutTimer);
        client.logOff();

        if (err) {
          logger.error({ err, title: game.title }, 'Lỗi khi request free license Steam');
          resolve({
            game,
            status: 'failed',
            message: `Lỗi Steam API: ${err.message || 'Không thể cấp license'}`,
            manualUrl: game.url,
            errorDetails: err.message,
          });
        } else {
          logger.info({ title: game.title, grantedApps, grantedPackages }, 'Claim Steam game thành công!');
          resolve({
            game,
            status: 'success',
            message: 'Đã tự động thêm game thành công vào tài khoản Steam!',
          });
        }
      });
    });

    client.on('error', (err: any) => {
      clearTimeout(timeoutTimer);
      logger.error({ err }, 'Lỗi đăng nhập Steam');
      resolve({
        game,
        status: 'failed',
        message: `Đăng nhập Steam thất bại: ${err.message || err}`,
        manualUrl: game.url,
        errorDetails: err.message,
      });
    });
  });
}
