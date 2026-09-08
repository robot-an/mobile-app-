/**
 * Cấu hình đường dẫn tải ứng dụng Robot An cho iOS & Android
 * Hỗ trợ tự động chuyển hướng và tải ngay khi quét mã QR từ điện thoại
 */

export interface DownloadConfig {
  ios: {
    // 1. Link trực tiếp Apple App Store (khi app đã lên store)
    // Ví dụ: "https://apps.apple.com/app/robot-an/id6470000000"
    appStoreUrl: string;

    // 2. Link thử nghiệm Apple TestFlight
    // Ví dụ: "https://testflight.apple.com/join/xxxxxx"
    testFlightUrl: string;

    // 3. Link cài đặt trực tiếp không qua App Store (iOS Enterprise / Ad-Hoc OTA)
    // Cú pháp iOS OTA: "itms-services://?action=download-manifest&url=https://www.roboaian.com/ios/manifest.plist"
    otaManifestUrl: string;

    // 4. File cấu hình iOS WebClip cài trực tiếp icon lên màn hình chính iPhone (.mobileconfig)
    mobileConfigUrl: string;

    // Chế độ ưu tiên khi người dùng iOS quét mã:
    // 'auto' | 'appstore' | 'testflight' | 'ota' | 'mobileconfig' | 'pwa'
    primaryMethod: "auto" | "appstore" | "testflight" | "ota" | "mobileconfig" | "pwa";

    // Có mã hoá link App Store trực tiếp vào mã QR trên Landing Page không
    // (Nếu true, Camera iPhone quét sẽ hiện ngay banner App Store)
    directQrToStore: boolean;
  };

  android: {
    // 1. Link Google Play Store
    playStoreUrl: string;

    // 2. Link tải file APK cài trực tiếp
    directApkUrl: string;

    // Chế độ ưu tiên cho Android: 'playstore' | 'apk' | 'pwa'
    primaryMethod: "playstore" | "apk" | "pwa";
  };
}

export const APP_DOWNLOAD_CONFIG: DownloadConfig = {
  ios: {
    appStoreUrl:
      process.env.NEXT_PUBLIC_IOS_APP_STORE_URL ||
      "https://apps.apple.com/app/robot-an/id6470000000",
    testFlightUrl:
      process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL ||
      "https://testflight.apple.com/join/roboaian",
    otaManifestUrl:
      process.env.NEXT_PUBLIC_IOS_OTA_URL ||
      "",
    mobileConfigUrl: "/roboaian.mobileconfig",
    primaryMethod: (process.env.NEXT_PUBLIC_IOS_PRIMARY_METHOD as any) || "auto",
    directQrToStore: process.env.NEXT_PUBLIC_IOS_DIRECT_QR === "true",
  },

  android: {
    playStoreUrl:
      process.env.NEXT_PUBLIC_ANDROID_PLAY_STORE_URL ||
      "https://play.google.com/store/apps/details?id=com.roboaian.app",
    directApkUrl:
      process.env.NEXT_PUBLIC_ANDROID_APK_URL ||
      "/roboaian.apk",
    primaryMethod: "playstore",
  },
};

/**
 * Lấy URL đích tự động cho thiết bị iOS
 */
export function getIosTargetUrl(methodOverride?: string): string {
  const method = methodOverride || APP_DOWNLOAD_CONFIG.ios.primaryMethod;

  if (method === "appstore" && APP_DOWNLOAD_CONFIG.ios.appStoreUrl) {
    return APP_DOWNLOAD_CONFIG.ios.appStoreUrl;
  }
  if (method === "testflight" && APP_DOWNLOAD_CONFIG.ios.testFlightUrl) {
    return APP_DOWNLOAD_CONFIG.ios.testFlightUrl;
  }
  if (method === "ota" && APP_DOWNLOAD_CONFIG.ios.otaManifestUrl) {
    return APP_DOWNLOAD_CONFIG.ios.otaManifestUrl;
  }
  if (method === "mobileconfig") {
    return APP_DOWNLOAD_CONFIG.ios.mobileConfigUrl;
  }

  // Chế độ 'auto': ưu tiên App Store nếu có cấu hình biến môi trường, hoặc TestFlight, hoặc appStoreUrl
  if (process.env.NEXT_PUBLIC_IOS_APP_STORE_URL) {
    return process.env.NEXT_PUBLIC_IOS_APP_STORE_URL;
  }
  if (process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL) {
    return process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL;
  }

  return APP_DOWNLOAD_CONFIG.ios.appStoreUrl;
}
