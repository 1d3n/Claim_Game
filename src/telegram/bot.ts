import { Bot, InlineKeyboard } from 'grammy';
import { config } from '../config/index.js';
import { detectEpicFreeGames } from '../detectors/epic.detector.js';
import { detectSteamFreeGames } from '../detectors/steam.detector.js';
import { detectGamerPowerFreeGames } from '../detectors/gamerpower.detector.js';
import { loadDatabase } from '../storage/database.js';
import { formatDate } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
import { fetch } from 'undici';

export function createTelegramBot(): Bot {
  const bot = new Bot(config.telegram.botToken);

  // /start
  bot.command('start', async (ctx) => {
    const text =
      `👋 <b>Xin chào! Tôi là Free Game Auto Claimer Bot.</b>\n\n` +
      `Tôi sẽ tự động theo dõi và claim các game miễn phí từ <b>Epic Games Store</b> và <b>Steam</b> cho bạn.\n\n` +
      `📋 <b>Các lệnh có thể dùng:</b>\n` +
      `• /games - Xem danh sách game free hiện tại\n` +
      `• /upcoming - Xem game free tuần tới trên Epic\n` +
      `• /claim - Trigger kiểm tra & claim ngay lập tức\n` +
      `• /history - Xem lịch sử game đã claim\n` +
      `• /status - Xem trạng thái hệ thống\n` +
      `• /help - Trợ giúp`;
    await ctx.reply(text, { parse_mode: 'HTML' });
  });

  // /help
  bot.command('help', async (ctx) => {
    const text =
      `📖 <b>HƯỚNG DẪN SỬ DỤNG BOT</b>\n\n` +
      `🎮 <b>/games</b> - Quét và hiển thị tất cả game đang free trên Epic Games Store, Steam & GamerPower.\n` +
      `🔮 <b>/upcoming</b> - Hiển thị các game sắp sửa free vào tuần tới trên Epic Games.\n` +
      `⚡ <b>/claim</b> - Kích hoạt ngay quy trình tự động claim game qua GitHub Actions.\n` +
      `📜 <b>/history</b> - Xem lại danh sách 10 game gần nhất bot đã xử lý.\n` +
      `📊 <b>/status</b> - Kiểm tra trạng thái hoạt động và lần chạy gần nhất của bot.`;
    await ctx.reply(text, { parse_mode: 'HTML' });
  });

  // /games
  bot.command('games', async (ctx) => {
    await ctx.reply('🔍 Đang kiểm tra danh sách game free mới nhất...');
    try {
      const [epic, steam, gp] = await Promise.all([
        detectEpicFreeGames(),
        detectSteamFreeGames(),
        detectGamerPowerFreeGames(),
      ]);

      let text = `🎮 <b>DANH SÁCH GAME FREE HIỆN TẠI</b>\n\n`;

      text += `🟣 <b>EPIC GAMES STORE:</b>\n`;
      if (epic.currentFreeGames.length === 0) {
        text += `  <i>Không có game free nào lúc này.</i>\n`;
      } else {
        for (const g of epic.currentFreeGames) {
          text += `  • <b>${g.title}</b>\n`;
          if (g.originalPrice) text += `    💰 Giá gốc: <s>${g.originalPrice}</s> ➔ FREE\n`;
          if (g.endDate) text += `    ⏰ Hạn: ${formatDate(g.endDate)}\n`;
          text += `    🔗 <a href="${g.url}">Nhận ngay trên Epic</a>\n\n`;
        }
      }

      text += `\n🔵 <b>STEAM:</b>\n`;
      if (steam.currentFreeGames.length === 0) {
        text += `  <i>Hiện chưa phát hiện game 100% off trên Steam.</i>\n`;
      } else {
        for (const g of steam.currentFreeGames) {
          text += `  • <b>${g.title}</b> (AppID: ${g.appId})\n`;
          text += `    🔗 <a href="${g.url}">Nhận ngay trên Steam</a>\n\n`;
        }
      }

      text += `\n🌐 <b>NỀN TẢNG KHÁC (GamerPower):</b>\n`;
      const gpSample = gp.currentFreeGames.slice(0, 3);
      if (gpSample.length === 0) {
        text += `  <i>Không có thông tin bổ sung.</i>\n`;
      } else {
        for (const g of gpSample) {
          text += `  • [${g.platform.toUpperCase()}] <b>${g.title}</b>\n`;
          text += `    🔗 <a href="${g.url}">Xem deal</a>\n\n`;
        }
      }

      const keyboard = new InlineKeyboard().text('⚡ Claim Ngay', 'trigger_claim');
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
    } catch (error: any) {
      logger.error({ error }, 'Lỗi lệnh /games');
      await ctx.reply(`❌ Lỗi khi lấy danh sách game: ${error.message}`);
    }
  });

  // /upcoming
  bot.command('upcoming', async (ctx) => {
    await ctx.reply('🔮 Đang tải danh sách game sắp free trên Epic Games...');
    try {
      const epic = await detectEpicFreeGames();
      const upcoming = epic.upcomingFreeGames || [];

      if (upcoming.length === 0) {
        await ctx.reply('ℹ️ Chưa có thông tin game free tuần tới.');
        return;
      }

      let text = `🔮 <b>GAME FREE SẮP TỚI TRÊN EPIC GAMES STORE</b>\n\n`;
      for (const g of upcoming) {
        text += `🎁 <b>${g.title}</b>\n`;
        text += `📅 Bắt đầu: ${formatDate(g.startDate)}\n`;
        text += `⏰ Kết thúc: ${formatDate(g.endDate)}\n`;
        text += `🔗 <a href="${g.url}">Xem trang store</a>\n\n`;
      }

      await ctx.reply(text, { parse_mode: 'HTML' });
    } catch (error: any) {
      logger.error({ error }, 'Lỗi lệnh /upcoming');
      await ctx.reply(`❌ Lỗi khi lấy game upcoming: ${error.message}`);
    }
  });

  // /history
  bot.command('history', async (ctx) => {
    const db = loadDatabase();
    const records = db.claimedGames.slice(-10).reverse();

    if (records.length === 0) {
      await ctx.reply('📜 Lịch sử rỗng. Bot chưa claim game nào.');
      return;
    }

    let text = `📜 <b>LỊCH SỬ 10 GAME XỬ LÝ GẦN NHẤT</b>\n\n`;
    for (const r of records) {
      let icon = '❌';
      if (r.status === 'success') icon = '✅';
      else if (r.status === 'already_owned') icon = 'ℹ️';
      else if (r.status === 'manual_required' || r.status === 'captcha_required') icon = '⚠️';

      const platformStr = r.platform === 'epic' ? 'Epic' : 'Steam';
      text += `${icon} <b>${r.title}</b> (${platformStr})\n`;
      text += `  • Trạng thái: ${r.status.toUpperCase()}\n`;
      text += `  • Thời gian: ${formatDate(r.claimedAt)}\n\n`;
    }

    await ctx.reply(text, { parse_mode: 'HTML' });
  });

  // /status
  bot.command('status', async (ctx) => {
    const db = loadDatabase();
    const totalClaimed = db.claimedGames.filter((g) => g.status === 'success' || g.status === 'already_owned').length;
    const epicCount = db.claimedGames.filter((g) => g.platform === 'epic' && (g.status === 'success' || g.status === 'already_owned')).length;
    const steamCount = db.claimedGames.filter((g) => g.platform === 'steam' && (g.status === 'success' || g.status === 'already_owned')).length;

    let text = `📊 <b>TRẠNG THÁI HỆ THỐNG BOT</b>\n\n`;
    text += `🟢 <b>Trạng thái:</b> Đang hoạt động\n`;
    text += `⏰ <b>Lần kiểm tra gần nhất:</b> ${formatDate(db.lastCheckTime)}\n`;
    text += `🎮 <b>Tổng số game đã claim thành công:</b> ${totalClaimed}\n`;
    text += `   • 🟣 Epic Games: ${epicCount}\n`;
    text += `   • 🔵 Steam: ${steamCount}\n`;
    text += `⚙️ <b>Chế độ kiểm tra:</b> 2 lần/ngày (09:59 Sáng & 21:59 Tối VN)`;

    await ctx.reply(text, { parse_mode: 'HTML' });
  });

  // /claim
  bot.command('claim', async (ctx) => {
    await triggerManualClaim(ctx);
  });

  // Callback query handler (for inline keyboard buttons)
  bot.on('callback_query:data', async (ctx) => {
    if (ctx.callbackQuery.data === 'trigger_claim') {
      await ctx.answerCallbackQuery('🚀 Đang kích hoạt tiến trình claim!');
      await triggerManualClaim(ctx);
    }
  });

  return bot;
}

