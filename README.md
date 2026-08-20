# 🎮 Free Game Auto Claimer & Telegram Bot

Tự động phát hiện và claim game miễn phí từ **Epic Games Store** và **Steam**, tích hợp điều khiển và thông báo qua **Telegram Bot**. Hosting hoàn toàn miễn phí trên **GitHub Actions** và **Vercel**.

---

## 🌟 Tính năng chính

- 🔍 **Tự động quét game free:** Hỗ trợ Epic Games Store, Steam và GamerPower.
- 🎯 **Tự động claim game:** Claim thẳng vào tài khoản Epic & Steam.
- 📱 **Telegram Bot tiếng Việt đầy đủ:**
  - `/games` — Xem danh sách game free hiện tại.
  - `/upcoming` — Xem trước game free sắp tới trên Epic.
  - `/claim` — Trigger claim ngay lập tức qua GitHub Actions.
  - `/history` — Xem lịch sử 10 game đã claim gần nhất.
  - `/status` — Kiểm tra trạng thái hệ thống và thống kê.
- ⚠️ **Xử lý CAPTCHA thông minh:** Gửi nút bấm trực tiếp qua Telegram nếu Epic yêu cầu xác minh thủ công.
- ⏰ **Tần suất tối ưu:** Kiểm tra 2 lần/ngày (09:00 & 21:00 giờ Việt Nam).

---

## 🏗️ Kiến trúc & Hosting

| Thành phần | Nền tảng | Chi phí |
|---|---|---|
| **Auto Claimer Engine** | GitHub Actions (Cron) | 🆓 Miễn phí |
| **Telegram Bot Webhook** | Vercel Serverless Functions | 🆓 Miễn phí |
| **Lịch sử claim** | JSON File / GitHub commit | 🆓 Miễn phí |

---

## 🛠️ Hướng dẫn cài đặt & Deploy

### Bước 1: Tạo Telegram Bot
1. Mở Telegram, tìm bot **[@BotFather](https://t.me/BotFather)**.
2. Gửi lệnh `/newbot` và làm theo hướng dẫn để tạo bot.
3. Lưu lại **`TELEGRAM_BOT_TOKEN`**.
4. Lấy **`TELEGRAM_CHAT_ID`** của bạn (dùng bot [@userinfobot](https://t.me/userinfobot) để xem ID).

### Bước 2: Deploy Telegram Webhook lên Vercel
1. Đăng nhập **[Vercel](https://vercel.com)** bằng tài khoản GitHub.
2. Import repository `Claim_Free_Game`.
3. Thêm các **Environment Variables** trên Vercel Dashboard:
   - `TELEGRAM_BOT_TOKEN`: Token từ BotFather.
   - `TELEGRAM_CHAT_ID`: Chat ID của bạn.
   - `TELEGRAM_WEBHOOK_SECRET`: Chuỗi ngẫu nhiên (ví dụ: `mysecret123`).
   - `GITHUB_TOKEN`: Personal Access Token từ GitHub (quần `repo` hoặc `workflow`).
   - `GITHUB_REPO`: `tên_user/Claim_Free_Game`.
4. Nhấn **Deploy**. Sau khi hoàn tất, bạn sẽ nhận được URL app Vercel (ví dụ: `https://claim-free-game.vercel.app`).
5. Đăng ký Webhook cho Telegram Bot bằng cách truy cập URL trên trình duyệt:
   ```text
   https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<your-vercel-domain>/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>
   ```

### Bước 3: Cấu hình GitHub Secrets
Truy cập GitHub Repo `Settings` -> `Secrets and variables` -> `Actions` -> Thêm các secret sau:

| Name | Giá trị |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token Bot Telegram |
| `TELEGRAM_CHAT_ID` | ID chat Telegram của bạn |
| `EPIC_EMAIL` | Email đăng nhập Epic Games |
| `EPIC_PASSWORD` | Mật khẩu Epic Games |
| `STEAM_USERNAME` | Tên đăng nhập Steam |
| `STEAM_PASSWORD` | Mật khẩu Steam |
| `GITHUB_TOKEN` | Personal Access Token (PAT) |

---

## 🧪 Chạy thử ở local

```bash
# 1. Cài đặt dependencies
npm install

# 2. Cài đặt Playwright Chromium
npx playwright install chromium

# 3. Tạo file .env từ .env.example
cp .env.example .env

# 4. Kiểm tra detector
npm run test:detect

# 5. Chạy engine claim ở local
npm start
```
