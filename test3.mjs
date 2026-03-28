try {
  await import("./extensions/bluebubbles/index.ts");
  console.log("bluebubbles loaded!");
} catch (e) {
  console.error(e.stack || e);
}
