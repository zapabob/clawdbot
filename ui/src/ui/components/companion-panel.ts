import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { AgentsListResult } from "../types.ts";

const CONTROL_URL = "http://127.0.0.1:18791";
const HYPURA_URL = "http://127.0.0.1:18790";
const POLL_INTERVAL_MS = 3000;

type TtsProvider = "voicevox" | "web-speech";

interface HypuraStatus {
  daemon_version?: string;
  osc_connected?: boolean;
  voicevox_alive?: boolean;
  ollama_alive?: boolean;
}

interface CompanionState {
  visible: boolean;
  agentId: string;
  ttsProvider: TtsProvider;
  speaking: boolean;
  timestamp: number;
}

@customElement("companion-panel")
export class CompanionPanel extends LitElement {
  // Disable shadow DOM — use global styles
  override createRenderRoot() {
    return this;
  }

  @state() private companionState: CompanionState | null = null;
  @state() private online = false;
  @state() private hypuraStatus: HypuraStatus | null = null;
  @state() private hypuraOnline = false;
  @state() private collapsed = true;

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  // Passed from parent (app-render)
  agentsList: AgentsListResult | null = null;

  override connectedCallback() {
    super.connectedCallback();
    void this._poll();
    this.pollTimer = setInterval(() => {
      void this._poll();
    }, POLL_INTERVAL_MS);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async fetchHypuraStatus(): Promise<void> {
    try {
      const res = await fetch(`${HYPURA_URL}/status`, {
        signal: AbortSignal.timeout(1500),
      }).catch(() => null);
      if (!res?.ok) {
        this.hypuraStatus = null;
        this.hypuraOnline = false;
        return;
      }
      this.hypuraStatus = (await res.json()) as HypuraStatus;
      this.hypuraOnline = true;
    } catch {
      this.hypuraStatus = null;
      this.hypuraOnline = false;
    }
  }

  private async _poll(): Promise<void> {
    await Promise.all([this._pollCompanionState(), this.fetchHypuraStatus()]);
  }

  private async _pollCompanionState(): Promise<void> {
    try {
      const res = await fetch(`${CONTROL_URL}/state`, { signal: AbortSignal.timeout(1500) });
      if (!res.ok) {
        throw new Error("not ok");
      }
      const data = (await res.json()) as CompanionState;
      this.companionState = data;
      this.online = true;
    } catch {
      this.online = false;
    }
  }

  private async _send(cmd: Partial<CompanionState> & { speakText?: string }): Promise<void> {
    try {
      await fetch(`${CONTROL_URL}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmd),
      });
      // Optimistic update
      if (this.companionState) {
        this.companionState = { ...this.companionState, ...cmd, timestamp: Date.now() };
      }
      this.requestUpdate();
    } catch {
      // Companion offline
    }
  }

  private _toggleVisible = () => {
    const next = !(this.companionState?.visible ?? true);
    void this._send({ visible: next });
  };

  private _setAgent = (e: Event) => {
    const sel = e.target as HTMLSelectElement;
    void this._send({ agentId: sel.value });
  };

  private _setTts = (e: Event) => {
    const sel = e.target as HTMLSelectElement;
    void this._send({ ttsProvider: sel.value as TtsProvider });
  };

  private async _hypuraPost(
    path: string,
    body: Record<string, unknown>,
  ): Promise<void> {
    try {
      await fetch(`${HYPURA_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      // Hypura offline or network error — silent
    }
  }

  private _hypuraOscQuick = () => {
    void this._hypuraPost("/osc", {
      action: "chatbox",
      payload: { text: "こんにちは！" },
    });
  };

  private _hypuraSpeakQuick = () => {
    void this._hypuraPost("/speak", {
      text: "起動完了しました",
      emotion: "happy",
    });
  };

  private _hypuraRun = () => {
    const task = window.prompt("Hypura task", "");
    if (task === null || task.trim() === "") {
      return;
    }
    void this._hypuraPost("/run", { task: task.trim() });
  };

  override render() {
    const isVisible = this.companionState?.visible ?? false;
    const speaking = this.companionState?.speaking ?? false;
    const agentId = this.companionState?.agentId ?? "main";
    const ttsProvider = this.companionState?.ttsProvider ?? "voicevox";
    const agents = this.agentsList?.agents ?? [];

    return html`
      <div class="companion-panel ${this.collapsed ? "companion-panel--collapsed" : ""}">
        <!-- ── Header / Toggle Row ── -->
        <button
          class="companion-panel__header"
          @click=${() => {
            this.collapsed = !this.collapsed;
          }}
          title="${this.collapsed ? "コンパニオンを展開" : "コンパニオンを折りたたむ"}"
        >
          <span class="companion-panel__idol-star">✦</span>
          <span class="companion-panel__title">
            ${
              this.collapsed
                ? nothing
                : html`
                    <span>コンパニオン</span>
                  `
            }
          </span>
          <span class="companion-panel__status-dot ${this.online ? "companion-panel__status-dot--online" : ""} ${speaking ? "companion-panel__status-dot--speaking" : ""}"></span>
        </button>

        ${
          this.collapsed
            ? nothing
            : html`
          <div class="companion-panel__body">
            <!-- Online status -->
            <div class="companion-panel__badge ${this.online ? "companion-panel__badge--on" : "companion-panel__badge--off"}">
              ${
                this.online
                  ? speaking
                    ? html`
                        <span class="companion-wave">♫</span> 発話中
                      `
                    : "● オンライン"
                  : "○ オフライン"
              }
            </div>

            <!-- Show / Hide toggle -->
            <button
              class="companion-panel__action-btn ${isVisible ? "companion-panel__action-btn--active" : ""}"
              @click=${this._toggleVisible}
              ?disabled=${!this.online}
              title="${isVisible ? "コンパニオンを非表示" : "コンパニオンを表示"}"
            >
              <span class="companion-idol-icon">${isVisible ? "◉" : "◎"}</span>
              ${isVisible ? "表示中" : "非表示"}
            </button>

            ${
              agents.length > 0
                ? html`
              <!-- Agent selector -->
              <div class="companion-panel__field">
                <label class="companion-panel__label">
                  <span class="companion-idol-icon">♔</span> エージェント
                </label>
                <select
                  class="companion-panel__select"
                  .value=${agentId}
                  @change=${this._setAgent}
                  ?disabled=${!this.online}
                >
                  ${agents.map(
                    (a) => html`
                    <option value=${a.id} ?selected=${a.id === agentId}>
                      ${a.identity?.name ?? a.name ?? a.id}
                    </option>
                  `,
                  )}
                </select>
              </div>
            `
                : nothing
            }

            <!-- TTS provider selector -->
            <div class="companion-panel__field">
              <label class="companion-panel__label">
                <span class="companion-idol-icon">♬</span> 音声TTS
              </label>
              <select
                class="companion-panel__select"
                .value=${ttsProvider}
                @change=${this._setTts}
                ?disabled=${!this.online}
              >
                <option value="voicevox" ?selected=${ttsProvider === "voicevox"}>
                  VOICEVOX
                </option>
                <option value="web-speech" ?selected=${ttsProvider === "web-speech"}>
                  Web Speech (無料)
                </option>
              </select>
            </div>
          </div>
        `
        }
      </div>

      <style>
        /* ── アイドルマスター風コンパニオンパネル ── */
        .companion-panel {
          border-top: 1px solid rgba(255, 150, 200, 0.18);
          margin: 4px 0 0;
          padding: 0;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            rgba(255, 100, 160, 0.04) 0%,
            rgba(180, 100, 255, 0.04) 100%
          );
          border-radius: 6px;
        }

        .companion-panel__header {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          padding: 7px 10px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted, rgba(255, 180, 220, 0.75));
          font-size: 11px;
          text-align: left;
          transition: color 0.2s;
        }
        .companion-panel__header:hover {
          color: var(--color-text, rgba(255, 200, 235, 0.95));
        }

        .companion-panel__idol-star {
          font-size: 12px;
          color: rgba(255, 140, 200, 0.8);
          flex-shrink: 0;
        }

        .companion-panel__title {
          flex: 1;
          font-weight: 600;
          letter-spacing: 0.04em;
          background: linear-gradient(90deg, #ff88c8, #cc88ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .companion-panel__status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(100, 100, 100, 0.5);
          flex-shrink: 0;
          transition: background 0.3s;
        }
        .companion-panel__status-dot--online {
          background: rgba(120, 220, 140, 0.85);
          box-shadow: 0 0 4px rgba(120, 220, 140, 0.6);
        }
        .companion-panel__status-dot--speaking {
          background: rgba(255, 140, 200, 0.9);
          box-shadow: 0 0 6px rgba(255, 140, 200, 0.7);
          animation: companion-pulse 0.6s ease-in-out infinite alternate;
        }

        @keyframes companion-pulse {
          from { transform: scale(1); opacity: 0.8; }
          to   { transform: scale(1.4); opacity: 1; }
        }

        .companion-panel__body {
          padding: 4px 10px 10px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .companion-panel__badge {
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 10px;
          text-align: center;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        .companion-panel__badge--on {
          background: rgba(120, 220, 140, 0.12);
          color: rgba(120, 220, 140, 0.9);
          border: 1px solid rgba(120, 220, 140, 0.25);
        }
        .companion-panel__badge--off {
          background: rgba(140, 140, 160, 0.08);
          color: rgba(140, 140, 160, 0.6);
          border: 1px solid rgba(140, 140, 160, 0.15);
        }

        .companion-wave {
          display: inline-block;
          animation: companion-wave-anim 0.5s ease-in-out infinite alternate;
        }
        @keyframes companion-wave-anim {
          from { transform: translateY(0); }
          to   { transform: translateY(-2px); }
        }

        .companion-panel__action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          padding: 6px 10px;
          border: 1px solid rgba(255, 150, 200, 0.2);
          border-radius: 6px;
          background: rgba(255, 100, 160, 0.06);
          color: rgba(255, 180, 220, 0.7);
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .companion-panel__action-btn:hover:not(:disabled) {
          background: rgba(255, 120, 180, 0.14);
          border-color: rgba(255, 150, 200, 0.45);
          color: rgba(255, 210, 235, 0.95);
        }
        .companion-panel__action-btn--active {
          background: linear-gradient(135deg, rgba(255, 100, 160, 0.15), rgba(180, 80, 255, 0.12));
          border-color: rgba(255, 140, 200, 0.4);
          color: rgba(255, 200, 235, 0.95);
        }
        .companion-panel__action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .companion-idol-icon {
          font-size: 12px;
          opacity: 0.8;
        }

        .companion-panel__field {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .companion-panel__label {
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: rgba(200, 150, 220, 0.7);
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .companion-panel__select {
          width: 100%;
          padding: 4px 6px;
          border: 1px solid rgba(255, 150, 200, 0.2);
          border-radius: 5px;
          background: rgba(20, 10, 30, 0.5);
          color: rgba(255, 200, 235, 0.85);
          font-size: 11px;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,150,200,0.5)'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 6px center;
          padding-right: 20px;
        }
        .companion-panel__select:focus {
          outline: none;
          border-color: rgba(255, 150, 200, 0.5);
          box-shadow: 0 0 0 2px rgba(255, 100, 160, 0.15);
        }
        .companion-panel__select:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .companion-panel__select option {
          background: #1a0d28;
          color: rgba(255, 200, 235, 0.9);
        }
      </style>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "companion-panel": CompanionPanel;
  }
}
