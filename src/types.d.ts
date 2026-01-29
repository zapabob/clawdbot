
// Type definitions for modules without @types packages

declare module 'chokidar' {
    export interface FSWatcher {
        on(event: string, callback: Function): FSWatcher;
        close(): Promise<void>;
    }
    export function watch(path: string | string[], options?: any): FSWatcher;
}

declare module '@clack/prompts' {
    export function intro(message: string): void;
    export function outro(message: string): void;
    export function text(opts: any): Promise<any>;
    export function select<T = any>(opts: any): Promise<T | symbol>;
    export function multiselect<T = any>(opts: any): Promise<T[] | symbol>;
    export function confirm(opts: any): Promise<any>;
    export function spinner(): any;
    export function isCancel(value: any): value is symbol;
    export function cancel(message: string): void;
    export function note(message: string, title?: string): void;
    // Mock types
    export type Option<Value> = { value: Value; label: string; hint?: string };
}

declare module 'gradient-string' {
    export function pastel(str: string): string;
    export function cristallo(str: string): string;
    export function teen(str: string): string;
    export function mind(str: string): string;
    export function morning(str: string): string;
    export function vice(str: string): string;
    export function passion(str: string): string;
    export function fruit(str: string): string;
    export function instagram(str: string): string;
    export function retro(str: string): string;
    export function summer(str: string): string;
    export function rainbow(str: string): string;
    export function atlas(str: string): string;
}
