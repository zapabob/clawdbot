# 2026-02-21: Web Exposure (LAN Access) Integration

## 概要 (Overview)

OpenClaw Gateway、アバターのフロントエンドHTMLファイル、およびTTSエンジン（Style-Bert-VITS2）を、`localhost` だけでなくローカルネットワーク（LAN）内からアクセス（Web開放）できるように設定変更を実施しました。
これにより、同じWi-Fi（LAN）に接続しているスマートフォンや別のPCからブラウザでアクセスし、カメラ・マイクを使ったアバターとの対話が可能となります。

## 変更ファイルおよび設定 (Modified Files & Config)

1. **`~/.openclaw/config.json`**
   - `gateway.bind` を `"lan"` に変更し、GatewayのWebSocket接続を `0.0.0.0` （全インターフェース）にバインドするように設定しました。

2. **`scripts/avatar-window.html`**
   - WebSocketやSBV2へのリクエストURLをハードコードの `127.0.0.1` や `localhost` から `` `ws://${window.location.hostname}:3000` `` などの自動解決（アクセス元のホスト名へのリクエスト）に置換しました。

3. **`scripts/start-avatar.bat`**
   - アバターウィンドウの配信に用いられているPython HTTPサーバー (`py -m http.server`) 起動時に `--bind 0.0.0.0` 引数を付与し、LAN内の他のデバイスからもファイルアクセスができるように変更しました。

## テスト確認方法 (How to Verify)

1. `OpenClaw-All-In-One.bat` またはローカルのHTTPサーバー経由で対象のHTMLを起動します。
2. Windowsコンソールで `ipconfig` コマンドを実行し、現在使用しているPCのローカルIPアドレス（例: `192.168.1.5`）を確認します。
3. 同じWi-Fiネットワークに接続しているスマートフォンや別PCから、ブラウザで `http://(PCのローカルIPアドレス):3333/scripts/avatar-window.html` にアクセスします。
4. 画面が表示されたら、「Start Cam」「Start Mic」をクリックし、マイクやカメラへのアクセスを許可してアバターが応答することを確認します。

## 注意事項 (Important Notes)

- **SBV2側（Port 5000）の許可**: OpenClawとHTMLファイルの公開は完了していますが、**Style-Bert-VITS2** 側のサーバーを `0.0.0.0` で公開するように設定する必要がある場合があります。必要に応じてSBV2起動時に `--host 0.0.0.0` などを付与するか、設定ファイルを書き換えてください。
- **Firewallの設定**: Windows Defender Firewall等のセキュリティソフトによってLAN内からのポートアクセス（3000, 3333, 5000等）が遮断される場合があります。テストしてアクセスできない場合は、受信の規則（Inbound Rules）でこれらのポートを許可してください。
- **HTTPSアクセス**: 一部のモバイルブラウザは、`getUserMedia`（マイクおよびカメラへのアクセス）をHTTPS環境、または `localhost`・`127.0.0.1` でのみ許可します。LAN側のIPでアクセスする場合、ブラウザのセキュリティ設定（Chromeの場合は `chrome://flags/#unsafely-treat-insecure-origin-as-secure` 等）での例外追加が必要になる場合があります。
