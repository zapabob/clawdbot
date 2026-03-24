declare module "@microsoft/teams.apps" {
  export class App {
    constructor(...args: any[]);
    getAppGraphToken?(): Promise<{ toString(): string } | null>;
    getBotToken?(): Promise<{ toString(): string } | null>;
  }
}

declare module "@microsoft/teams.api" {
  export class Client {
    constructor(...args: any[]);
    conversations: any;
  }
}

declare module "@microsoft/teams.apps/dist/middleware/auth/jwt-validator.js" {
  export function createServiceTokenValidator(...args: any[]): any;
}

declare module "@create-markdown/preview" {
  export function applyPreviewTheme(...args: any[]): string;
  export function marked(input: string): string;
}
