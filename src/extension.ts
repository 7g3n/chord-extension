import {
  initialize,
  type ActivationContext,
  type ContextMenuScope,
  type ExtensionContext,
  type NoteDescription,
} from "@ableton-extensions/sdk";

// esbuild inlines this HTML file as a string for production builds.
import bundledInterface from "../ui/interface.html";

const API_VERSION = "1.0.0";
const MENU_TITLE = "chord-extension";

const MENU_ACTIONS: { scope: ContextMenuScope<typeof API_VERSION>; commandId: string }[] = [
  { scope: "AudioClip", commandId: "chord-extension.showDialog" },
  { scope: "MidiClip", commandId: "chord-extension.showDialog.midiClip" },
  { scope: "AudioTrack", commandId: "chord-extension.showDialog.audioTrack" },
  { scope: "MidiTrack", commandId: "chord-extension.showDialog.midiTrack" },
  { scope: "ClipSlot", commandId: "chord-extension.showDialog.clipSlot" },
  { scope: "ClipSlotSelection", commandId: "chord-extension.showDialog.clipSlotSelection" },
  { scope: "AudioTrack.ArrangementSelection", commandId: "chord-extension.showDialog.audioArrangement" },
  { scope: "MidiTrack.ArrangementSelection", commandId: "chord-extension.showDialog.midiArrangement" },
];

const LEGACY_COMMAND_IDS = ["chord-extension.showGenerator"];

type GeneratedNote = {
  pitch: number;
  startTime: number;
  duration: number;
  velocity?: number;
  muted?: boolean;
  probability?: number;
  velocityDeviation?: number;
  releaseVelocity?: number;
  selected?: boolean;
};

type CreationPayload = {
  action: "create_midi_clips";
  version: number;
  title?: string;
  lengthBeats: number;
  chordTrackName?: string;
  drumTrackName?: string;
  chordNotes: GeneratedNote[];
  drumNotes: GeneratedNote[];
};

type Extension = ExtensionContext<typeof API_VERSION>;

export function activate(activation: ActivationContext) {
  const context = initialize(activation, API_VERSION);

  console.log(`chord-extension activated. hostApiVersion=${activation.hostApiVersion}`);

  const openCommand = () => {
    void openGenerator(context);
  };

  [...MENU_ACTIONS.map((action) => action.commandId), ...LEGACY_COMMAND_IDS].forEach((commandId) => {
    context.commands.registerCommand(commandId, openCommand);
    console.log(`chord-extension command registered: ${commandId}`);
  });

  MENU_ACTIONS.forEach(({ scope, commandId }) => {
    void context.ui
      .registerContextMenuAction(scope, MENU_TITLE, commandId)
      .then(() => {
        console.log(`chord-extension context menu registered: ${scope}`);
      })
      .catch((error: unknown) => {
        console.error(`Failed to register ${scope} context menu`, error);
      });
  });
}

async function openGenerator(context: Extension) {
  const html = buildDialogHtml(context);
  const url = `data:text/html,${encodeURIComponent(html)}`;
  const result = await context.ui.showModalDialog(url, 980, 760);
  const payload = parseCreationPayload(result);

  if (!payload) {
    console.log(`Chord generator closed with: ${result}`);
    return;
  }

  await createMidiClips(context, payload);
}

function buildDialogHtml(context: Extension) {
  const song = context.application.song;
  const liveContext = {
    rootNote: song.rootNote,
    scaleName: song.scaleName,
    scaleMode: song.scaleMode,
    tempo: song.tempo,
  };
  const serialized = JSON.stringify(liveContext)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return bundledInterface.replace("__LIVE_CONTEXT_JSON__", serialized);
}

function parseCreationPayload(result: string): CreationPayload | null {
  if (!result || result === "cancel") return null;

  try {
    const parsed = JSON.parse(result) as Partial<CreationPayload>;
    if (parsed.action !== "create_midi_clips") return null;
    if (!Array.isArray(parsed.chordNotes) || !Array.isArray(parsed.drumNotes)) return null;

    return {
      action: "create_midi_clips",
      version: Number(parsed.version) || 1,
      title: typeof parsed.title === "string" ? parsed.title : undefined,
      lengthBeats: clamp(Number(parsed.lengthBeats) || 16, 1, 512),
      chordTrackName: typeof parsed.chordTrackName === "string" ? parsed.chordTrackName : undefined,
      drumTrackName: typeof parsed.drumTrackName === "string" ? parsed.drumTrackName : undefined,
      chordNotes: parsed.chordNotes,
      drumNotes: parsed.drumNotes,
    };
  } catch (error) {
    console.error("Failed to parse chord generator payload", error);
    return null;
  }
}

async function createMidiClips(context: Extension, payload: CreationPayload) {
  const lengthBeats = clamp(payload.lengthBeats, 1, 512);
  const chordNotes = sanitizeNotes(payload.chordNotes, lengthBeats);
  const drumNotes = sanitizeNotes(payload.drumNotes, lengthBeats);

  const song = context.application.song;
  const [chordTrack, drumTrack] = await context.withinTransaction(() =>
    Promise.all([song.createMidiTrack(), song.createMidiTrack()]),
  );

  chordTrack.name = payload.chordTrackName || "Generated Chords";
  drumTrack.name = payload.drumTrackName || "Generated Drums";

  try {
    await drumTrack.insertDevice("Drum Rack", 0);
  } catch (error) {
    console.warn("Could not insert Drum Rack. The MIDI drum clip was still created.", error);
  }

  const [chordClip, drumClip] = await context.withinTransaction(() =>
    Promise.all([chordTrack.createMidiClip(0, lengthBeats), drumTrack.createMidiClip(0, lengthBeats)]),
  );

  chordClip.name = payload.title ? `Chords - ${payload.title}` : "Generated Chords";
  drumClip.name = payload.title ? `Drums - ${payload.title}` : "Generated Drums";

  context.withinTransaction(() => {
    chordClip.looping = true;
    drumClip.looping = true;
    chordClip.notes = chordNotes;
    drumClip.notes = drumNotes;
  });

  console.log(`Created chord clip with ${chordNotes.length} notes and drum clip with ${drumNotes.length} notes.`);
}

function sanitizeNotes(notes: GeneratedNote[], lengthBeats: number): NoteDescription[] {
  return notes
    .map((note) => {
      const startTime = clamp(Number(note.startTime) || 0, 0, lengthBeats);
      const duration = clamp(Number(note.duration) || 0.125, 0.03125, Math.max(0.03125, lengthBeats - startTime));

      return {
        pitch: Math.round(clamp(Number(note.pitch) || 0, 0, 127)),
        startTime,
        duration,
        velocity: Math.round(clamp(Number(note.velocity) || 96, 1, 127)),
        muted: Boolean(note.muted),
        probability: note.probability === undefined ? undefined : clamp(Number(note.probability), 0, 1),
        velocityDeviation:
          note.velocityDeviation === undefined ? undefined : clamp(Number(note.velocityDeviation), 0, 127),
        releaseVelocity: note.releaseVelocity === undefined ? undefined : clamp(Number(note.releaseVelocity), 0, 127),
        selected: Boolean(note.selected),
      };
    })
    .filter((note) => note.duration > 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
