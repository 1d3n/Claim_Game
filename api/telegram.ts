import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createTelegramBot } from '../src/telegram/bot.js';
import { config } from '../src/config/index.js';
import { logger } from '../src/utils/logger.js';

const bot = createTelegramBot();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(200).send('Free Game Telegram Bot Webhook Endpoint is Running.');
  }

  // Validate webhook secret header if configured
  if (config.telegram.webhookSecret) {
    const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
    if (secretHeader && secretHeader !== config.telegram.webhookSecret) {
      logger.warn('Webhook secret header không khớp.');
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  try {
    const update = req.body;
    if (update) {
      await bot.handleUpdate(update);
    }
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    logger.error({ error }, 'Lỗi khi xử lý Telegram update');
    return res.status(500).json({ error: error.message });
  }
}
