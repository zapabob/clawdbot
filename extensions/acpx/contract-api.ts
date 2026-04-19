export const legacyConfigRules = [
  {
    path: ["plugins", "entries", "acpx", "config", "codexHarness"],
    message:
      "plugins.entries.acpx.config.codexHarness is legacy; ACPX ignores it and openclaw doctor --fix will remove it.",
    requireSourceLiteral: true,
  },
];
