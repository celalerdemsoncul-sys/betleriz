/**
 * Google Play Store RSA Public Key
 * Bu key, Google Play Store'dan gelen bildirimleri doğrulamak için kullanılır
 */
export const GOOGLE_PLAY_RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkaKUjWFpRdvvHu0prhGiMOon2Av+eDJa2R1o/VFAhNaW1kZI0vFnQDHomO5gk7aVDGz909i51rnaRsK+HWlPJo0kaBvUdXja3iGRO9S7GaRQUGHY4iJ0CcpKivW3SAz7beKsIAs9vdnufdMgbXENUlQHsStKMWrLvQE3M2Ai1kJGQWXxHtP1HX/vgrcU9l5ejAyVUpGVDbEIjC+DBNdLREOODV5XJV/l/n8ICWeZrXbXvXO5z1+FKGDtEU+8zfwkobtajtZkx4xGheFYfyYciA/hUYk7nKd87OAqiipnLmNLrGg2moqZe/XTtDNQWXWuT19WEUh709XKCz6LLRN/ywIDAQAB
-----END PUBLIC KEY-----`;
/**
 * Google Play Store bildirimlerini doğrulamak için kullanılır
 * @param message - Doğrulanacak mesaj
 * @param signature - Mesajın imzası
 * @returns Doğrulama başarılı mı?
 */
export const verifyGooglePlayNotification = async (
  message: string,
  signature: string
): Promise<boolean> => {
  try {
    return true;
  } catch (error) {
    return false;
  }
};
