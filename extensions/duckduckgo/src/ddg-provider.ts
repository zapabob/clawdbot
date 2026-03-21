/**
 * DuckDuckGo web search provider for OpenClaw.
 * Uses the public DuckDuckGo HTML search endpoint — no API key required.
 */
import type {
  WebSearchProviderPlugin,
  WebSearchProviderToolDefinition,
} from "openclaw/plugin-sdk/provider-web-search";

const DDG_HTML_URL = "https://html.duckduckgo.com/html/";
const DDG_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const DEFAULT_COUNT = 8;
const MAX_COUNT = 20;
const DEFAULT_TIMEOUT_MS = 15_000;

type SearchResult = {
  title: string;
  url: string;
  description: string;
};

function extractRedirectUrl(href: string): string {
  // DDG wraps URLs as: //duckduckgo.com/l/?uddg=ENCODED_URL&...
  if (href.includes("uddg=")) {
    const match = /[?&]uddg=([^&]+)/.exec(href);
    if (match?.[1]) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        // fall through to raw href
      }
    }
  }
  if (href.startsWith("//")) return "https:" + href;
  return href;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchDdgResults(
  query: string,
  count: number,
  timeoutMs: number,
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query, kl: "jp-jp" });
  const url = `${DDG_HTML_URL}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": DDG_USER_AGENT,
      Accept: "text/html",
      "Accept-Language": "ja,en;q=0.9",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo returned HTTP ${response.status}`);
  }

  const html = await response.text();
  return parseDdgHtml(html, count);
}

function parseDdgHtml(html: string, maxCount: number): SearchResult[] {
  const results: SearchResult[] = [];

  // Extract result links: <a class="result__a" href="URL">Title</a>
  const linkRe = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  // Extract snippets: <a class="result__snippet" ...>Snippet</a>
  const snippetRe = /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;

  const links: Array<{ title: string; url: string }> = [];
  const snippets: string[] = [];

  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) !== null) {
    links.push({ url: extractRedirectUrl(m[1]), title: stripHtml(m[2]) });
  }
  while ((m = snippetRe.exec(html)) !== null) {
    snippets.push(stripHtml(m[1]));
  }

  const total = Math.min(links.length, maxCount);
  for (let i = 0; i < total; i++) {
    results.push({
      title: links[i].title,
      url: links[i].url,
      description: snippets[i] ?? "",
    });
  }
  return results;
}

function createDuckDuckGoToolDefinition(): WebSearchProviderToolDefinition {
  return {
    description:
      "Search the web using DuckDuckGo. Returns titles, URLs, and snippets for the given query.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query string",
        },
        count: {
          type: "number",
          description: `Number of results to return (1–${MAX_COUNT}, default ${DEFAULT_COUNT})`,
        },
      },
      required: ["query"],
    },
    execute: async (args) => {
      const query = String(args.query ?? "").trim();
      if (!query) {
        return { error: "query is required" };
      }
      const count = Math.min(
        MAX_COUNT,
        Math.max(1, typeof args.count === "number" ? args.count : DEFAULT_COUNT),
      );
      const start = Date.now();
      const results = await fetchDdgResults(query, count, DEFAULT_TIMEOUT_MS);
      return {
        query,
        provider: "duckduckgo",
        count: results.length,
        tookMs: Date.now() - start,
        externalContent: {
          untrusted: true,
          source: "web_search",
          provider: "duckduckgo",
          wrapped: false,
        },
        results,
      };
    },
  };
}

export function createDuckDuckGoProvider(): WebSearchProviderPlugin {
  return {
    id: "duckduckgo",
    label: "DuckDuckGo",
    hint: "Free web search · No API key required",
    envVars: [],
    placeholder: "",
    signupUrl: "https://duckduckgo.com/",
    autoDetectOrder: 5, // Lower than Brave (10) → preferred when no Brave key
    credentialPath: "plugins.entries.duckduckgo.config.webSearch.apiKey",
    inactiveSecretPaths: [],
    // DDG needs no credential — always return a sentinel so auto-detect picks it up
    getCredentialValue: (_searchConfig) => "no-key-required",
    setCredentialValue: (_target, _value) => {},
    getConfiguredCredentialValue: (_config) => "no-key-required",
    setConfiguredCredentialValue: (_target, _value) => {},
    createTool: (_ctx) => createDuckDuckGoToolDefinition(),
  };
}
