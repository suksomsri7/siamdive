// 3-layer bot detection. Returns true when the traffic looks like a bot.
// We still INSERT bot rows (marked isBot=true) so we can debug / whitelist
// issues later — dashboard queries filter isBot=false.

const BOT_RX = /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|slackbot|discordbot|telegrambot|whatsapp|linkedinbot|twitterbot|pinterestbot|yandex|duckduckbot|semrush|ahrefs|mj12|petalbot|uptimerobot|headlesschrome|phantomjs|puppeteer|playwright|selenium|chrome-lighthouse|gpt|anthropic|perplexity|claude|archive\.org|lighthouse/i;

const BROWSER_HINT_RX = /mozilla|applewebkit|gecko|trident/i;

export function isBotUa(ua: string | null | undefined): boolean {
  if (!ua) return true;                       // no UA = definitely not a real browser
  if (BOT_RX.test(ua)) return true;
  if (!BROWSER_HINT_RX.test(ua)) return true; // must look like a real browser
  return false;
}
