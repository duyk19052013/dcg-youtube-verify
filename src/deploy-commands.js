const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('./config');

const commands = [
  new SlashCommandBuilder()
    .setName('setup-verify')
    .setDescription('Gửi bảng tin xác minh YouTube Đốn Chơi Game kèm nút bấm vào kênh này')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
].map((command) => command.toJSON());

async function deploy() {
  if (!config.discordBotToken || !config.clientId || !config.guildId) {
    console.error('❌ Vui lòng điền DISCORD_BOT_TOKEN, CLIENT_ID, và GUILD_ID trong file .env trước khi chạy lệnh này!');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(config.discordBotToken);

  try {
    console.log('⏳ Đang đăng ký Slash Command (/setup-verify) lên Server Discord...');

    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log('✅ Đã đăng ký thành công Slash Command cho Server!');
    console.log('👉 Bây giờ bạn có thể vào kênh Discord mong muốn và gõ: /setup-verify');
  } catch (error) {
    console.error('❌ Lỗi khi đăng ký Slash Command:', error);
  }
}

deploy();
