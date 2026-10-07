const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const config = require('./config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Cần bật Server Members Intent trong Discord Developer Portal
  ],
});

// Sự kiện khi Bot sẵn sàng hoạt động
client.once('ready', () => {
  console.log(`🤖 Discord Bot đã đăng nhập thành công với tên: ${client.user.tag}`);
  console.log(`📡 Đang phục vụ server ID: ${config.guildId || 'Chưa cấu hình'}`);
});

// Xử lý các tương tác (Slash command và Nút bấm)
client.on('interactionCreate', async (interaction) => {
  try {
    // 1. Xử lý Slash Command /setup-verify
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'setup-verify') {
        // Phản hồi ngay lập tức để tránh lỗi "Ứng dụng không phản hồi" sau 3 giây
        await interaction.deferReply({ ephemeral: true });

        // Kiểm tra quyền Administrator của người dùng
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          return interaction.editReply({
            content: '❌ Bạn cần có quyền Quản trị viên (Administrator) để dùng lệnh này!',
          });
        }

        // Kiểm tra quyền của Bot trong kênh hiện tại
        const botPerms = interaction.channel.permissionsFor(client.user);
        if (!botPerms || !botPerms.has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
          return interaction.editReply({
            content:
              `❌ **Bot bị thiếu quyền trong kênh này!**\n\n` +
              `Trong kênh <#${interaction.channelId}>, Bot chưa có đủ quyền để gửi bảng tin.\n` +
              `👉 **Cách khắc phục:**\n` +
              `1. Chuột phải vào kênh này -> Chọn **Chỉnh sửa kênh (Edit Channel)** -> **Quyền (Permissions)**.\n` +
              `2. Thêm Role của Bot hoặc thêm Bot vào, và **BẬT (Tích xanh)** các quyền sau:\n` +
              `   • **Xem kênh (View Channel)**\n` +
              `   • **Gửi tin nhắn (Send Messages)**\n` +
              `   • **Chèn liên kết (Embed Links)**`,
          });
        }

        const embed = new EmbedBuilder()
          .setTitle('🔴 XÁC MINH KÊNH YOUTUBE ĐỐN CHƠI GAME')
          .setDescription(
            'Chào mừng bạn đến với máy chủ Discord! 🎮\n\n' +
            'Để mở khóa các kênh trò chuyện và nhận Role **Đã Xác Thực**, bạn cần Đăng ký (Subscribe) kênh YouTube **Đốn Chơi Game**.\n\n' +
            '📌 **Các bước thực hiện:**\n' +
            '1️⃣ Nhấn vào nút **"Xác minh YouTube"** bên dưới.\n' +
            '2️⃣ Nhấn vào liên kết xác thực riêng tư được gửi đến bạn.\n' +
            '3️⃣ Đăng nhập tài khoản Google và cho phép kiểm tra lượt đăng ký.\n' +
            '4️⃣ Hệ thống sẽ tự động cấp Role ngay khi hoàn tất!\n\n' +
            `🔗 **Kênh YouTube:** [Đốn Chơi Game](${config.youtubeChannelUrl})`
          )
          .setColor(0xFF0000)
          .setThumbnail('https://yt3.googleusercontent.com/7IOqt1dbuZXEwPId9mD-tDxtcAIOR7Bj8_aOBGxl9tGcWtJK50RPLEfyAOVvcBGBawKfhG6kOJI=s200-c-k-c0x00ffffff-no-rj')
          .setFooter({
            text: 'Hệ thống xác thực tự động • Đốn Chơi Game',
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_verify_youtube')
            .setLabel('Xác minh YouTube')
            .setStyle(ButtonStyle.Success)
            .setEmoji('▶️')
        );

        try {
          await interaction.channel.send({
            embeds: [embed],
            components: [row],
          });

          return interaction.editReply({
            content: '✅ Đã gửi bảng tin xác minh thành công vào kênh này!',
          });
        } catch (sendErr) {
          console.error('❌ Lỗi gửi tin nhắn vào kênh:', sendErr);
          return interaction.editReply({
            content: `❌ Không thể gửi tin nhắn vào kênh do thiếu quyền: \`${sendErr.message}\``,
          });
        }
      }
    }

    // 2. Xử lý khi người dùng bấm nút "Xác minh YouTube"
    if (interaction.isButton()) {
      if (interaction.customId === 'btn_verify_youtube') {
        await interaction.deferReply({ ephemeral: true });

        const member = interaction.member;

        // Kiểm tra xem thành viên đã có role xác minh chưa
        if (member.roles.cache.has(config.verifiedRoleId)) {
          return interaction.editReply({
            content: '🎉 Bạn đã được xác thực từ trước và đang sở hữu Role này rồi!',
          });
        }

        // Tạo liên kết dẫn đến Web Server Express
        const verifyUrl = `${config.appUrl}/auth/google?discord_id=${interaction.user.id}`;

        const replyEmbed = new EmbedBuilder()
          .setTitle('🔐 Xác Minh Tài Khoản YouTube')
          .setDescription(
            `Xin chào **${interaction.user.username}**!\n\n` +
            'Vui lòng nhấn vào nút bên dưới để tiến hành kết nối tài khoản Google của bạn.\n\n' +
            '⚠️ **Lưu ý:**\n' +
            '• Hãy đăng nhập đúng tài khoản Google/YouTube mà bạn đã bấm Đăng ký kênh **Đốn Chơi Game**.\n' +
            '• Liên kết này dành riêng cho bạn và sẽ hết hạn sau **15 phút**.'
          )
          .setColor(0x5865F2);

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Đăng nhập Google để Xác minh')
            .setStyle(ButtonStyle.Link)
            .setURL(verifyUrl)
            .setEmoji('🔗')
        );

        return interaction.editReply({
          embeds: [replyEmbed],
          components: [actionRow],
        });
      }
    }
  } catch (error) {
    console.error('❌ Lỗi xử lý tương tác Discord:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: '❌ Đã có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại sau!',
      }).catch(() => {});
    }
  }
});

