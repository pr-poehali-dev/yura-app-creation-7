// Simple XOR-based encryption with time-based key rotation (key changes every minute)
// In production, use proper E2E encryption like Signal Protocol

export function getCurrentMinuteKey(): string {
  const now = new Date();
  const minute = Math.floor(now.getTime() / 60000); // changes every minute
  return `SecureKey_${minute}_ChatApp`;
}

export function encryptMessage(text: string, key?: string): string {
  const encKey = key || getCurrentMinuteKey();
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ encKey.charCodeAt(i % encKey.length)
    );
  }
  return btoa(unescape(encodeURIComponent(result)));
}

export function decryptMessage(encoded: string, key?: string): string {
  try {
    const encKey = key || getCurrentMinuteKey();
    const text = decodeURIComponent(escape(atob(encoded)));
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ encKey.charCodeAt(i % encKey.length)
      );
    }
    return result;
  } catch {
    // Try previous minute key (in case message was sent just before key rotation)
    try {
      const now = new Date();
      const prevMinute = Math.floor(now.getTime() / 60000) - 1;
      const prevKey = `SecureKey_${prevMinute}_ChatApp`;
      const text = decodeURIComponent(escape(atob(encoded)));
      let result = "";
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ prevKey.charCodeAt(i % prevKey.length)
        );
      }
      return result;
    } catch {
      return "[Не удалось расшифровать]";
    }
  }
}

export function getSecondsUntilNextKey(): number {
  const now = new Date();
  return 60 - (Math.floor(now.getTime() / 1000) % 60);
}
