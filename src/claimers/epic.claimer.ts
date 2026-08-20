import { chromium, Browser, Page } from 'playwright';
import { FreeGame } from '../detectors/types.js';
import { ClaimResult } from './types.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { sleep } from '../utils/helpers.js';

export async function claimEpicGame(game: FreeGame): Promise<ClaimResult> {
  if (!config.epic.email || !config.epic.password) {
    logger.warn('Epic credentials không được cấu hình. Bỏ qua auto-claim Epic.');
    return {
      game,
      status: 'manual_required',
      message: 'Chưa cấu hình tài khoản Epic Games trong environment variables.',
      manualUrl: game.url,
    };
  }

  let browser: Browser | null = null;
  try {
    logger.info({ title: game.title }, 'Bắt đầu claim game Epic Games Store...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',
    });

    const page = await context.newPage();

    // Go to login page
    await page.goto(
      'https://www.epicgames.com/id/login?redirectUrl=' + encodeURIComponent(game.url),
      { waitUntil: 'domcontentloaded', timeout: 30000 }
    );
    await sleep(2000);

    // Check if login form exists
    const emailInput = page.locator('input#email, input[name="email"]');
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      logger.info('Điền email và mật khẩu login Epic...');
      await emailInput.fill(config.epic.email);
      const passwordInput = page.locator('input#password, input[name="password"]');
      await passwordInput.fill(config.epic.password);

      const loginBtn = page.locator('button#sign-in, button[type="submit"]');
      await loginBtn.click();
      await sleep(5000);

      // Check if captcha / 2FA iframe appeared
      const hasCaptcha = await page
        .locator('iframe[title*="captcha"], iframe[src*="arkoselabs"], iframe[src*="hcaptcha"]')
        .count();

      if (hasCaptcha > 0) {
        logger.warn({ title: game.title }, 'Phát hiện CAPTCHA Epic Games!');
        return {
          game,
          status: 'captcha_required',
          message: 'Epic Games yêu cầu giải CAPTCHA khi đăng nhập. Hãy nhấn nút để claim thủ công!',
          manualUrl: game.url,
        };
      }
    }

    // Go directly to game page if not already there
    if (!page.url().includes(game.productSlug || '')) {
      await page.goto(game.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(3000);
    }

    // Check if already owned
    const pageText = await page.innerText('body');
    if (
      pageText.includes('IN LIBRARY') ||
      pageText.includes('ĐÃ CÓ TRONG THƯ VIỆN') ||
      pageText.includes('In Library')
    ) {
      logger.info({ title: game.title }, 'Game đã có sẵn trong thư viện Epic Games.');
      return {
        game,
        status: 'already_owned',
        message: 'Game đã có sẵn trong thư viện Epic Games.',
      };
    }

    // Click "Get" button
    const getBtn = page.locator(
      'button:has-text("GET"), button:has-text("Get"), button:has-text("NHẬN")'
    );
    if (await getBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await getBtn.click();
      await sleep(4000);

      // Click "Place Order" inside checkout modal/iframe
      const placeOrderBtn = page.locator(
        'button:has-text("PLACE ORDER"), button:has-text("Place Order"), button:has-text("ĐẶT HÀNG")'
      );
      if (await placeOrderBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
        await placeOrderBtn.click();
        await sleep(5000);
        logger.info({ title: game.title }, 'Claim Epic game thành công!');
        return {
          game,
          status: 'success',
          message: 'Đã tự động claim game thành công trên Epic Games Store!',
        };
      }
    }

    // Fallback if automation didn't complete
    return {
      game,
      status: 'captcha_required',
      message: 'Cần xác nhận thủ công trên cửa hàng Epic Games.',
      manualUrl: game.url,
    };
  } catch (error: any) {
    logger.error({ error: error.message, title: game.title }, 'Lỗi khi claim Epic game');
    return {
      game,
      status: 'failed',
      message: `Thất bại khi claim trên Epic: ${error.message || 'Lỗi không xác định'}`,
      manualUrl: game.url,
      errorDetails: error.message,
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
