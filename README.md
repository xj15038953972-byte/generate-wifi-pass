# Generate WiFi Pass

Strong WiFi password generator — 100% client-side, nothing uploaded.

## Features

- Cryptographically secure passwords via `crypto.getRandomValues`
- Length 8–63 (WPA compatible)
- Custom character sets + exclude ambiguous characters
- Strength indicator
- One-click copy
- WiFi QR code generation & download

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

Static output goes to `dist/` — deploy to GitHub Pages, Vercel, or Netlify.

## Privacy

All generation happens in your browser. No passwords are sent to any server.

See [PRD.md](./PRD.md) for full product requirements.
