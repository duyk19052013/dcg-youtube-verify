const express = require('express');
const config = require('./config');
const { generateAuthUrl, verifyAndExtractDiscordId, checkYouTubeSubscription } = require('./youtube');
const { assignVerifiedRole } = require('./bot');

const app = express();

/**
 * Giao diện HTML cơ sở hiện đại với Dark Mode và Glassmorphism
 */
function renderHtmlPage({ title, badgeText, badgeType, heading, description, buttons = [], footerText }) {
  const badgeColors = {
    success: 'background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3);',
    danger: 'background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);',
    warning: 'background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);',
    info: 'background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);',
  };

  const badgeStyle = badgeColors[badgeType] || badgeColors.info;

  const buttonsHtml = buttons
    .map((btn) => {
      const isPrimary = btn.primary;
      const btnStyle = isPrimary
        ? 'background: #dc2626; color: #ffffff; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);'
        : 'background: #374151; color: #f3f4f6;';
      return `<a href="${btn.href}" target="${btn.target || '_self'}" style="display: inline-block; padding: 12px 24px; border-radius: 10px; font-weight: 600; text-decoration: none; transition: all 0.2s; margin: 6px; ${btnStyle}">${btn.text}</a>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Hệ Thống Xác Minh</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: radial-gradient(circle at top, #1e1e2f, #0d0e15);
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: rgba(23, 25, 35, 0.85);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      max-width: 520px;
      width: 100%;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 20px;
      ${badgeStyle}
    }
    h1 {
      font-size: 1.6rem;
      font-weight: 700;
      margin-bottom: 14px;
      color: #ffffff;
      line-height: 1.3;
    }
    p {
      color: #94a3b8;
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .button-group {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 0.8rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    ${badgeText ? `<div class="badge">${badgeText}</div>` : ''}
    <h1>${heading}</h1>
    <p>${description}</p>
    <div class="button-group">
      ${buttonsHtml}
    </div>
    <div class="footer">
      ${footerText || 'Hệ thống tự động liên kết Discord & YouTube • Đốn Chơi Game'}
    </div>
  </div>
</body>
</html>`;
}

// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------

// Trang chủ kiểm tra trạng thái
app.get('/', (req, res) => {
  res.send(
    renderHtmlPage({
      title: 'Hệ Thống Xác Minh',
      badgeText: '🟢 Máy Chủ Đang Hoạt Động',
      badgeType: 'info',
      heading: 'Xác Minh Đăng Ký YouTube',
      description:
        'Hệ thống tự động kiểm tra người dùng Discord đã Subscribe kênh YouTube Đốn Chơi Game để cấp Role trong máy chủ.',
      buttons: [
        {
          text: '▶️ Xem Kênh Đốn Chơi Game',
          href: config.youtubeChannelUrl,
          primary: true,
          target: '_blank',
        },
      ],
      footerText: 'Vui lòng truy cập kênh Discord để nhận link xác minh cá nhân.',
    })
  );
});

// Trang Chính Sách Quyền Riêng Tư (Privacy Policy) cho Google OAuth
app.get('/privacy', (req, res) => {
  res.send(
    renderHtmlPage({
      title: 'Chính Sách Quyền Riêng Tư',
      badgeText: '🛡️ Privacy Policy',
      badgeType: 'info',
      heading: 'Chính Sách Quyền Riêng Tư',
      description:
        'Hệ thống xác thực sử dụng Google OAuth2 và YouTube Data API (youtube.readonly) duy nhất cho mục đích kiểm tra xem tài khoản người dùng đã đăng ký (Subscribe) kênh YouTube Đốn Chơi Game hay chưa để tự động cấp Role trên máy chủ Discord.<br><br>' +
        '<b>Cam kết bảo mật:</b><br>' +
        '• Chúng tôi không lưu trữ mật khẩu, email hoặc thông tin cá nhân của bạn.<br>' +
        '• Dữ liệu truy cập chỉ được sử dụng tức thời trong phiên kiểm tra và không chia sẻ cho bất kỳ bên thứ ba nào.',
      buttons: [
        {
          text: '🏠 Trang Chủ',
          href: '/',
          primary: true,
        },
      ],
      footerText: 'Chính sách bảo mật • Hệ thống xác thực Đốn Chơi Game',
    })
  );
});

// Trang Điều Khoản Dịch Vụ (Terms of Service) cho Google OAuth
app.get('/terms', (req, res) => {
  res.send(
    renderHtmlPage({
      title: 'Điều Khoản Dịch Vụ',
      badgeText: '📜 Terms of Service',
      badgeType: 'info',
      heading: 'Điều Khoản Dịch Vụ',
      description:
        'Bằng việc sử dụng công cụ xác thực này, bạn đồng ý cho phép ứng dụng đọc danh sách kênh YouTube đã đăng ký để hệ thống tự động xác nhận và cấp quyền truy cập trên máy chủ Discord tương ứng.',
      buttons: [
        {
          text: '🏠 Trang Chủ',
          href: '/',
          primary: true,
        },
      ],
      footerText: 'Điều khoản dịch vụ • Hệ thống xác thực Đốn Chơi Game',
    })
  );
});

// Khởi tạo luồng xác thực Google OAuth2
app.get('/auth/google', (req, res) => {
  const { discord_id } = req.query;

  if (!discord_id) {
    return res.status(400).send(
      renderHtmlPage({
        title: 'Thiếu Tham Số',
        badgeText: '⚠️ Lỗi Yêu Cầu',
        badgeType: 'warning',
        heading: 'Không Tìm Thấy ID Discord',
        description:
          'Yêu cầu xác minh không hợp lệ vì thiếu thông tin tài khoản Discord. Vui lòng quay lại Discord và nhấn lại nút "Xác minh YouTube".',
        buttons: [
          {
            text: 'Mở Discord',
            href: 'https://discord.com/app',
            primary: false,
          },
        ],
      })
    );
  }

  // Chuyển hướng người dùng đến trang đăng nhập Google
  const authUrl = generateAuthUrl(discord_id);
  res.redirect(authUrl);
});

// Callback nhận mã từ Google sau khi người dùng đồng ý cấp quyền
app.get('/auth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // Người dùng từ chối cấp quyền trên màn hình Google
  if (error) {
    return res.status(400).send(
      renderHtmlPage({
        title: 'Từ Chối Quyền',
        badgeText: '❌ Hủy Yêu Cầu',
        badgeType: 'danger',
        heading: 'Bạn Đã Từ Chối Cấp Quyền',
        description:
          'Hệ thống chỉ yêu cầu quyền xem danh sách đăng ký (Read-Only) để kiểm tra bạn đã Subscribe kênh hay chưa. Không có quyền sửa đổi nào được cấp.',
        buttons: [
          {
            text: '🔄 Thử Xác Minh Lại',
            href: '/',
            primary: true,
          },
        ],
      })
    );
  }

  // Giải mã và kiểm tra state (chứa discordId)
  const discordId = verifyAndExtractDiscordId(state);
  if (!discordId) {
    return res.status(400).send(
      renderHtmlPage({
        title: 'Phiên Hết Hạn',
        badgeText: '⚠️ Phiên Không Hợp Lệ',
        badgeType: 'warning',
        heading: 'Phiên Xác Thực Đã Hết Hạn',
        description:
          'Mã xác thực của bạn đã quá hạn hoặc không đúng. Vui lòng quay lại Discord và bấm lại nút "Xác minh YouTube" để nhận link mới.',
      })
    );
  }

  try {
    // Kiểm tra đăng ký kênh YouTube
    const { isSubscribed, googleUserName, error: ytError } = await checkYouTubeSubscription(code);

    if (ytError) {
      return res.status(200).send(
        renderHtmlPage({
          title: 'Chưa Đăng Ký Kênh',
          badgeText: '⚠️ Chưa Có Dữ Liệu',
          badgeType: 'warning',
          heading: `Xin chào, ${googleUserName}!`,
          description: ytError,
          buttons: [
            {
              text: '👉 Đăng Ký Kênh Ngay',
              href: `${config.youtubeChannelUrl}?sub_confirmation=1`,
              primary: true,
              target: '_blank',
            },
            {
              text: '🔄 Thử Xác Minh Lại',
              href: `/auth/google?discord_id=${discordId}`,
              primary: false,
            },
          ],
        })
      );
    }

    if (!isSubscribed) {
      // Chưa đăng ký kênh
      return res.status(200).send(
        renderHtmlPage({
          title: 'Chưa Đăng Ký Kênh',
          badgeText: '❌ Chưa Subscribe',
          badgeType: 'danger',
          heading: `Xin chào, ${googleUserName}!`,
          description:
            'Tài khoản Google của bạn hiện **chưa Đăng ký (Subscribe)** kênh YouTube **Đốn Chơi Game**.<br><br>' +
            'Vui lòng nhấn nút đăng ký bên dưới, sau đó bấm <b>"Tôi Đã Đăng Ký - Thử Lại"</b>.',
          buttons: [
            {
              text: '👉 Đăng Ký Kênh YouTube',
              href: `${config.youtubeChannelUrl}?sub_confirmation=1`,
              primary: true,
              target: '_blank',
            },
            {
              text: '🔄 Tôi Đã Đăng Ký - Thử Lại',
              href: `/auth/google?discord_id=${discordId}`,
              primary: false,
            },
          ],
        })
      );
    }

    // Đã đăng ký -> Tiến hành cấp Role Discord
    const roleResult = await assignVerifiedRole(discordId);

    if (!roleResult.success) {
      return res.status(500).send(
        renderHtmlPage({
          title: 'Lỗi Cấp Role',
          badgeText: '⚠️ Cần Hỗ Trợ',
          badgeType: 'warning',
          heading: 'Đã Đăng Ký Kênh Nhưng Lỗi Cấp Role',
          description: `Tài khoản Google của bạn đã Subscribe thành công, nhưng hệ thống gặp lỗi khi cấp Role trên Discord:<br><br><code>${roleResult.error}</code><br><br>Vui lòng báo cho Quản trị viên máy chủ Discord.`,
        })
      );
    }

    // Cấp Role thành công!
    return res.status(200).send(
      renderHtmlPage({
        title: 'Xác Minh Thành Công',
        badgeText: '✅ Xác Minh Hoàn Tất',
        badgeType: 'success',
        heading: `🎉 Chúc mừng ${roleResult.memberUsername}!`,
        description:
          `Hệ thống đã xác nhận bạn đã Đăng ký kênh **Đốn Chơi Game** thành công!<br><br>` +
          `Role <b>${roleResult.roleName}</b> đã được trao cho bạn trên server Discord.<br><br>` +
          `Bây giờ bạn có thể đóng tab này và quay lại Discord để tận hưởng đầy đủ quyền lợi!`,
        buttons: [
          {
            text: '💬 Quay Lại Discord',
            href: 'https://discord.com/app',
            primary: true,
          },
        ],
      })
    );
  } catch (error) {
    console.error('❌ Lỗi xử lý callback Google OAuth2:', error);
    return res.status(500).send(
      renderHtmlPage({
        title: 'Lỗi Hệ Thống',
        badgeText: '❌ Lỗi Xử Lý',
        badgeType: 'danger',
        heading: 'Đã Xảy Ra Lỗi',
        description: `Đã xảy ra lỗi trong quá trình xử lý với Google API:<br><br><code>${error.message || 'Lỗi không xác định'}</code>`,
        buttons: [
          {
            text: '🔄 Thử Lại',
            href: `/auth/google?discord_id=${discordId}`,
            primary: false,
          },
        ],
      })
    );
  }
});

module.exports = app;
