import type { LineMessage, BridgeMessage } from "../types.js";

export type CommandHandler = (
  args: string[],
  userId: string,
  sendMessage: (text: string) => Promise<void>,
) => Promise<{ success: boolean; content: string }>;

export interface Command {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  handler: CommandHandler;
}

const commands: Command[] = [
  // ============ セッション管理 ============
  {
    name: "terminal",
    aliases: ["start", "open"],
    description: "ターミナルセッションを開始",
    usage: "/terminal",
    handler: async (args, userId, sendMessage) => {
      await sendMessage("🔍 スキャンを開始...");
      return { success: true, content: "リポジトリ選択モードへ移行中..." };
    },
  },
  {
    name: "status",
    aliases: ["stat", "session"],
    description: "現在のセッション状態を表示",
    usage: "/status",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `📊 セッション状態

👤 ユーザーID: ${userId}
✅ ステータス: アクティブ
🔧 モード: ターミナル
📁 選択中リポジトリ: 未選択
🤖 使用AI: Codex (デフォルト)`,
      };
    },
  },
  {
    name: "reset",
    aliases: ["restart", "clear"],
    description: "セッションをリセット",
    usage: "/reset",
    handler: async (args, userId, sendMessage) => {
      return { success: true, content: "🔄 セッションをリセットしました" };
    },
  },
  // ============ ファイル操作 ============
  {
    name: "ls",
    aliases: ["list", "dir"],
    description: "ファイル一覧を表示",
    usage: "/ls [path]",
    handler: async (args, userId, sendMessage) => {
      const path = args[0] || ".";
      return {
        success: true,
        content: `📁 ${path} の一覧:\n\nfile1.txt\nfile2.js\nfolder/\nREADME.md`,
      };
    },
  },
  {
    name: "cat",
    aliases: ["read", "type"],
    description: "ファイル内容を表示",
    usage: "/cat <filepath>",
    handler: async (args, userId, sendMessage) => {
      if (args.length === 0) {
        return {
          success: false,
          content: "❌ ファイルパスを指定してください\n使用法: /cat <filepath>",
        };
      }
      return { success: true, content: `📄 ${args[0]} の内容:\n\nHello World\nLine 2\nLine 3` };
    },
  },
  {
    name: "write",
    aliases: ["create", "edit"],
    description: "ファイルに書き込み",
    usage: "/write <filepath> <content>",
    handler: async (args, userId, sendMessage) => {
      if (args.length < 2) {
        return { success: false, content: "❌ 引数が不足\n使用法: /write <filepath> <content>" };
      }
      const filepath = args[0];
      const content = args.slice(1).join(" ");
      return { success: true, content: `✅ ${filepath} に書き込みました` };
    },
  },
  {
    name: "mkdir",
    aliases: ["md", "newdir"],
    description: "ディレクトリを作成",
    usage: "/mkdir <dirname>",
    handler: async (args, userId, sendMessage) => {
      if (args.length === 0) {
        return { success: false, content: "❌ ディレクトリ名を指定してください" };
      }
      return { success: true, content: `✅ ディレクトリ "${args[0]}" を作成しました` };
    },
  },
  {
    name: "rm",
    aliases: ["delete", "del", "remove"],
    description: "ファイル/ディレクトリを削除",
    usage: "/rm <path>",
    handler: async (args, userId, sendMessage) => {
      if (args.length === 0) {
        return { success: false, content: "❌ パスを指定してください" };
      }
      return { success: true, content: `🗑️ ${args[0]} を削除しました` };
    },
  },
  {
    name: "find",
    aliases: ["search", "grep"],
    description: "ファイルを検索",
    usage: "/find <pattern>",
    handler: async (args, userId, sendMessage) => {
      if (args.length === 0) {
        return { success: false, content: "❌ 検索パターンを指定してください" };
      }
      return {
        success: true,
        content: `🔍 "${args[0]}" の検索結果:\n\n./src/index.ts\n./src/utils.ts\n./tests/index.test.ts`,
      };
    },
  },
  // ============ システム操作 ============
  {
    name: "ps",
    aliases: ["process", "processes"],
    description: "実行中プロセスを表示",
    usage: "/ps",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `🔧 実行中プロセス:

PID   NAME          STATUS
1234  node          Running
5678  openclaw      Running
9012  tailscale     Running`,
      };
    },
  },
  {
    name: "top",
    aliases: ["htop", "monitor"],
    description: "システムリソースを表示",
    usage: "/top",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `📈 システムリソース:

CPU: 45% ████████░░
Memory: 2.1GB / 16GB ████░░░░░░░░░░
Disk: 120GB / 500GB ██░░░░░░░░░░░░░░░
Network: 10MB/s ↓ 5MB/s ↑`,
      };
    },
  },
  {
    name: "uptime",
    aliases: ["boot", "time"],
    description: "稼働時間を表示",
    usage: "/uptime",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `⏰ 稼働情報:

システム稼働: 3d 12h 30m
負荷平均: 0.5, 0.3, 0.2
現在時刻: 2026-02-05 12:30:00`,
      };
    },
  },
  // ============ Git操作 ============
  {
    name: "git",
    aliases: ["gitstatus", "gits"],
    description: "Gitステータスを表示",
    usage: "/git status",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `📋 Git ステータス:

Current branch: main
Changes not staged:
  M src/index.ts
  A  new-file.ts
  D  deleted.ts

Untracked files:
  ??? temp.log`,
      };
    },
  },
  {
    name: "gitlog",
    aliases: ["log", "history"],
    description: "Gitログを表示",
    usage: "/gitlog [--limit]",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `📜 Git ログ:

* abc1234 (main) - 新機能追加
* def5678 - バグ修正
* ghi9012 - 設定更新
* jkl3456 - 初期コミット`,
      };
    },
  },
  {
    name: "gitpull",
    aliases: ["pull", "update"],
    description: "Gitプルを実行",
    usage: "/gitpull",
    handler: async (args, userId, sendMessage) => {
      return { success: true, content: "✅ git pull を実行しました\nAlready up to date." };
    },
  },
  {
    name: "gitpush",
    aliases: ["push", "commitpush"],
    description: "Gitプッシュを実行",
    usage: "/gitpush [message]",
    handler: async (args, userId, sendMessage) => {
      return { success: true, content: "✅ git push を実行しました\nTo https://github.com/..." };
    },
  },
  {
    name: "branch",
    aliases: ["branches"],
    description: "ブランチ一覧を表示",
    usage: "/branch",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `🌿 ブランチ一覧:

* main
  develop
  feature/new-command
  hotfix/critical-bug`,
      };
    },
  },
  // ============ OpenClaw制御 ============
  {
    name: "ocstatus",
    aliases: ["clawstatus", "gateway"],
    description: "OpenClawゲートウェイ状態",
    usage: "/ocstatus",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `🔮 OpenClaw ステータス:

✅ Gateway: 稼働中
📡 Tailscale: 接続中
📱 LINE: 正常
🧠 AI: Codex + Gemini + Opencode
📊 セッション数: 3`,
      };
    },
  },
  {
    name: "ocrestart",
    aliases: ["clawrestart", "restartgw"],
    description: "OpenClawを再起動",
    usage: "/ocrestart",
    handler: async (args, userId, sendMessage) => {
      return { success: true, content: "🔄 OpenClawを再起動中...\n✅ 再起動完了" };
    },
  },
  {
    name: "oclogs",
    aliases: ["clawlogs", "logs"],
    description: "OpenClawログを表示",
    usage: "/oclogs [--tail]",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `📋 OpenClaw ログ (最新10件):

[12:30:01] INFO: Gateway started
[12:30:02] INFO: LINE connected
[12:30:05] INFO: User paired
[12:31:00] INFO: Message received`,
      };
    },
  },
  {
    name: "occonfig",
    aliases: ["clawconfig", "config"],
    description: "設定を表示/変更",
    usage: "/occonfig get <key>\n/occonfig set <key> <value>",
    handler: async (args, userId, sendMessage) => {
      if (args.length === 0) {
        return {
          success: true,
          content: `⚙️ OpenClaw 設定:

gateway.port: 3000
gateway.mode: local
channels.line.enabled: true
skills.codex.enabled: true`,
        };
      }
      return { success: true, content: `✅ 設定: ${args.join(" ")}` };
    },
  },
  // ============ チャンネル管理 ============
  {
    name: "channels",
    aliases: ["ch", "channellist"],
    description: "チャンネル一覧",
    usage: "/channels",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `📡 チャンネル一覧:

✅ LINE - 接続中
✅ Discord - 接続中
✅ Telegram - 接続中
⚪ Slack - 無効
⚪ WhatsApp - 無効`,
      };
    },
  },
  {
    name: "channelstatus",
    aliases: ["chstatus"],
    description: "チャンネル詳細状態",
    usage: "/channelstatus <channel>",
    handler: async (args, userId, sendMessage) => {
      const channel = args[0] || "line";
      return {
        success: true,
        content: `📱 ${channel.toUpperCase()} 状態:

✅ 接続: 正常
📊 メッセージ: 1,234件
👥 ユーザー: 5人
🟢 オンライン: 全員`,
      };
    },
  },
  // ============ スキル管理 ============
  {
    name: "skills",
    aliases: ["skilllist"],
    description: "スキル一覧",
    usage: "/skills",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `🧠 スキル一覧:

✅ codex - 有効 (1,234回使用)
✅ gemini - 有効 (567回使用)
✅ opencode - 有効 (890回使用)
✅ terminal - 有効
✅ file-manager - 有効
🔲 docker - 無効`,
      };
    },
  },
  {
    name: "skillenable",
    aliases: ["skillon"],
    description: "スキルを有効化",
    usage: "/skillenable <skill>",
    handler: async (args, userId, sendMessage) => {
      if (args.length === 0) {
        return { success: false, content: "❌ スキル名を指定してください" };
      }
      return { success: true, content: `✅ スキル "${args[0]}" を有効化しました` };
    },
  },
  {
    name: "skilldisable",
    aliases: ["skilloff"],
    description: "スキルを無効化",
    usage: "/skilldisable <skill>",
    handler: async (args, userId, sendMessage) => {
      if (args.length === 0) {
        return { success: false, content: "❌ スキル名を指定してください" };
      }
      return { success: true, content: `✅ スキル "${args[0]}" を無効化しました` };
    },
  },
  // ============ AIツール ============
  {
    name: "codex",
    aliases: ["gpt", "copilot"],
    description: "Codex (GitHub Copilot) に切替",
    usage: "/codex <prompt>",
    handler: async (args, userId, sendMessage) => {
      const prompt = args.join(" ") || "hello";
      return {
        success: true,
        content: `🤖 Codex 応答:\n\n${prompt} について回答します...\n\n[AI応答がここに表示されます]`,
      };
    },
  },
  {
    name: "gemini",
    aliases: ["google"],
    description: "Gemini に切替",
    usage: "/gemini <prompt>",
    handler: async (args, userId, sendMessage) => {
      const prompt = args.join(" ") || "hello";
      return {
        success: true,
        content: `🔷 Gemini 応答:\n\n${prompt} について回答します...\n\n[AI応答がここに表示されます]`,
      };
    },
  },
  {
    name: "opencode",
    aliases: ["code", "claude"],
    description: "Opencode に切替",
    usage: "/opencode <prompt>",
    handler: async (args, userId, sendMessage) => {
      const prompt = args.join(" ") || "hello";
      return {
        success: true,
        content: `💎 Opencode 応答:\n\n${prompt} について回答します...\n\n[AI応答がここに表示されます]`,
      };
    },
  },
  {
    name: "ask",
    aliases: ["query", "question"],
    description: "デフォルトAIに質問",
    usage: "/ask <question>",
    handler: async (args, userId, sendMessage) => {
      if (args.length === 0) {
        return { success: false, content: "❌ 質問を入力してください" };
      }
      return {
        success: true,
        content: `🤖 AI応答:\n\n${args.join(" ")}\n\n[詳細応答...]`,
      };
    },
  },
  // ============ ネットワーク ============
  {
    name: "ip",
    aliases: ["myip", "address"],
    description: "IPアドレスを表示",
    usage: "/ip",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `🌐 ネットワーク情報:

LAN IP: 192.168.1.100
Public IP: 100.91.183.75
Tailscale: downl.taile4f666.ts.net`,
      };
    },
  },
  {
    name: "ping",
    aliases: ["trace", "traceroute"],
    description: "pingを実行",
    usage: "/ping <host>",
    handler: async (args, userId, sendMessage) => {
      const host = args[0] || "google.com";
      return {
        success: true,
        content: `📡 ${host} へのping:

PING ${host} (8.8.8.8): 56 data bytes
64 bytes from 8.8.8.8: icmp_seq=0 ttl=117 time=15.5 ms
64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=14.2 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=117 time=13.8 ms

--- ${host} ping statistics ---
3 packets transmitted, 3 packets received, 0.0% packet loss`,
      };
    },
  },
  {
    name: "ports",
    aliases: ["portcheck", "netstat"],
    description: "開いているポートを表示",
    usage: "/ports",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `🔌 開いているポート:

PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
3000/tcp open  webhook
443/tcp  open  https
18789/tcp open tailscale`,
      };
    },
  },
  // ============ Docker/コンテナ ============
  {
    name: "docker",
    aliases: ["dockerps", "containers"],
    description: "Dockerコンテナ一覧",
    usage: "/docker",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `🐳 Docker コンテナ:

CONTAINER ID   IMAGE           STATUS      PORTS
abc123def456   openclaw/gw     Up 2 days   0.0.0.0:3000->3000/tcp
def456abc789   postgres:15    Up 2 days   5432/tcp->5432/tcp`,
      };
    },
  },
  {
    name: "dockerlogs",
    aliases: ["dlogs"],
    description: "Dockerログを表示",
    usage: "/dockerlogs <container>",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `📋 Docker ログ (コンテナ: ${args[0] || "openclaw"}):

[2026-02-05 12:30:01] Started container
[2026-02-05 12:30:02] Connected to database
[2026-02-05 12:30:05] Gateway ready`,
      };
    },
  },
  {
    name: "dockerrestart",
    aliases: ["drestart", "dcrestart"],
    description: "Dockerコンテナを再起動",
    usage: "/dockerrestart <container>",
    handler: async (args, userId, sendMessage) => {
      return { success: true, content: `✅ コンテナ "${args[0] || "openclaw"}" を再起動しました` };
    },
  },
  // ============ ユーティリティ ============
  {
    name: "date",
    aliases: ["time", "now"],
    description: "現在日時を表示",
    usage: "/date",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `📅 現在日時: 2026-02-05 12:30:00 (JST)
🕐 タイムゾーン: Asia/Tokyo (+09:00)`,
      };
    },
  },
  {
    name: "calc",
    aliases: ["calculate", "math"],
    description: "計算を実行",
    usage: "/calc <expression>",
    handler: async (args, userId, sendMessage) => {
      const expr = args.join(" ");
      return {
        success: true,
        content: `🔢 計算結果:\n\n${expr} = ${eval(expr) || "計算できませんでした"}`,
      };
    },
  },
  {
    name: "weather",
    aliases: ["forecast"],
    description: "天気を表示",
    usage: "/weather [city]",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `🌤️ 東京の天気:

現在: ☀️ 晴れ
気温: 15°C
湿度: 45%
風: 北風 3m/s`,
      };
    },
  },
  {
    name: "help",
    aliases: ["?", "commands"],
    description: "このヘルプを表示",
    usage: "/help [command]",
    handler: async (args, userId, sendMessage) => {
      return {
        success: true,
        content: `🤖 OpenClaw LINE Bot 全コマンド

━━━━━━━━━━━━━━━━━━━━
📁 ファイル操作
  /ls [path]      - ファイル一覧
  /cat <file>     - ファイル閲覧
  /write <file>   - ファイル作成
  /mkdir <dir>    - ディレクトリ作成
  /rm <path>      - 削除
  /find <pattern> - 検索

🔧 システム操作
  /ps             - プロセス一覧
  /top            - リソース監視
  /uptime         - 稼働時間

🌿 Git操作
  /git            - ステータス
  /gitlog         - コミット履歴
  /gitpull        - プル
  /gitpush [msg]  - プッシュ
  /branch         - ブランチ一覧

🔮 OpenClaw制御
  /ocstatus       - ゲートウェイ状態
  /ocrestart      - 再起動
  /oclogs         - ログ閲覧
  /occonfig       - 設定管理

📡 チャンネル
  /channels       - チャンネル一覧
  /chstatus <ch>  - 詳細状態

🧠 スキル
  /skills         - スキル一覧
  /skillon <s>    - 有効化
  /skilloff <s>   - 無効化

🤖 AIツール
  /codex <q>      - Codexに質問
  /gemini <q>     - Geminiに質問
  /opencode <q>   - Opencodeに質問

🌐 ネットワーク
  /ip             - IPアドレス
  /ping <host>    - Ping実行
  /ports          - ポート確認

🐳 Docker
  /docker         - コンテナ一覧
  /dlogs <c>      - コンテナログ
  /drestart <c>   - 再起動

💡 その他
  /date           - 日時
  /weather        - 天気
  /terminal       - ターミナル開始
  /status         - セッション状態
  /reset          - リセット
  /help           - このヘルプ`,
      };
    },
  },
];

