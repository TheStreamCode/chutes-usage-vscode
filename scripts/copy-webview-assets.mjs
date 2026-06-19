import { mkdirSync, copyFileSync } from 'node:fs';
import { dirname } from 'node:path';

// Copies the webview runtime assets into out/ after the TypeScript builds.
// Pure Node so the build works on Windows, macOS and Linux (no PowerShell).
const assets = [
  ['webview/styles.css', 'out/webview/styles.css'],
  ['node_modules/@vscode/codicons/dist/codicon.css', 'out/webview/codicon.css'],
  ['node_modules/@vscode/codicons/dist/codicon.ttf', 'out/webview/codicon.ttf'],
];

for (const [source, destination] of assets) {
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}
