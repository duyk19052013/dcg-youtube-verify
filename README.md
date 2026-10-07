# 🚀 Hệ Thống Xác Minh YouTube Tự Động Cho Discord

Dự án hoàn chỉnh kết hợp **Discord Bot (discord.js v14)** và **Web Server (Express)** nhằm tự động kiểm tra xem thành viên Discord đã **Đăng ký (Subscribe)** kênh YouTube [Đốn Chơi Game](https://www.youtube.com/@donchoigame) hay chưa, sau đó tự động cấp Role **"Đã Xác Thực"** trên máy chủ Discord.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
D:\discord-youtube-verifier\
├── .env                  # File cấu hình biến môi trường bí mật
├── .env.example          # Mẫu cấu hình
├── .gitignore            # Bỏ qua node_modules và .env
├── package.json          # Danh sách thư viện & scripts
├── README.md             # Hướng dẫn chi tiết từ A-Z
└── src/
    ├── config.js         # Đọc & kiểm tra biến môi trường
    ├── youtube.js        # Google OAuth2 & gọi YouTube Data API v3
    ├── bot.js            # Khởi tạo Discord Bot, bắt sự kiện nút & cấp Role
    ├── server.js         # Express Web Server, xử lý callback & giao diện HTML
    ├── deploy-commands.js # Đăng ký Slash Command (/setup-verify) lên Server
    └── index.js          # File chạy chính kết nối Bot và Web Server
```

---

## 🛠️ Hướng Dẫn Lấy Thông Tin Cấu Hình

### PHẦN 1: CẤU HÌNH TRÊN DISCORD DEVELOPER PORTAL

1. **Tạo Discord Application & Bot:**
   - Truy cập: [Discord Developer Portal](https://discord.com/developers/applications).
   - Bấm **New Application**, đặt tên cho bot (ví dụ: `DCG Verifier Bot`) rồi nhấn **Create**.
   - Tại tab **General Information**, sao chép **APPLICATION ID** (đây là `CLIENT_ID` trong `.env`).

2. **Lấy Token của Bot:**
   - Chuyển sang menu **Bot** ở bên trái.
   - Bấm **Reset Token** để lấy chuỗi mã bí mật (đây là `DISCORD_BOT_TOKEN` trong `.env`).
   - ⚠️ **LƯU Ý CỰC KỲ QUAN TRỌNG:** Kéo xuống phần **Privileged Gateway Intents**, **BẬT** mục:
     - ✅ **Server Members Intent** *(Bắt buộc bật mục này để bot có quyền đọc danh sách thành viên và gán Role)*.
   - Nhấn **Save Changes**.

3. **Mời Bot vào Server với đầy đủ quyền:**
   - Chuyển sang menu **OAuth2** -> **URL Generator**.
   - Tại mục **SCOPES**, tích chọn:
     - `bot`
     - `applications.commands`
   - Tại mục **BOT PERMISSIONS**, tích chọn:
     - `Manage Roles` (Quản lý vai trò - Bắt buộc để cấp Role)
     - `Send Messages` (Gửi tin nhắn)
     - `Embed Links` (Nhúng liên kết)
     - `Read Message History` (Đọc lịch sử tin nhắn)
   - Sao chép liên kết ở cuối trang và dán vào trình duyệt để mời Bot vào Server Discord của bạn.

4. **Lấy Server ID và Role ID:**
   - Mở ứng dụng Discord, vào **User Settings** (icon bánh răng) -> **Advanced** -> Bật **Developer Mode** (Chế độ nhà phát triển).
   - Nhấp chuột phải vào tên Server của bạn -> Chọn **Copy Server ID** (đây là `GUILD_ID` trong `.env`).
   - Vào **Server Settings** -> **Roles**:
     - Tạo một Role mới (ví dụ: `Đã Xác Thực` hoặc `YouTube Member`).
     - Nhấp chuột phải vào Role đó -> Chọn **Copy Role ID** (đây là `VERIFIED_ROLE_ID` trong `.env`).
   - ⚠️ **QUY TẮC THỨ BẬC ROLE (ROLE HIERARCHY):**
     - Trong danh sách **Roles** của Server, hãy kéo Role của Bot lên **CAO HƠN** Role `Đã Xác Thực`.
     - *Nếu Role của Bot nằm dưới, Discord sẽ từ chối không cho bot cấp Role đó với lỗi `Missing Permissions`.*

---

### PHẦN 2: CẤU HÌNH TRÊN GOOGLE CLOUD CONSOLE

1. **Tạo Project mới:**
   - Truy cập: [Google Cloud Console](https://console.cloud.google.com/).
   - Ở thanh điều hướng trên cùng, bấm vào danh sách dự án -> Chọn **NEW PROJECT**.
   - Đặt tên (ví dụ: `Discord YouTube Verifier`) -> Bấm **Create**.

2. **Kích hoạt YouTube Data API v3:**
   - Vào menu góc trái (☰) -> **APIs & Services** -> **Library**.
   - Tìm kiếm từ khóa: `YouTube Data API v3`.
   - Bấm vào kết quả hiển thị và nhấn nút **Enable** (Bật).

3. **Cấu hình OAuth Consent Screen (Màn hình đồng ý):**
   - Vào **APIs & Services** -> **OAuth consent screen**.
   - Chọn **User Type:** `External` -> Bấm **Create**.
   - Điền thông tin cơ bản:
     - **App name:** `Đốn Chơi Game Verifier`
     - **User support email:** Chọn email của bạn.
     - **Developer contact information:** Điền email của bạn.
     - Bấm **Save and Continue**.
   - **Bước Scopes:**
     - Bấm **Add or Remove Scopes**.
     - Tìm và chọn scope: `https://www.googleapis.com/auth/youtube.readonly` (*Xem danh sách đăng ký và tài khoản YouTube của bạn*).
     - Bấm **Update** -> Bấm **Save and Continue**.
   - **Bước Test Users (Nếu ứng dụng đang ở trạng thái Testing):**
     - Bấm **Add Users** và thêm các email Google mà bạn dùng để test (đến khi ứng dụng được Publish, chỉ các email trong danh sách này mới có thể đăng nhập).
     - Bấm **Save and Continue** -> **Back to Dashboard**.

4. **Tạo OAuth 2.0 Client ID & Secret:**
   - Vào **APIs & Services** -> **Credentials**.
   - Bấm **+ CREATE CREDENTIALS** -> Chọn **OAuth client ID**.
   - **Application type:** Chọn `Web application`.
   - **Name:** `Discord OAuth Client`.
   - **Authorized redirect URIs (Cực kỳ quan trọng):**
     - Bấm **+ ADD URI**.
     - Nhập chính xác: `http://localhost:3000/auth/google/callback` (khi chạy local).
     - *(Nếu sau này bạn đưa lên hosting/VPS hoặc dùng ngrok, thêm URL callback tương ứng vào đây)*.
   - Bấm **Create**.
   - Cửa sổ hiện ra cung cấp:
     - **Client ID** (đây là `GOOGLE_CLIENT_ID` trong `.env`).
     - **Client Secret** (đây là `GOOGLE_CLIENT_SECRET` trong `.env`).

---

### PHẦN 3: THÔNG TIN KÊNH YOUTUBE ĐỐN CHƠI GAME

- Link kênh: `https://www.youtube.com/@donchoigame`
- **Channel ID chính xác (Bắt buộc dùng ID bắt đầu bằng UC, không dùng handle @):**
  ```
  YOUTUBE_CHANNEL_ID=UCXg740yLabzMQbbdHUea_RQ
  ```
  *(Đã được cấu hình mặc định sẵn trong file `.env` và `.env.example`)*.

---

## ⚙️ Cài Đặt & Khởi Chạy

### Bước 1: Mở file `.env` và điền các thông tin đã lấy ở trên

Mở file `D:\discord-youtube-verifier\.env` bằng bất kỳ trình soạn thảo nào và điền:

```env
DISCORD_BOT_TOKEN=MTE...your_token_here
CLIENT_ID=123456789012345678
GUILD_ID=123456789012345678
VERIFIED_ROLE_ID=123456789012345678

GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
REDIRECT_URI=http://localhost:3000/auth/google/callback
YOUTUBE_CHANNEL_ID=UCXg740yLabzMQbbdHUea_RQ

PORT=3000
APP_URL=http://localhost:3000
```

### Bước 2: Đăng ký Slash Command lên Server Discord

Mở Terminal / PowerShell tại thư mục `D:\discord-youtube-verifier\` và chạy:

```bash
npm run deploy-commands
```

Lệnh này sẽ đăng ký Slash Command `/setup-verify` vào Server Discord của bạn ngay lập tức.

### Bước 3: Khởi động hệ thống (Bot + Web Server)

Chạy lệnh:

```bash
npm start
```

Khi chạy thành công, console sẽ hiển thị:
```
========================================================
🚀 KHỞI ĐỘNG HỆ THỐNG XÁC THỰC DISCORD - YOUTUBE
========================================================
🌐 Express Web Server đang chạy tại: http://localhost:3000
🔗 Callback URI OAuth2: http://localhost:3000/auth/google/callback
📺 Kênh YouTube mục tiêu: https://www.youtube.com/@donchoigame (ID: UCXg740yLabzMQbbdHUea_RQ)
⏳ Đang kết nối tới Discord Gateway...
🤖 Discord Bot đã đăng nhập thành công với tên: DCG Verifier#1234
```

---

## 🎯 Cách Hoạt Động Trên Discord

1. **Admin thiết lập kênh xác thực:**
   - Vào kênh Discord bạn muốn đặt tin nhắn xác thực (ví dụ: `#xac-thuc` hoặc `#verify`).
   - Gõ lệnh: `/setup-verify` và nhấn Enter.
   - Bot sẽ gửi một Embed thông tin kèm nút bấm **"▶️ Xác minh YouTube"**.

2. **Thành viên tiến hành xác thực:**
   - Thành viên bấm vào nút **"Xác minh YouTube"**.
   - Bot trả về một tin nhắn riêng tư (chỉ người đó nhìn thấy - Ephemeral) chứa nút: **"🔗 Đăng nhập Google để Xác minh"**.
   - Thành viên bấm vào link để mở trình duyệt, đăng nhập tài khoản Google và cho phép ứng dụng đọc danh sách đăng ký YouTube (`youtube.readonly`).
   - **Kết quả:**
     - **Nếu ĐÃ Subscribe:** Web hiển thị trang chúc mừng thành công với hiệu ứng đẹp mắt, Bot tự động cấp Role `Đã Xác Thực` và gửi DM chúc mừng.
     - **Nếu CHƯA Subscribe:** Web hiển thị thông báo chưa đăng ký, kèm nút bấm dẫn trực tiếp tới kênh YouTube Đốn Chơi Game để Subscribe và nút thử lại ngay sau khi đăng ký.

---

## 🌐 Triển Khai Cho Mọi Người Truy Cập (Đưa Ra Internet)

Khi chạy local (`http://localhost:3000`), chỉ máy của bạn mới vào được. Để các thành viên Discord khác có thể truy cập, bạn có 2 cách phổ biến:

### Cách 1: Dùng Cloudflare Tunnel (Miễn phí, an toàn & không đổi URL)
1. Cài đặt `cloudflared`.
2. Chạy lệnh: `cloudflared tunnel --url http://localhost:3000`
3. Bạn sẽ nhận được 1 link dạng: `https://ten-ngau-nhien.trycloudflare.com`.
4. Cập nhật vào `.env`:
   - `APP_URL=https://ten-ngau-nhien.trycloudflare.com`
   - `REDIRECT_URI=https://ten-ngau-nhien.trycloudflare.com/auth/google/callback`
5. Đồng thời vào **Google Cloud Console** -> **Credentials** -> Thêm link `https://ten-ngau-nhien.trycloudflare.com/auth/google/callback` vào mục **Authorized redirect URIs**.

### Cách 2: Triển khai lên VPS hoặc Hosting Node.js
- Đưa mã nguồn lên VPS (Ubuntu/Debian) hoặc Render/Railway.
- Trỏ Domain của bạn về IP/Server và cấu hình SSL HTTPS.
- Cập nhật `APP_URL` và `REDIRECT_URI` theo domain của bạn.