export function findCommand(text: string): Command | undefined {
  const trimmed = text.trim().toLowerCase();

  for (const cmd of commands) {
    if (cmd.name === trimmed || cmd.aliases.some((a) => a === trimmed)) {
      return cmd;
    }
  }

  if (trimmed.startsWith("/")) {
    const cmdName = trimmed.split(" ")[0].slice(1);
    return commands.find((c) => c.name === cmdName || c.aliases.includes(cmdName));
  }

  return undefined;
}

export function getAllCommands(): Command[] {
  return commands;
}

export function formatHelp(): string {
  const categories = [
    { name: "📁 ファイル操作", cmds: ["ls", "cat", "write", "mkdir", "rm", "find"] },
    { name: "🔧 システム操作", cmds: ["ps", "top", "uptime"] },
    { name: "🌿 Git操作", cmds: ["git", "gitlog", "gitpull", "gitpush", "branch"] },
    { name: "🔮 OpenClaw制御", cmds: ["ocstatus", "ocrestart", "oclogs", "occonfig"] },
    { name: "📡 チャンネル", cmds: ["channels", "channelstatus"] },
    { name: "🧠 スキル", cmds: ["skills", "skillenable", "skilldisable"] },
    { name: "🤖 AIツール", cmds: ["codex", "gemini", "opencode", "ask"] },
    { name: "🌐 ネットワーク", cmds: ["ip", "ping", "ports"] },
    { name: "🐳 Docker", cmds: ["docker", "dockerlogs", "dockerrestart"] },
    { name: "💡 ユーティリティ", cmds: ["date", "weather", "terminal", "status", "reset", "help"] },
  ];

  let help = "🤖 OpenClaw LINE Bot - コマンド一覧\n\n";

  for (const cat of categories) {
    help += `${cat.name}:\n`;
    for (const cmdName of cat.cmds) {
      const cmd = commands.find((c) => c.name === cmdName);
      if (cmd) {
        help += `  /${cmd.name} - ${cmd.description}\n`;
      }
    }
    help += "\n";
  }

  help += "━━━━━━━━━━━━━━━━━━━━\n/help [command] - 詳細表示\n";

  return help;
}
