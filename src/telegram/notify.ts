import { fetch } from 'undici';
import { config } from '../config/index.js';
import { ClaimResult } from '../claimers/types.js';
import { FreeGame } from '../detectors/types.js';
import { logger } from '../utils/logger.js';
import { formatDate } from '../utils/helpers.js';

export async function sendTelegramMessage(text: string, inlineKeyboard?: any): Promise<boolean> {
  if (!config.telegram.botToken || !config.telegram.chatId) {
    logger.warn('Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID');
    return false;
  }

  const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;
  try {
    const payload: any = {
      chat_id: config.telegram.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    };

    if (inlineKeyboard) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error({ errText, status: res.status }, 'Lỗi khi gửi Telegram message');
      return false;
    }
    return true;
  } catch (error) {
    logger.error({ error }, 'Ngoại lệ khi gửi Telegram message');
    return false;
  }
}

export async function notifyClaimResult(result: ClaimResult): Promise<void> {
  const { game, status, message, manualUrl } = result;
  const platformName = game.platform === 'epic' ? '🟣 Epic Games Store' : '🔵 Steam';

  let emoji = '✅';
  let statusHeader = 'ĐÃ CLAIM THÀNH CÔNG';
  if (status === 'already_owned') {
    emoji = 'ℹ️';
    statusHeader = 'ĐÃ CÓ TRONG THƯ VIỆN';
  } else if (status === 'captcha_required') {
    emoji = '⚠️';
    statusHeader = 'CẦN XÁC NHẬN THỦ CÔNG';
  } else if (status === 'failed') {
    emoji = '❌';
    statusHeader = 'CLAIM THẤT BẠI';
  }

  let text = `${emoji} <b>[${statusHeader}]</b>\n\n`;
  text += `🎮 <b>${game.title}</b>\n`;
  text += `🏢 Nền tảng: ${platformName}\n`;
  if (game.originalPrice) {
    text += `💰 Giá gốc: <s>${game.originalPrice}</s> ➔ <b>FREE</b>\n`;
  }
  if (game.endDate) {
    text += `⏰ Hạn claim: ${formatDate(game.endDate)}\n`;
  }
  text += `\n📝 Chi tiết: <i>${message}</i>`;

  const inlineKeyboard: any[] = [];
  const targetUrl = manualUrl || game.url;
  if (targetUrl) {
    inlineKeyboard.push([{ text: '🔗 Mở trang nhận game', url: targetUrl }]);
  }

  await sendTelegramMessage(text, inlineKeyboard.length > 0 ? inlineKeyboard : undefined);
}

export async function notifyNewFreeGamesFound(games: FreeGame[]): Promise<void> {
  if (games.length === 0) return;

  let text = `🎉 <b>PHÁT HIỆN ${games.length} GAME FREE MỚI!</b>\n\n`;

  for (const g of games) {
    const platform = g.platform === 'epic' ? '🟣 Epic' : '🔵 Steam';
    text += `• <b>${g.title}</b> (${platform})\n`;
    if (g.endDate) {
      text += `  ⏰ Hạn: ${formatDate(g.endDate)}\n`;
    }
    text += `  🔗 <a href="${g.url}">Xem chi tiết</a>\n\n`;
  }

  await sendTelegramMessage(text);
}
