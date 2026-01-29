import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * Basic OSCQuery Discovery for VRChat.
 * Fetches the parameter tree from VRChat's HTTP server (usually on port 9001).
 * v1.1: Added Local JSON config fallback.
 */

export interface OSCQueryNode {
  FULL_PATH: string;
  CONTENTS?: Record<string, OSCQueryNode>;
  TYPE?: string;
  VALUE?: any[];
}

export class VRChatOSCQuery {
  private lastAvatarIdText = "";

  constructor(private host = "127.0.0.1", private port = 9001) {}

  /**
   * Fetches the root node (the whole tree).
   */
  async fetchTree(): Promise<OSCQueryNode> {
    return new Promise((resolve, reject) => {
      const url = `http://${this.host}:${this.port}/`;
      http.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`OSCQuery failed with status ${res.statusCode}`));
          return;
        }

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      }).on("error", (err) => reject(err));
    });
  }

  /**
   * Returns a list of all parameter paths found in the tree.
   */
  async listParameters(avatarId?: string): Promise<string[]> {
    const parameters: Set<string> = new Set();

    // 1. Try OSCQuery (Dynamic)
    try {
      const tree = await this.fetchTree();
      this.traverse(tree, parameters);
    } catch (err) {
      // Fallback or ignore
    }

    // 2. Try Local Config (Static cache)
    if (avatarId) {
      const localParams = await this.readLocalConfig(avatarId);
      for (const p of localParams) parameters.add(p);
    }

    return Array.from(parameters);
  }

  private traverse(node: OSCQueryNode, out: Set<string>) {
    if (node.FULL_PATH.startsWith("/avatar/parameters/")) {
      out.add(node.FULL_PATH);
    }
    if (node.CONTENTS) {
      for (const child of Object.values(node.CONTENTS)) {
        this.traverse(child, out);
      }
    }
  }

  /**
   * Scans VRChat's local OSC config folder for the avatar.
   */
  private async readLocalConfig(avatarId: string): Promise<string[]> {
    const results: string[] = [];
    const oscRoot = path.join(
      os.homedir(),
      "AppData",
      "LocalLow",
      "VRChat",
      "VRChat",
      "OSC"
    );

    if (!fs.existsSync(oscRoot)) return [];

    try {
      // The OSC folder contains subfolders which are User IDs (usr_...)
      const userFolders = fs.readdirSync(oscRoot);
      for (const userFolder of userFolders) {
        const avatarConfigPath = path.join(oscRoot, userFolder, "Avatars", `${avatarId}.json`);
        if (fs.existsSync(avatarConfigPath)) {
          const content = fs.readFileSync(avatarConfigPath, "utf-8");
          const config = JSON.parse(content);
          if (config.parameters && Array.isArray(config.parameters)) {
            for (const p of config.parameters) {
              if (p.name) results.push(`/avatar/parameters/${p.name}`);
            }
          }
        }
      }
    } catch (err) {
      // Silently fail if file system access issues
    }

    return results;
  }
}
