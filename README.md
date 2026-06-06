# chord-extension

Ableton Live extension for generating chord progressions and matching MIDI drum
patterns. It is built with `@ableton-extensions/sdk`.

## Download

Install the latest packaged extension:

- `chord-extension-1.0.5.ablx`

After installing the `.ablx`, restart Ableton Live so the Extension Host refreshes
the installed extension list. The context menu item is named `chord-extension`.

## Features

- Generate chord progressions by key, scale, mood, style, length, and complexity.
- Generate a matching drum pattern with kick accents, hats, backbeat, and fills.
- Create two MIDI tracks in Live: one for chords and one for drums.
- Includes Lo-fi, City Pop, House, Future Bass, Kawaii Future Bass, Trap, Funk,
  and Ballad styles.
- Future Bass and Kawaii Future Bass BPM can be freely adjusted.

## Usage

Open `chord-extension` from a supported Ableton Live context menu, such as:

- MIDI clip
- audio clip
- MIDI/audio track header
- clip slot
- arrangement selection

For MIDI clips, right-click the clip block in Session or Arrangement View.

## Development

The path to Ableton Live's Extension Host module is stored in `.env` as
`EXTENSION_HOST_PATH`. This file is intentionally not committed.

```sh
npm install
npm start
npm run build
npm run package
```

`npm run package` builds the production bundle and creates a `.ablx` archive.
