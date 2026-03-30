declare module "qrcode-terminal/vendor/QRCode/index.js" {
  const QRCode: unknown;
  export default QRCode;
}

declare module "qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel.js" {
  const QRErrorCorrectLevel: {
    L: unknown;
    M?: unknown;
    Q?: unknown;
    H?: unknown;
  };
  export default QRErrorCorrectLevel;
}

declare module "@lydell/node-pty" {
  export function spawn(...args: unknown[]): unknown;
  const defaultExport: {
    spawn?: typeof spawn;
  };
  export default defaultExport;
}
