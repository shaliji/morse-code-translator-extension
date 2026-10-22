# Morse Code Translator — Browser Extension

The official browser extension for **[morsetranslator.me](https://morsetranslator.me/)**: translate text to Morse code and back instantly from the toolbar, with audio playback (600 Hz, 15 WPM PARIS timing).

- Text ⇄ Morse live translation in both directions
- Audio playback and stop
- Swap and clear
- Link to the full web app (audio file decoder, charts, generator)
- Zero permissions, no tracking, works offline — the whole engine is inlined

## Store listings

- **Chrome Web Store**: https://chrome.google.com/webstore/developer/dashboard → New item → upload `morse-code-translator-extension-v1.0.0.zip`
  - Category: Productivity · Language: English
  - Website field: `https://morsetranslator.me/`
- **Opera add-ons**: https://addons.opera.com/developer/ → Upload new extension (same zip)
  - "Service website" field: `https://morsetranslator.me/`

## Package a new version

```bash
zip -r morse-code-translator-extension-v1.0.0.zip manifest.json popup.html popup.css popup.js icons/
```

Bump `version` in `manifest.json` and the zip name together.

## License

MIT
