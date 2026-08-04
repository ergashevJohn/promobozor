import { readFile, stat } from "node:fs/promises";
import path from "node:path";

type Args = Record<string, string>;

type TelegramApiResult = {
  ok: boolean;
  description?: string;
  result?: unknown;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;

    const key = token.slice(2);
    const value = argv[i + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for argument --${key}`);
    }

    args[key] = value;
    i += 1;
  }

  return args;
}

function requiredArg(args: Args, key: string): string {
  const value = args[key];
  if (!value) {
    throw new Error(`Required argument is missing: --${key}`);
  }
  return value;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "unknown";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let idx = 0;

  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }

  const fixed = idx === 0 ? value.toFixed(0) : value.toFixed(2);
  return `${fixed} ${units[idx]}`;
}

async function callTelegramApi(
  apiBaseUrl: string,
  token: string,
  method: string,
  init: RequestInit
): Promise<TelegramApiResult> {
  const url = `${apiBaseUrl.replace(/\/$/, "")}/bot${token}/${method}`;
  const response = await fetch(url, init);
  const text = await response.text();

  let payload: TelegramApiResult | null = null;
  try {
    payload = JSON.parse(text) as TelegramApiResult;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    const reason = payload?.description || text || `HTTP ${response.status}`;
    throw new Error(`Telegram ${method} failed: ${reason}`);
  }

  return payload;
}

async function sendMessage(
  apiBaseUrl: string,
  token: string,
  chatId: string,
  htmlText: string
): Promise<void> {
  const body = new URLSearchParams();
  body.set("chat_id", chatId);
  body.set("text", htmlText);
  body.set("parse_mode", "HTML");
  body.set("disable_web_page_preview", "true");

  await callTelegramApi(apiBaseUrl, token, "sendMessage", {
    method: "POST",
    body,
  });
}

async function sendDocument(
  apiBaseUrl: string,
  token: string,
  chatId: string,
  filePath: string,
  caption: string
): Promise<void> {
  const raw = await readFile(filePath);
  const fileName = path.basename(filePath);

  const body = new FormData();
  body.set("chat_id", chatId);
  body.set("caption", caption.slice(0, 1024));
  body.set("parse_mode", "HTML");
  body.set("document", new Blob([raw]), fileName);

  await callTelegramApi(apiBaseUrl, token, "sendDocument", {
    method: "POST",
    body,
  });
}

function isFileTooBigError(err: unknown): boolean {
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    message.includes("too big") ||
    message.includes("request entity too large") ||
    message.includes("413")
  );
}

function buildFallbackMessage(input: {
  fileName: string;
  fileSizeBytes: number;
  objectKey: string;
  checksum: string;
  bucket?: string;
  endpoint?: string;
  region?: string;
  timestampUtc?: string;
  reason: string;
}): string {
  const location = input.bucket ? `s3://${input.bucket}/${input.objectKey}` : input.objectKey;

  const lines = [
    "<b>DB backup completed (secondary metadata)</b>",
    `Reason: ${escapeHtml(input.reason)}`,
    `File: <code>${escapeHtml(input.fileName)}</code>`,
    `Size: <code>${escapeHtml(formatBytes(input.fileSizeBytes))}</code>`,
    `SHA256: <code>${escapeHtml(input.checksum)}</code>`,
    `Object: <code>${escapeHtml(location)}</code>`,
  ];

  if (input.region) {
    lines.push(`Region: <code>${escapeHtml(input.region)}</code>`);
  }

  if (input.endpoint) {
    lines.push(`Endpoint: <code>${escapeHtml(input.endpoint)}</code>`);
  }

  if (input.timestampUtc) {
    lines.push(`UTC time: <code>${escapeHtml(input.timestampUtc)}</code>`);
  }

  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const filePath = requiredArg(args, "file");
  const objectKey = requiredArg(args, "object-key");
  const checksum = requiredArg(args, "checksum");

  const token = process.env.BACKUP_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.BACKUP_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error(
      "BACKUP_TELEGRAM_BOT_TOKEN and BACKUP_TELEGRAM_CHAT_ID must be set for Telegram copy"
    );
  }

  const apiBaseUrl = process.env.TELEGRAM_API_BASE_URL || "https://api.telegram.org";
  const configuredMax = Number(process.env.TELEGRAM_MAX_FILE_SIZE_BYTES || "51380224");
  const maxFileSizeBytes =
    Number.isFinite(configuredMax) && configuredMax > 0 ? configuredMax : 51380224;

  const fileName = path.basename(filePath);
  const fileStats = await stat(filePath);
  const fileSizeBytes = Number(args["size-bytes"] || fileStats.size);
  const bucket = args.bucket;
  const endpoint = args.endpoint;
  const region = args.region;
  const timestampUtc = args["timestamp-utc"];

  if (fileSizeBytes > maxFileSizeBytes) {
    const text = buildFallbackMessage({
      fileName,
      fileSizeBytes,
      objectKey,
      checksum,
      bucket,
      endpoint,
      region,
      timestampUtc,
      reason: `File size exceeds Telegram limit (${formatBytes(maxFileSizeBytes)})`,
    });

    await sendMessage(apiBaseUrl, token, chatId, text);
    console.log("Telegram fallback metadata sent (file exceeds configured limit).");
    return;
  }

  const location = bucket ? `s3://${bucket}/${objectKey}` : objectKey;
  const caption = [
    "<b>DB backup (secondary copy)</b>",
    `File: <code>${escapeHtml(fileName)}</code>`,
    `SHA256: <code>${escapeHtml(checksum)}</code>`,
    `Object: <code>${escapeHtml(location)}</code>`,
  ].join("\n");

  try {
    await sendDocument(apiBaseUrl, token, chatId, filePath, caption);
    console.log("Telegram document sent successfully.");
  } catch (error) {
    if (!isFileTooBigError(error)) {
      throw error;
    }

    const text = buildFallbackMessage({
      fileName,
      fileSizeBytes,
      objectKey,
      checksum,
      bucket,
      endpoint,
      region,
      timestampUtc,
      reason: "Telegram API rejected file upload due to file size",
    });

    await sendMessage(apiBaseUrl, token, chatId, text);
    console.log("Telegram fallback metadata sent after file-too-large API response.");
  }
}

main().catch((error) => {
  console.error("Failed to send Telegram backup copy:", error);
  process.exit(1);
});
