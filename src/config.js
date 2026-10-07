require('dotenv').config();

const requiredEnv = [
  'DISCORD_BOT_TOKEN',
  'CLIENT_ID',
  'GUILD_ID',
  'VERIFIED_ROLE_ID',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'REDIRECT_URI',
  'YOUTUBE_CHANNEL_ID',
];

function validateConfig() {
  const missing = requiredEnv.filter((key) => !process.env[key] || process.env[key].trim() === '');
  if (missing.length > 0) {
    console.warn('\n⚠️ [CẢNH BÁO CẤU HÌNH] Các biến môi trường sau chưa được điền trong file .env:');
    missing.forEach((key) => console.warn(`   - ${key}`));
    console.warn('Vui lòng mở file .env và cập nhật đầy đủ các giá trị trước khi chạy!\n');
    return false;
  }
  return true;
}

module.exports = {
  validateConfig,
  discordBotToken: process.env.DISCORD_BOT_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  verifiedRoleId: process.env.VERIFIED_ROLE_ID,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
  youtubeChannelId: process.env.YOUTUBE_CHANNEL_ID || 'UCXg740yLabzMQbbdHUea_RQ',
  youtubeChannelUrl: 'https://www.youtube.com/@donchoigame',
  port: parseInt(process.env.PORT, 10) || 3000,
  appUrl: (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, ''),
};
