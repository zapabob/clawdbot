import { Command } from "commander";
import {
  createOAuth2Manager,
  OAuth2Config,
  OAuth2Manager,
  OAuth2Result,
  OAuth2Tokens,
} from "../infra/oauth2-manager.js";
import { loadConfig } from "../config/config.js";

interface DeviceCodeResult {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

async function fetchOpenAIDeviceCode(
  clientId: string,
  clientSecret: string,
): Promise<DeviceCodeResult> {
  const response = await fetch("https://platform.openai.com/oauth/device/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      scope: "openai organizations.read",
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { error_description?: string }).error_description ||
        (error as { error?: string }).error ||
        "Device code request failed",
    );
  }

  const data = (await response.json()) as DeviceCodeResult & Record<string, unknown>;
  return {
    deviceCode: data.device_code as string,
    userCode: data.user_code as string,
    verificationUri: data.verification_uri as string,
    expiresIn: data.expires_in as number,
    interval: data.interval as number,
  };
}

async function pollForOpenAIToken(
  clientId: string,
  clientSecret: string,
  deviceCode: string,
  interval: number,
  onStatus: (status: string) => void,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const maxAttempts = Math.ceil(600 / interval);
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, interval * 1000));

    const response = await fetch("https://platform.openai.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as Record<string, unknown>;
      return {
        accessToken: data.access_token as string,
        refreshToken: data.refresh_token as string,
        expiresIn: data.expires_in as number,
      };
    }

    const error = (await response.json()) as Record<string, unknown>;
    if ((error as Record<string, unknown>).error === "authorization_pending") {
      attempts++;
      onStatus(`Waiting... (${attempts}/${maxAttempts})`);
    } else if ((error as Record<string, unknown>).error === "slow_down") {
      interval = Math.min(interval * 1.5, 30);
      onStatus(`Slow down, adjusting interval to ${interval}s...`);
    } else {
      throw new Error(
        (error as { error_description?: string }).error_description ||
          String((error as Record<string, unknown>).error) ||
          "Token exchange failed",
      );
    }
  }

  throw new Error("Authentication timed out");
}

