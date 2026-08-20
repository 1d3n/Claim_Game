import { detectEpicFreeGames } from '../detectors/epic.detector.js';
import { detectSteamFreeGames } from '../detectors/steam.detector.js';
import { detectGamerPowerFreeGames } from '../detectors/gamerpower.detector.js';
import { claimEpicGame } from '../claimers/epic.claimer.js';
import { claimSteamGame } from '../claimers/steam.claimer.js';
import { loadDatabase, addClaimedGame } from '../storage/database.js';
import { formatDate } from '../utils/helpers.js';
import { FreeGame } from '../detectors/types.js';

async function runDemo() {
  console.log('====================================================');
  console.log('🎮 CHẠY DEMO HỆ THỐNG FREE GAME AUTO CLAIMER');
  console.log('====================================================\n');

  console.log('STEP 1: Quét danh sách game free từ các API...');
  const [epicRes, steamRes, gpRes] = await Promise.all([
    detectEpicFreeGames(),
    detectSteamFreeGames(),
    detectGamerPowerFreeGames(),
  ]);

  console.log(`\n📌 Kết quả quét:`);
  console.log(`- Epic Games Store: ${epicRes.currentFreeGames.length} game dang free, ${epicRes.upcomingFreeGames?.length || 0} game sap free`);
  console.log(`- Steam Store: ${steamRes.currentFreeGames.length} game 100% off`);
  console.log(`- GamerPower Aggregator: ${gpRes.currentFreeGames.length} deal giveaway active\n`);

  console.log('----------------------------------------------------');
  console.log('🎮 DANH SÁCH GAME FREE ĐANG CÓ LÚC NÀY:');
  console.log('----------------------------------------------------');

  const allCurrentGames: FreeGame[] = [...epicRes.currentFreeGames, ...steamRes.currentFreeGames];

  if (allCurrentGames.length === 0) {
    console.log('Không có game 100% off nào.');
  } else {
    for (const g of allCurrentGames) {
      console.log(`\n[${g.platform.toUpperCase()}] ${g.title}`);
      console.log(`  • Gia goc: ${g.originalPrice || 'Free'}`);
      console.log(`  • Han claim: ${formatDate(g.endDate)}`);
      console.log(`  • Link store: ${g.url}`);
    }
  }

  if (epicRes.upcomingFreeGames && epicRes.upcomingFreeGames.length > 0) {
    console.log('\n----------------------------------------------------');
    console.log('🔮 GAME SẮP FREE TUẦN TỚI (EPIC GAMES):');
    console.log('----------------------------------------------------');
    for (const g of epicRes.upcomingFreeGames) {
      console.log(`🎁 ${g.title}`);
      console.log(`  • Thoi gian: ${formatDate(g.startDate)} -> ${formatDate(g.endDate)}`);
      console.log(`  • Link: ${g.url}`);
    }
  }

  console.log('\n----------------------------------------------------');
  console.log('STEP 2: Thử nghiệm quy trình Claim & lưu Database...');
  console.log('----------------------------------------------------');

  for (const g of allCurrentGames) {
    console.log(`\n▶ Tiến hành xử lý claim: "${g.title}" (${g.platform.toUpperCase()})...`);

    let result;
    if (g.platform === 'epic') {
      result = await claimEpicGame(g);
    } else {
      result = await claimSteamGame(g);
    }

    console.log(`  • Trang thai: ${result.status.toUpperCase()}`);
    console.log(`  • Thong bao: ${result.message}`);

    // Capture entry into Database
    addClaimedGame({
      id: g.id,
      title: g.title,
      platform: g.platform,
      claimedAt: new Date().toISOString(),
      status: result.status,
      error: result.errorDetails,
      originalPrice: g.originalPrice,
      url: g.url,
    });
  }

  console.log('\n----------------------------------------------------');
  console.log('STEP 3: Kiểm tra dữ liệu trong Database (claimed-games.json):');
  console.log('----------------------------------------------------');
  const db = loadDatabase();
  console.log(`Lần kiểm tra gần nhất: ${formatDate(db.lastCheckTime)}`);
  console.log(`Tổng số bản ghi trong DB: ${db.claimedGames.length}`);
  console.log(JSON.stringify(db.claimedGames, null, 2));

  console.log('\n====================================================');
  console.log('✅ HOÀN TẤT DEMO CHẠY THỬ HỆ THỐNG');
  console.log('====================================================');
}

runDemo().catch(console.error);