/**
 * Cấp role cho thành viên Discord sau khi xác minh thành công
 */
async function assignVerifiedRole(discordUserId) {
  try {
    const guild = await client.guilds.fetch(config.guildId);
    if (!guild) {
      throw new Error(`Không tìm thấy Guild Discord với ID: ${config.guildId}`);
    }

    // Lấy thông tin thành viên
    const member = await guild.members.fetch(discordUserId).catch(() => null);
    if (!member) {
      return {
        success: false,
        error: 'Không tìm thấy bạn trong server Discord! Vui lòng tham gia server trước khi xác minh.',
      };
    }

    // Lấy thông tin role
    const role = guild.roles.cache.get(config.verifiedRoleId) || (await guild.roles.fetch(config.verifiedRoleId).catch(() => null));
    if (!role) {
      throw new Error(`Không tìm thấy Role với ID: ${config.verifiedRoleId} trên Server!`);
    }

    // Kiểm tra Role Hierarchy (Thứ bậc Role)
    const botMember = await guild.members.fetchMe();
    if (botMember.roles.highest.position <= role.position) {
      throw new Error(
        `[Role Hierarchy Error] Role của Bot (${botMember.roles.highest.name}) đang ở vị trí thấp hơn hoặc bằng Role cần cấp (${role.name}). ` +
        `Vui lòng vào Server Settings -> Roles và kéo Role của Bot lên trên Role cần cấp!`
      );
    }

    // Nếu đã có role
    if (member.roles.cache.has(config.verifiedRoleId)) {
      return {
        success: true,
        alreadyHadRole: true,
        memberUsername: member.user.username,
        roleName: role.name,
      };
    }

    // Cấp role cho thành viên
    await member.roles.add(config.verifiedRoleId, 'Đã xác minh Subscribe kênh YouTube Đốn Chơi Game');

    // Gửi tin nhắn DM riêng cho thành viên (nếu mở DM)
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle('🎉 Xác Minh Thành Công!')
        .setDescription(
          `Chúc mừng bạn đã xác minh đăng ký kênh YouTube **Đốn Chơi Game** thành công!\n` +
          `Role **${role.name}** đã được cấp cho bạn tại server **${guild.name}**.`
        )
        .setColor(0x57F287)
        .setTimestamp();
      await member.send({ embeds: [dmEmbed] });
    } catch {
      // Người dùng tắt DM từ người lạ - không ảnh hưởng kết quả
    }

    return {
      success: true,
      alreadyHadRole: false,
      memberUsername: member.user.username,
      roleName: role.name,
    };
  } catch (error) {
    console.error('❌ Lỗi khi cấp Role trên Discord:', error);
    return {
      success: false,
      error: error.message || 'Lỗi không xác định khi cấp role trên Discord.',
    };
  }
}

module.exports = {
  client,
  assignVerifiedRole,
};