async function automateOAuthWithHeadlessBrowser(
  manager: OAuth2Manager,
  provider: string,
  config: OAuth2Config,
): Promise<void> {
  let playwright: typeof import("playwright-core") | null = null;

  try {
    playwright = await import("playwright-core");
  } catch {
    console.error("Error: playwright-core is not installed");
    console.log("To install: pnpm add playwright-core");
    process.exit(1);
  }

  const redirectUri = `http://127.0.0.1:18789/oauth/callback/${provider}`;
  const state = crypto.randomUUID();

  const authUrl = new URL("https://platform.openai.com/oauth/authorize");
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openai organizations.read");
  authUrl.searchParams.set("state", state);

  console.log(`Auth URL: ${authUrl.toString()}`);

  const browser = await playwright.chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  let code: string | null = null;
  let callbackResolved = false;

  const { default: express } = await import("express");
  const app = express();

  app.get(
    `/oauth/callback/${provider}`,
    (req: { query: { code?: string; state?: string } }, res: { send: (html: string) => void }) => {
      code = req.query.code ?? null;
      callbackResolved = true;

      res.send(`
      <html>
        <body>
          <h1>Authentication Complete</h1>
          <p>Please close the browser and check the CLI.</p>
          <script>setTimeout(() => window.close(), 2000)</script>
        </body>
      </html>
    `);
    },
  );

  const server = app.listen(18789, "127.0.0.1", () => {
    console.log(`Callback server started: http://127.0.0.1:18789`);
  });

  try {
    await page.goto(authUrl.toString(), { waitUntil: "networkidle", timeout: 30000 });

    try {
      await page.waitForSelector('button:has-text("Continue")', { timeout: 10000 });
      await page.click('button:has-text("Continue")');
    } catch {
      console.log("Continue button not found or not needed");
    }

    console.log("Waiting for authentication...\n");

    const maxWait = 180000;
    const pollInterval = 2000;
    let waited = 0;

    while (!callbackResolved && waited < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      waited += pollInterval;
      process.stdout.write(`\rWaiting... ${Math.floor(waited / 1000)}s`);
    }

    console.log("");

    if (code) {
      const result = await manager.handleCallback(provider, code, state);

      if (result.success && result.tokens) {
        console.log("\n✅ Authentication successful!");
        console.log(`  Expires: ${result.tokens.expiresAt.toLocaleString()}`);
      } else {
        console.error(`\n❌ Authentication failed: ${result.error}`);
        process.exit(1);
      }
    } else {
      console.error("\n❌ Authentication timed out");
      process.exit(1);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

async function saveDeviceCodeTokens(
  manager: OAuth2Manager,
  provider: string,
  tokenResult: { accessToken: string; refreshToken: string; expiresIn: number },
): Promise<void> {
  const tokens: OAuth2Tokens = {
    accessToken: tokenResult.accessToken,
    refreshToken: tokenResult.refreshToken,
    expiresAt: new Date(Date.now() + tokenResult.expiresIn * 1000),
    tokenType: "Bearer",
    scope: "",
  };

  manager.saveTokenToEnv(provider, tokens);
}

export function createOAuthCommands(): Command {
  const oauth = new Command("oauth");

  oauth
    .command("list")
    .description("List available OAuth providers")
    .action(() => {
      const manager = createOAuth2Manager();
      const providers = ["openai", "google"];

      console.log("Available OAuth providers:");
      console.log("");

      for (const provider of providers) {
        const isAuth = manager.isAuthenticated(provider);
        const expiry = manager.getTokenExpiry(provider);

        console.log(`  ${provider.toUpperCase()}`);
        console.log(`    Status: ${isAuth ? "✅ Authenticated" : "❌ Not authenticated"}`);
        if (expiry) {
          console.log(`    Expires: ${expiry.toLocaleString()}`);
        } else {
          console.log(`    Expires: -`);
        }
        console.log("");
      }
    });

  oauth
    .command("status <provider>")
    .description("Check authentication status for a provider")
    .action((provider: string) => {
      const manager = createOAuth2Manager();
      const p = provider.toLowerCase();

      if (!["openai", "google"].includes(p)) {
        console.error(`Error: Unknown provider '${provider}'`);
        console.log("Available providers: openai, google");
        process.exit(1);
      }

      const isAuth = manager.isAuthenticated(p);
      const expiry = manager.getTokenExpiry(p);
      const accessToken = manager.getAccessToken(p);

      console.log(`${provider.toUpperCase()} Auth Status:`);
      console.log(`  Status: ${isAuth ? "✅ Authenticated" : "❌ Not authenticated"}`);
      console.log(`  Expires: ${expiry?.toLocaleString() ?? "-"}`);
      console.log(`  Access Token: ${accessToken ? "✓ Present" : "✗ Missing"}`);
    });

  oauth
    .command("auth-url <provider>")
    .description("Generate and display auth URL")
    .option("-p, --port <port>", "Redirect port", "3000")
    .option("-h, --host <host>", "Redirect host", "localhost")
    .action((provider: string, opts: { port: string; host: string }) => {
      const manager = createOAuth2Manager();
      const p = provider.toLowerCase();

      if (!["openai", "google"].includes(p)) {
        console.error(`Error: Unknown provider '${provider}'`);
        console.log("Available providers: openai, google");
        process.exit(1);
      }

      const redirectUri = `http://${opts.host}:${opts.port}/oauth/callback`;
      const authUrl = manager.getAuthUrl(p, redirectUri);

      if (!authUrl) {
        console.error(`Error: Could not generate auth URL for '${provider}'`);
        process.exit(1);
      }

      console.log(`${provider.toUpperCase()} Auth URL:`);
      console.log("");
      console.log(authUrl);
      console.log("");
      console.log("Open this URL in your browser to complete authentication.");
    });

  oauth
    .command("callback <provider> <code> <state>")
    .description("Process OAuth callback (manual input)")
    .action(async (provider: string, code: string, state: string) => {
      const manager = createOAuth2Manager();
      const p = provider.toLowerCase();

      if (!["openai", "google"].includes(p)) {
        console.error(`Error: Unknown provider '${provider}'`);
        process.exit(1);
      }

      const result = await manager.handleCallback(p, code, state);

      if (result.success && result.tokens) {
        console.log(`✅ ${provider.toUpperCase()} Authentication successful!`);
        console.log(`  Expires: ${result.tokens.expiresAt.toLocaleString()}`);
      } else {
        console.error(`❌ ${provider.toUpperCase()} Authentication failed: ${result.error}`);
        process.exit(1);
      }
    });

  oauth
    .command("refresh <provider>")
    .description("Refresh token for a provider")
    .action(async (provider: string) => {
      const manager = createOAuth2Manager();
      const p = provider.toLowerCase();

      if (!["openai", "google"].includes(p)) {
        console.error(`Error: Unknown provider '${provider}'`);
        process.exit(1);
      }

      console.log(`Refreshing ${provider.toUpperCase()} token...`);

      const result = await manager.refreshAccessToken(p);

      if (result.success && result.tokens) {
        console.log("✅ Token refresh successful!");
        console.log(`  New expires: ${result.tokens.expiresAt.toLocaleString()}`);
      } else {
        console.error(`❌ Token refresh failed: ${result.error}`);
        process.exit(1);
      }
    });

  oauth
    .command("clear [provider]")
    .description("Clear auth tokens (provider optional)")
    .action((provider?: string) => {
      const manager = createOAuth2Manager();

      if (provider) {
        const p = provider.toLowerCase();
        if (!["openai", "google"].includes(p)) {
          console.error(`Error: Unknown provider '${provider}'`);
          process.exit(1);
        }
        manager.clearTokens(p);
        console.log(`Cleared tokens for ${provider.toUpperCase()}.`);
      } else {
        manager.clearTokens();
        console.log("Cleared all OAuth tokens.");
      }
    });

  oauth
    .command("configure <provider>")
    .description("Configure OAuth provider")
    .requiredOption("--client-id <id>", "Client ID")
    .requiredOption("--client-secret <secret>", "Client Secret")
    .action((provider: string, opts: { clientId: string; clientSecret: string }) => {
      const manager = createOAuth2Manager();
      const p = provider.toLowerCase();

      if (!["openai", "google"].includes(p)) {
        console.error(`Error: Unknown provider '${provider}'`);
        process.exit(1);
      }

      const success = manager.configureProvider(p, {
        clientId: opts.clientId,
        clientSecret: opts.clientSecret,
      });

      if (success) {
        console.log(`✅ Updated configuration for ${provider.toUpperCase()}.`);
        console.log("Settings saved to .env file.");
      } else {
        console.error(`❌ Failed to configure ${provider.toUpperCase()}.`);
        process.exit(1);
      }
    });

  oauth
    .command("auto <provider>")
    .description("Auto-authenticate (device code or headless browser)")
    .option("--device", "Use device code flow")
    .option("--headless", "Authenticate with headless browser")
    .action(async (provider: string, opts: { device: boolean; headless: boolean }) => {
      const p = provider.toLowerCase();

      if (p !== "openai") {
        console.error(`Error: '${provider}' does not support auto-authentication`);
        console.log("Currently only OpenAI auto-authentication is supported");
        process.exit(1);
      }

      const manager = createOAuth2Manager();
      const config = manager.getProvider(p);

      if (!config || !config.config.clientId || !config.config.clientSecret) {
        console.error(`Error: ${provider} client ID/secret not configured`);
        console.log("Please run:");
        console.log(
          `  openclaw oauth configure ${provider} --client-id <ID> --client-secret <SECRET>`,
        );
        process.exit(1);
      }

      if (opts.headless) {
        console.log("Starting headless browser authentication...");
        await automateOAuthWithHeadlessBrowser(manager, p, config.config);
      } else {
        console.log("Starting device code flow...\n");

        try {
          const deviceCode = await fetchOpenAIDeviceCode(
            config.config.clientId,
            config.config.clientSecret,
          );

          console.log("Please visit the following URL and enter the code:\n");
          console.log(`  URL: ${deviceCode.verificationUri}`);
          console.log(`  Code: ${deviceCode.userCode}\n`);

          if (process.stdout.isTTY) {
            console.log("Auto-waiting for authentication to complete...");
          }

          const tokenResult = await pollForOpenAIToken(
            config.config.clientId,
            config.config.clientSecret,
            deviceCode.deviceCode,
            deviceCode.interval,
            (status) => {
              if (process.stdout.isTTY) {
                process.stdout.write(`\r${status}`);
              }
            },
          );

          console.log("\n\n✅ Authentication successful!");

          await saveDeviceCodeTokens(manager, p, tokenResult);
          console.log(
            `  Expires: ${new Date(Date.now() + tokenResult.expiresIn * 1000).toLocaleString()}`,
          );
        } catch (error) {
          console.error(`\n❌ Authentication failed: ${error}`);
          process.exit(1);
        }
      }
    });

  return oauth;
}

export function createAuthCommand(): Command {
  const auth = new Command("auth");

  auth
    .command("login <provider>")
    .description("Login to OAuth provider")
    .option("-p, --port <port>", "Redirect port", "3000")
    .option("-h, --host <host>", "Redirect host", "localhost")
    .option("-s, --silent", "Only show URL, don't open browser")
    .option("-a, --auto", "Use auto-authentication (device code)")
    .option("--headless", "Use headless browser for authentication")
    .action(
      async (
        provider: string,
        opts: { port: string; host: string; silent: boolean; auto: boolean; headless: boolean },
      ) => {
        const config = loadConfig();
        const gatewayPort = config.gateway?.port ?? 18789;
        const actualHost = opts.host === "localhost" ? "127.0.0.1" : opts.host;

        const redirectUri = `http://${actualHost}:${gatewayPort}/oauth/callback`;

        const manager = createOAuth2Manager();
        const p = provider.toLowerCase();

        if (!["openai", "google"].includes(p)) {
          console.error(`Error: Unknown provider '${provider}'`);
          console.log("Available providers: openai, google");
          process.exit(1);
        }

        if (opts.auto || opts.headless) {
          const configObj = manager.getProvider(p);
          if (!configObj || !configObj.config.clientId || !configObj.config.clientSecret) {
            console.error(`Error: ${provider} client ID/secret not configured`);
            console.log("Please run:");
            console.log(
              `  openclaw oauth configure ${provider} --client-id <ID> --client-secret <SECRET>`,
            );
            process.exit(1);
          }

          if (opts.headless) {
            console.log("Starting headless browser authentication...");
            await automateOAuthWithHeadlessBrowser(manager, p, configObj.config);
            return;
          } else {
            console.log("Starting device code flow...\n");

            try {
              const deviceCode = await fetchOpenAIDeviceCode(
                configObj.config.clientId,
                configObj.config.clientSecret,
              );

              console.log("Please visit the following URL and enter the code:\n");
              console.log(`  URL: ${deviceCode.verificationUri}`);
              console.log(`  Code: ${deviceCode.userCode}\n`);

              if (process.stdout.isTTY) {
                console.log("Auto-waiting for authentication to complete...");
              }

              const tokenResult = await pollForOpenAIToken(
                configObj.config.clientId,
                configObj.config.clientSecret,
                deviceCode.deviceCode,
                deviceCode.interval,
                (status) => {
                  if (process.stdout.isTTY) {
                    process.stdout.write(`\r${status}`);
                  }
                },
              );

              console.log("\n\n✅ Authentication successful!");
              await saveDeviceCodeTokens(manager, p, tokenResult);
              console.log(
                `  Expires: ${new Date(Date.now() + tokenResult.expiresIn * 1000).toLocaleString()}`,
              );
            } catch (error) {
              console.error(`\n❌ Authentication failed: ${error}`);
              process.exit(1);
            }
            return;
          }
        }

        const authUrl = manager.getAuthUrl(p, redirectUri);

        if (!authUrl) {
          console.error("Error: Could not generate auth URL. Please check configuration.");
          process.exit(1);
        }

        console.log(`Starting ${provider.toUpperCase()} authentication...`);
        console.log("");

        if (opts.silent) {
          console.log("Auth URL:");
          console.log(authUrl);
        } else {
          console.log("Opening auth page in browser...");

          let openCommand: string;
          if (process.platform === "win32") {
            openCommand = `start "${authUrl}"`;
          } else if (process.platform === "darwin") {
            openCommand = `open "${authUrl}"`;
          } else {
            openCommand = `xdg-open "${authUrl}"`;
          }

          try {
            const { execSync } = await import("child_process");
            execSync(openCommand);
            console.log("Opened auth page in browser.");
          } catch {
            console.log("Auth URL:");
            console.log(authUrl);
          }
        }

        console.log("");
        console.log(
          "Authentication will complete automatically when you authorize in the browser.",
        );
        console.log("The gateway server is listening for callbacks at:");
        console.log(`  ${redirectUri}`);
      },
    );

  auth
    .command("status")
    .description("Show current authentication status")
    .action(() => {
      const manager = createOAuth2Manager();
      const providers = ["openai", "google"];

      console.log("=== OAuth Authentication Status ===");
      console.log("");

      let hasAnyAuth = false;

      for (const provider of providers) {
        const isAuth = manager.isAuthenticated(provider);
        const expiry = manager.getTokenExpiry(provider);

        if (isAuth) hasAnyAuth = true;

        console.log(`[${provider.toUpperCase()}]`);
        console.log(`  Status: ${isAuth ? "✅ Authenticated" : "❌ Not authenticated"}`);

        if (expiry) {
          const remainingMs = expiry.getTime() - Date.now();
          if (remainingMs > 0) {
            const remainingMin = Math.floor(remainingMs / 60000);
            console.log(`  Expires: ${expiry.toLocaleString()} (~${remainingMin}min remaining)`);
          } else {
            console.log(`  Expires: ${expiry.toLocaleString()} (expired)`);
          }
        }

        console.log("");
      }

      if (!hasAnyAuth) {
        console.log("Not authenticated. Run 'openclaw auth login <provider>' to authenticate.");
        console.log("Example: openclaw auth login openai");
      }
    });

  auth
    .command("logout [provider]")
    .description("Logout (from specific provider or all)")
    .action((provider?: string) => {
      const manager = createOAuth2Manager();

      if (provider) {
        const p = provider.toLowerCase();
        if (!["openai", "google"].includes(p)) {
          console.error(`Error: Unknown provider '${provider}'`);
          process.exit(1);
        }
        manager.clearTokens(p);
        console.log(`Logged out from ${provider.toUpperCase()}.`);
      } else {
        manager.clearTokens();
        console.log("Logged out from all providers.");
      }
    });

  auth
    .command("refresh [provider]")
    .description("Refresh token(s)")
    .action(async (provider?: string) => {
      const manager = createOAuth2Manager();
      const providers = provider ? [provider.toLowerCase()] : ["openai", "google"];

      for (const p of providers) {
        if (!["openai", "google"].includes(p)) {
          console.error(`Error: Unknown provider '${provider}'`);
          continue;
        }

        if (!manager.isAuthenticated(p)) {
          console.log(`${p.toUpperCase()}: Not authenticated, skipping...`);
          continue;
        }

        console.log(`Refreshing ${p.toUpperCase()} token...`);

        const result = await manager.refreshAccessToken(p);

        if (result.success && result.tokens) {
          console.log(`  ✅ Token refreshed! Expires: ${result.tokens.expiresAt.toLocaleString()}`);
        } else {
          console.error(`  ❌ Failed: ${result.error}`);
        }
      }
    });

  auth
    .command("check")
    .description("Check token validity and expiry")
    .action(() => {
      const manager = createOAuth2Manager();
      const providers = ["openai", "google"];

      console.log("=== Token Validity Check ===\n");

      for (const provider of providers) {
        const isAuth = manager.isAuthenticated(provider);
        const expiry = manager.getTokenExpiry(provider);
        const accessToken = manager.getAccessToken(provider);

        console.log(`[${provider.toUpperCase()}]`);
        console.log(`  Authenticated: ${isAuth ? "Yes" : "No"}`);
        console.log(`  Token Present: ${accessToken ? "Yes" : "No"}`);
        console.log(`  Expires: ${expiry ? expiry.toLocaleString() : "N/A"}`);

        if (expiry && isAuth) {
          const remainingMs = expiry.getTime() - Date.now();
          const remainingMin = Math.floor(remainingMs / 60000);

          if (remainingMin < 5) {
            console.log(`  ⚠️  Token expires soon (${remainingMin} min)`);
          } else {
            console.log(`  ✓  Token valid`);
          }
        } else if (isAuth) {
          console.log(`  ❌ Token expired`);
        } else {
          console.log(`  ❌ Not authenticated`);
        }
        console.log("");
      }
    });

  return auth;
}