async function triggerManualClaim(ctx: any) {
  if (!config.github.token || !config.github.repo) {
    await ctx.reply(
      '⚠️ Chưa cấu hình <b>GITHUB_TOKEN</b> hoặc <b>GITHUB_REPO</b> trong env vars để trigger GitHub Actions.\n\n' +
        'Bạn có thể trigger trực tiếp trên tab Actions của GitHub repo.',
      { parse_mode: 'HTML' }
    );
    return;
  }

  await ctx.reply('🚀 Đang gửi yêu cầu trigger Auto-Claim workflow lên GitHub Actions...');
  try {
    const url = `https://api.github.com/repos/${config.github.repo}/dispatches`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.github.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'TelegramBot',
      },
      body: JSON.stringify({
        event_type: 'manual_claim_trigger',
      }),
    });

    if (res.ok || res.status === 204) {
      await ctx.reply('✅ Đã kích hoạt workflow thành công! Vui lòng chờ ít phút để bot tiến hành claim và báo kết quả.');
    } else {
      const err = await res.text();
      await ctx.reply(`❌ Lỗi khi gửi trigger lên GitHub API (HTTP ${res.status}): ${err}`);
    }
  } catch (error: any) {
    await ctx.reply(`❌ Ngoại lệ khi trigger GitHub Actions: ${error.message}`);
  }
}
