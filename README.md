# chord-extension

Ableton Live extension for generating chord progressions and matching MIDI drum
patterns. It is built with `@ableton-extensions/sdk`.

## Download

Install the latest packaged extension:

- `chord-extension-1.0.5.ablx`

After installing the `.ablx`, restart Ableton Live so the Extension Host refreshes
the installed extension list. The context menu item is named `chord-extension`.

## Requirements

Ableton Extensions are currently available in Live 12 Suite Beta, version 12.4.5
or later. Installed `.ablx` extensions are not available in Live Standard, Intro,
or Lite.

When developing or testing on a machine where the SDK is installed, `npm start`
can launch Live's Extension Host directly. Keep that process running while using
the extension.

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

On Windows, `start-chord-extension-dev.bat` starts the same development host.

If Live logs `Extension Host: check for installed extensions timed out`, the
installed extension itself may still be valid while Live's AddOns process is not
returning the installed extension list. In that case, start Live and then run
`start-installed-chord-extension-host.bat` to launch the installed extension
folder directly.
