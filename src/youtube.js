const crypto = require('crypto');
const { google } = require('googleapis');
const config = require('./config');

function getOAuth2Client() {
  return new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    config.redirectUri
  );
}

/**
 * Tạo chuỗi state bảo mật được mã hóa và ký bằng HMAC
 * để tránh giả mạo discordId trong quá trình chuyển hướng OAuth2.
 */
function createSignedState(discordId) {
  const payload = JSON.stringify({
    discordId,
    time: Date.now(),
  });
  const signature = crypto
    .createHmac('sha256', config.googleClientSecret || 'default_secret')
    .update(payload)
    .digest('hex');

  const container = JSON.stringify({ payload, sig: signature });
  return Buffer.from(container, 'utf8').toString('base64url');
}

/**
 * Xác thực chuỗi state trả về từ Google OAuth2
 * Kiểm tra chữ ký HMAC và hạn sử dụng (15 phút).
 */
function verifyAndExtractDiscordId(stateStr) {
  if (!stateStr) return null;
  try {
    const raw = Buffer.from(stateStr, 'base64url').toString('utf8');
    const { payload, sig } = JSON.parse(raw);

    const expectedSig = crypto
      .createHmac('sha256', config.googleClientSecret || 'default_secret')
      .update(payload)
      .digest('hex');

    if (sig !== expectedSig) {
      console.warn('⚠️ [OAuth2] Chữ ký state không hợp lệ!');
      return null;
    }

    const data = JSON.parse(payload);
    // Hết hạn sau 15 phút
    if (Date.now() - data.time > 15 * 60 * 1000) {
      console.warn('⚠️ [OAuth2] Phiên xác thực state đã hết hạn (> 15 phút)!');
      return null;
    }

    return data.discordId;
  } catch (error) {
    console.error('❌ [OAuth2] Lỗi giải mã state:', error.message);
    return null;
  }
}

/**
 * Tạo URL chuyển hướng tới Google OAuth2
 */
function generateAuthUrl(discordId) {
  const oauth2Client = getOAuth2Client();
  const state = createSignedState(discordId);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    state: state,
    prompt: 'consent', // Đảm bảo luôn hiển thị màn hình chọn tài khoản nếu có
  });

  return authUrl;
}

/**
 * Đổi authorization code lấy access token và kiểm tra xem người dùng
 * đã bấm Đăng ký (Subscribe) kênh YouTube chỉ định hay chưa.
 */
async function checkYouTubeSubscription(authCode) {
  const oauth2Client = getOAuth2Client();

  // 1. Đổi code lấy token
  const { tokens } = await oauth2Client.getToken(authCode);
  oauth2Client.setCredentials(tokens);

  // 2. Lấy thông tin cơ bản của user Google (tên tài khoản Google)
  let googleUserName = 'Bạn';
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    if (userInfo.data && userInfo.data.name) {
      googleUserName = userInfo.data.name;
    }
  } catch (err) {
    // Không chặn luồng nếu lấy profile thất bại
    console.warn('Không lấy được tên tài khoản Google:', err.message);
  }

  // 3. Khởi tạo YouTube client
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  try {
    // Gọi endpoint subscriptions.list với mine=true và forChannelId
    const response = await youtube.subscriptions.list({
      part: ['snippet'],
      mine: true,
      forChannelId: config.youtubeChannelId,
      maxResults: 1,
    });

    const items = response.data.items || [];
    const isSubscribed = items.length > 0;

    return {
      isSubscribed,
      googleUserName,
      subscriptionInfo: isSubscribed ? items[0] : null,
    };
  } catch (apiError) {
    // Nếu tài khoản Google chưa kích hoạt / chưa có kênh YouTube
    const errorDetails = apiError.response?.data?.error;
    if (errorDetails?.code === 404 || errorDetails?.errors?.[0]?.reason === 'channelNotFound') {
      return {
        isSubscribed: false,
        googleUserName,
        error: 'Tài khoản Google này chưa có hồ sơ kênh YouTube hoặc chưa từng đăng ký kênh nào.',
      };
    }
    throw apiError;
  }
}

module.exports = {
  getOAuth2Client,
  generateAuthUrl,
  verifyAndExtractDiscordId,
  checkYouTubeSubscription,
};
