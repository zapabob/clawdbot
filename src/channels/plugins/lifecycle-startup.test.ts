import { beforeEach, describe, expect, it, vi } from "vitest";
import { runChannelPluginStartupMaintenance } from "./lifecycle-startup.js";
import { isChannelConfigured } from "../../config/channel-configured.js";
import { listChannelPlugins } from "./registry.js";

vi.mock("../../config/channel-configured.js", () => ({
  isChannelConfigured: vi.fn(),
}));

vi.mock("./registry.js", () => ({
  listChannelPlugins: vi.fn(),
}));

function makeLog() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
  };
}

describe("runChannelPluginStartupMaintenance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips lifecycle maintenance for unconfigured channels", async () => {
    const log = makeLog();
    const runStartupMaintenance = vi.fn();
    vi.mocked(listChannelPlugins).mockReturnValue([
      {
        id: "matrix",
        lifecycle: { runStartupMaintenance },
      },
    ] as ReturnType<typeof listChannelPlugins>);
    vi.mocked(isChannelConfigured).mockReturnValue(false);

    await runChannelPluginStartupMaintenance({
      cfg: {},
      env: {},
      log,
    });

    expect(isChannelConfigured).toHaveBeenCalledWith({}, "matrix", {});
    expect(runStartupMaintenance).not.toHaveBeenCalled();
    expect(log.warn).not.toHaveBeenCalled();
  });

  it("runs lifecycle maintenance for configured channels", async () => {
    const log = makeLog();
    const runStartupMaintenance = vi.fn().mockResolvedValue(undefined);
    const env = { TELEGRAM_BOT_TOKEN: "token" };
    const cfg = {
      channels: {
        telegram: {
          enabled: true,
        },
      },
    };
    vi.mocked(listChannelPlugins).mockReturnValue([
      {
        id: "telegram",
        lifecycle: { runStartupMaintenance },
      },
    ] as ReturnType<typeof listChannelPlugins>);
    vi.mocked(isChannelConfigured).mockReturnValue(true);

    await runChannelPluginStartupMaintenance({
      cfg,
      env,
      log,
    });

    expect(isChannelConfigured).toHaveBeenCalledWith(cfg, "telegram", env);
    expect(runStartupMaintenance).toHaveBeenCalledWith({
      cfg,
      env,
      log,
    });
  });
});
