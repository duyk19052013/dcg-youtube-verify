const config = require('./config');
const { client } = require('./bot');
const app = require('./server');

async function bootstrap() {
  console.log('========================================================');
  console.log('🚀 KHỞI ĐỘNG HỆ THỐNG XÁC THỰC DISCORD - YOUTUBE');
  console.log('========================================================');

  // Kiểm tra cấu hình .env
  const isConfigValid = config.validateConfig();

  // 1. Khởi động Web Server Express
  const server = app.listen(config.port, () => {
    console.log(`🌐 Express Web Server đang chạy tại: http://localhost:${config.port}`);
    console.log(`🔗 Callback URI OAuth2: ${config.redirectUri}`);
    console.log(`📺 Kênh YouTube mục tiêu: ${config.youtubeChannelUrl} (ID: ${config.youtubeChannelId})`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ [LỖI TRÙNG CỔNG MẠNG] Cổng ${config.port} đang bị chiếm giữ bởi một ứng dụng khác trên máy!`);
      console.error(`👉 Vui lòng đóng tiến trình đang chiếm cổng ${config.port} để Web Server có thể khởi động.\n`);
    } else {
      console.error('❌ Lỗi Web Server:', err);
    }
  });

  // 2. Đăng nhập Discord Bot
  if (config.discordBotToken && config.discordBotToken !== 'your_discord_bot_token_here') {
    try {
      console.log('⏳ Đang kết nối tới Discord Gateway...');
      await client.login(config.discordBotToken);
    } catch (err) {
      console.error('❌ Lỗi kết nối Discord Bot:', err.message);
      console.warn('👉 Vui lòng kiểm tra lại DISCORD_BOT_TOKEN trong file .env');
    }
  } else {
    console.warn('⚠️ DISCORD_BOT_TOKEN chưa được cung cấp. Bot chưa thể đăng nhập.');
  }

  // Bắt các lỗi unhandled
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection tại:', promise, 'Lý do:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
  });
}

bootstrap();
