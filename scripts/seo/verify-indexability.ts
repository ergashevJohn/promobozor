import { readFile } from "node:fs/promises";

type CliOptions = {
  filePath?: string;
  urls: string[];
};

type UrlCheckResult = {
  inputUrl: string;
  status: number | null;
  finalUrl: string | null;
  xRobotsTag: string | null;
  metaRobots: string | null;
  canonical: string | null;
  hreflang: Record<string, string>;
  noindexDetected: boolean;
  error: string | null;
};

function parseArgs(args: string[]): CliOptions {
  const urls: string[] = [];
  let filePath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--file") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("Missing value for --file");
      }
      filePath = value;
      index += 1;
      continue;
    }

    if (argument.startsWith("--file=")) {
      filePath = argument.slice("--file=".length);
      continue;
    }

    if (argument.startsWith("--")) {
      throw new Error(`Unknown flag: ${argument}`);
    }

    urls.push(argument);
  }

  return { filePath, urls };
}

function normalizeInputLines(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

async function getUrlsFromFile(filePath: string): Promise<string[]> {
  const content = await readFile(filePath, "utf8");
  return normalizeInputLines(content);
}

function extractAttr(tag: string, attrName: string): string | null {
  const regex = new RegExp(`${attrName}\\s*=\\s*["']([^"']+)["']`, "i");
  const match = tag.match(regex);
  return match?.[1] ?? null;
}

function extractMetaContentByName(html: string, name: string): string | null {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const targetName = name.toLowerCase();

  for (const tag of metaTags) {
    const currentName = extractAttr(tag, "name")?.toLowerCase();
    if (currentName === targetName) {
      return extractAttr(tag, "content");
    }
  }

  return null;
}

function extractCanonicalLink(html: string): string | null {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of linkTags) {
    const rel = extractAttr(tag, "rel");
    if (!rel) {
      continue;
    }

    const relTokens = rel.toLowerCase().split(/\s+/).filter(Boolean);
    if (relTokens.includes("canonical")) {
      return extractAttr(tag, "href");
    }
  }

  return null;
}

function extractHreflangMap(html: string): Record<string, string> {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  const map: Record<string, string> = {};

  for (const tag of linkTags) {
    const rel = extractAttr(tag, "rel")?.toLowerCase();
    if (rel !== "alternate") continue;
    const hreflang = extractAttr(tag, "hreflang");
    const href = extractAttr(tag, "href");
    if (hreflang && href) {
      map[hreflang.toLowerCase()] = href;
    }
  }

  return map;
}

function hasNoindexDirective(...values: Array<string | null>): boolean {
  return values.some((value) => value?.toLowerCase().includes("noindex"));
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function checkUrl(inputUrl: string): Promise<UrlCheckResult> {
  if (!isValidUrl(inputUrl)) {
    return {
      inputUrl,
      status: null,
      finalUrl: null,
      xRobotsTag: null,
      metaRobots: null,
      canonical: null,
      hreflang: {},
      noindexDetected: false,
      error: "Invalid URL format. Expected absolute URL (e.g. https://example.com/page).",
    };
  }

  try {
    const response = await fetch(inputUrl, {
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; PromoBozorSEOChecker/1.0)",
      },
    });
    const html = await response.text();

    const xRobotsTag = response.headers.get("x-robots-tag");
    const metaRobots = extractMetaContentByName(html, "robots");
    const canonical = extractCanonicalLink(html);
    const hreflang = extractHreflangMap(html);
    const noindexDetected = hasNoindexDirective(xRobotsTag, metaRobots);

    return {
      inputUrl,
      status: response.status,
      finalUrl: response.url || null,
      xRobotsTag,
      metaRobots,
      canonical,
      hreflang,
      noindexDetected,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      inputUrl,
      status: null,
      finalUrl: null,
      xRobotsTag: null,
      metaRobots: null,
      canonical: null,
      hreflang: {},
      noindexDetected: false,
      error: message,
    };
  }
}

function printResults(results: UrlCheckResult[]): void {
  for (const result of results) {
    console.log(`URL: ${result.inputUrl}`);
    console.log(`status: ${result.status ?? "-"}`);
    console.log(`final URL: ${result.finalUrl ?? "-"}`);
    console.log(`x-robots-tag: ${result.xRobotsTag ?? "-"}`);
    console.log(`meta robots: ${result.metaRobots ?? "-"}`);
    console.log(`canonical: ${result.canonical ?? "-"}`);
    const hreflangKeys = Object.keys(result.hreflang);
    if (hreflangKeys.length > 0) {
      console.log(
        `hreflang: ${hreflangKeys
          .sort()
          .map((key) => `${key}=${result.hreflang[key]}`)
          .join(" | ")}`
      );
      const hasLocales = ["uz", "ru", "en", "x-default"].every((key) => hreflangKeys.includes(key));
      console.log(`hreflang reciprocal set: ${hasLocales ? "yes" : "incomplete"}`);
    } else {
      console.log("hreflang: -");
    }
    console.log(`noindex detected: ${result.noindexDetected ? "yes" : "no"}`);
    if (result.error) {
      console.log(`error: ${result.error}`);
    }
    console.log("---");
  }

  const noindexCount = results.filter((result) => result.noindexDetected).length;
  const errorCount = results.filter((result) => result.error !== null).length;
  console.log(`Summary: checked=${results.length}, noindex=${noindexCount}, errors=${errorCount}`);
}

function printUsage(): void {
  console.log("Usage:");
  console.log("  npm run seo:verify -- <url1> <url2> ...");
  console.log("  npm run seo:verify -- --file <path-to-url-list.txt>");
  console.log("  npm run seo:verify -- --file <path> <url1> <url2> ...");
}

async function main(): Promise<void> {
  let options: CliOptions;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid arguments";
    console.error(`Argument error: ${message}`);
    printUsage();
    process.exitCode = 1;
    return;
  }

  const fileUrls = options.filePath ? await getUrlsFromFile(options.filePath) : [];
  const allUrls = [...fileUrls, ...options.urls];
  const uniqueUrls = [...new Set(allUrls.map((url) => url.trim()).filter(Boolean))];

  if (uniqueUrls.length === 0) {
    console.error("No URLs provided.");
    printUsage();
    process.exitCode = 1;
    return;
  }

  const results: UrlCheckResult[] = [];
  for (const url of uniqueUrls) {
    results.push(await checkUrl(url));
  }

  printResults(results);

  if (results.some((result) => result.error !== null)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Unexpected error: ${message}`);
  process.exitCode = 1;
});
