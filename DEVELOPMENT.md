# Builder MVP

This folder contains an Electron-based MVP for the Builder product.

## Run

1) Install dependencies:

   npm install

2) Start the app:

   npm run start

## Shortcuts

- Ctrl/Cmd+Shift+V: analyze clipboard text
- Ctrl/Cmd+Shift+S: screen selection + OCR
- Ctrl/Cmd+Shift+A: manual capture (paste from active app)

## In-app help and language

- The Help button opens usage instructions.
- The language toggle switches between English and Chinese.

## OCR notes

- OCR uses `tesseract.js` with English by default.
- If you want to use local language data, set `BUILDER_TESSDATA_PATH` to the folder that contains the `eng.traineddata` file.

## Structure

- `src/main`: Electron main process, tray, shortcuts, OCR bridge
- `src/renderer`: floating UI and capture overlay
- `src/shared`: command parsing engine and rule set
