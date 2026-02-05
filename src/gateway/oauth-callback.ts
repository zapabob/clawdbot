import type { IncomingMessage, ServerResponse } from "node:http";
import type { OAuth2Manager, OAuth2Result } from "../infra/oauth2-manager.js";

export interface OAuthCallbackHandlerOptions {
  oauthManager: OAuth2Manager;
  bindHost: string;
  port: number;
}

export function createOAuthCallbackHandler(
  opts: OAuthCallbackHandlerOptions,
): (req: IncomingMessage, res: ServerResponse) => Promise<boolean> {
  const { oauthManager, bindHost, port } = opts;

  return async (req, res): Promise<boolean> => {
    const url = new URL(req.url ?? "/", `http://${bindHost}:${port}`);

    if (url.pathname !== "/oauth/callback") {
      return false;
    }

    const provider = url.searchParams.get("provider");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h1>OAuth認証エラー</h1>
          <p>エラー: ${error}</p>
          <p>説明: ${errorDescription || "なし"}</p>
          <p><a href="/">ゲートウェイに戻る</a></p>
        </body>
        </html>
      `);
      return true;
    }

    if (!provider || !code || !state) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h1>OAuth Error</h1>
          <p>Missing required parameters: provider, code, or state</p>
          <p><a href="/">Return to gateway</a></p>
        </body>
        </html>
      `);
      return true;
    }

    const result: OAuth2Result = await oauthManager.handleCallback(provider, code, state);

    if (result.success && result.tokens) {
      const expiryDate = result.tokens.expiresAt.toLocaleString("ja-JP");
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>OAuth Success</title></head>
        <body>
          <h1>✅ OAuth認証成功</h1>
          <p>Provider: ${provider}</p>
          <p>有効期限: ${expiryDate}</p>
          <p><a href="/">ゲートウェイに戻る</a></p>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
        </html>
      `);
    } else {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h1>❌ OAuth認証失敗</h1>
          <p>エラー: ${result.error || "Unknown error"}</p>
          <p><a href="/">ゲートウェイに戻る</a></p>
        </body>
        </html>
      `);
    }

    return true;
  };
}

export function createOAuthStatusHandler(
  opts: OAuthCallbackHandlerOptions,
): (req: IncomingMessage, res: ServerResponse) => Promise<boolean> {
  const { oauthManager, bindHost, port } = opts;

  return async (req, res): Promise<boolean> => {
    const url = new URL(req.url ?? "/", `http://${bindHost}:${port}`);

    if (url.pathname !== "/oauth/status") {
      return false;
    }

    const provider = url.searchParams.get("provider");

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    if (provider) {
      const isAuth = oauthManager.isAuthenticated(provider);
      const expiry = oauthManager.getTokenExpiry(provider);
      const accessToken = oauthManager.getAccessToken(provider);

      res.end(
        JSON.stringify({
          provider,
          authenticated: isAuth,
          expiresAt: expiry?.toISOString() ?? null,
          hasAccessToken: !!accessToken,
        }),
      );
    } else {
      const providers = ["openai", "google"];
      const status: Record<string, unknown> = {};

      for (const p of providers) {
        status[p] = {
          authenticated: oauthManager.isAuthenticated(p),
          expiresAt: oauthManager.getTokenExpiry(p)?.toISOString() ?? null,
        };
      }

      res.end(JSON.stringify(status));
    }

    return true;
  };
}

export function createOAuthRefreshHandler(
  opts: OAuthCallbackHandlerOptions,
): (req: IncomingMessage, res: ServerResponse) => Promise<boolean> {
  const { oauthManager, bindHost, port } = opts;

  return async (req, res): Promise<boolean> => {
    const url = new URL(req.url ?? "/", `http://${bindHost}:${port}`);

    if (url.pathname !== "/oauth/refresh") {
      return false;
    }

    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Allow", "POST");
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return true;
    }

    const provider = url.searchParams.get("provider");

    if (!provider) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Missing provider parameter" }));
      return true;
    }

    const result = await oauthManager.refreshAccessToken(provider);

    res.statusCode = result.success ? 200 : 400;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        success: result.success,
        error: result.error,
        tokens: result.tokens
          ? {
              expiresAt: result.tokens.expiresAt.toISOString(),
            }
          : null,
      }),
    );

    return true;
  };
}
