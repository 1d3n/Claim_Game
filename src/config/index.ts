import dotenv from 'dotenv';
dotenv.config();

export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || 'secret',
  },
  epic: {
    email: process.env.EPIC_EMAIL || '',
    password: process.env.EPIC_PASSWORD || '',
    enabled: process.env.CLAIM_EPIC !== 'false',
  },
  steam: {
    username: process.env.STEAM_USERNAME || '',
    password: process.env.STEAM_PASSWORD || '',
    enabled: process.env.CLAIM_STEAM !== 'false',
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
    repo: process.env.GITHUB_REPO || '',
  },
  app: {
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};

export function validateConfig() {
  const missing: string[] = [];
  if (!config.telegram.botToken) missing.push('TELEGRAM_BOT_TOKEN');
  if (!config.telegram.chatId) missing.push('TELEGRAM_CHAT_ID');

  if (missing.length > 0) {
    console.warn(`[CONFIG WARNING] Thieu cac bien môi truuong: ${missing.join(', ')}`);
  }
}
