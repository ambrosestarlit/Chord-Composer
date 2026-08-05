"use strict";

const ROOTS = [
  { label: "C", semitone: 0 },
  { label: "C#", semitone: 1 },
  { label: "D", semitone: 2 },
  { label: "D#", semitone: 3 },
  { label: "E", semitone: 4 },
  { label: "F", semitone: 5 },
  { label: "F#", semitone: 6 },
  { label: "G", semitone: 7 },
  { label: "G#", semitone: 8 },
  { label: "A", semitone: 9 },
  { label: "A#", semitone: 10 },
  { label: "B", semitone: 11 }
];

const QUALITIES = [
  { id: "major", name: "メジャー", suffix: "", intervals: [0, 4, 7] },
  { id: "minor", name: "マイナー", suffix: "m", intervals: [0, 3, 7] },
  { id: "7", name: "セブンス", suffix: "7", intervals: [0, 4, 7, 10] },
  { id: "maj7", name: "メジャーセブンス", suffix: "maj7", intervals: [0, 4, 7, 11] },
  { id: "m7", name: "マイナーセブンス", suffix: "m7", intervals: [0, 3, 7, 10] },
  { id: "sus4", name: "サスフォー", suffix: "sus4", intervals: [0, 5, 7] },
  { id: "dim", name: "ディミニッシュ", suffix: "dim", intervals: [0, 3, 6] },
  { id: "aug", name: "オーギュメント", suffix: "aug", intervals: [0, 4, 8] }
];

const PLAY_STYLES = new Set([
  "block",
  "quarter",
  "arpeggio",
  "singleBacking",
  "counterMelody",
  "fillIn",
  "ostinato"
]);

const BASE_TEMPLATES = [
  {
    id: "royal-road",
    name: "王道進行（C–G–Am–F）",
    description: "ポップスで使いやすい、明るく安定した定番進行です。",
    chords: [[0, "major"], [7, "major"], [9, "minor"], [5, "major"]]
  },
  {
    id: "canon",
    name: "カノン進行",
    description: "滑らかに流れる8コードの定番進行です。",
    chords: [[0, "major"], [7, "major"], [9, "minor"], [4, "minor"], [5, "major"], [0, "major"], [5, "major"], [7, "major"]]
  },
  {
    id: "komuro",
    name: "小室進行（Am–F–G–C）",
    description: "切なさから明るさへ向かう、J-POP向けの進行です。",
    chords: [[9, "minor"], [5, "major"], [7, "major"], [0, "major"]]
  },
  {
    id: "four-five-three-six",
    name: "4536進行（F–G–Em–Am）",
    description: "感情的でドラマチックな展開を作りやすい進行です。",
    chords: [[5, "major"], [7, "major"], [4, "minor"], [9, "minor"]]
  },
  {
    id: "circle",
    name: "循環進行（C–Am–Dm–G）",
    description: "自然に先頭へ戻りやすい循環型の進行です。",
    chords: [[0, "major"], [9, "minor"], [2, "minor"], [7, "major"]]
  },
  {
    id: "jazz-251",
    name: "ジャズ II–V–I",
    description: "Dm7–G7–Cmaj7の基本的なジャズ進行です。",
    chords: [[2, "m7"], [7, "7"], [0, "maj7"]]
  },
  {
    id: "fifties",
    name: "50年代進行（C–Am–F–G）",
    description: "懐かしく親しみやすい雰囲気の循環進行です。",
    chords: [[0, "major"], [9, "minor"], [5, "major"], [7, "major"]]
  },
  {
    id: "minor-cadence",
    name: "マイナー進行（Am–G–F–E7）",
    description: "緊張感を保ちながらAmへ戻れるマイナー進行です。",
    chords: [[9, "minor"], [7, "major"], [5, "major"], [4, "7"]]
  }
];

const STORAGE_KEY = "chord-composer-state-v3";
const LEGACY_STORAGE_KEYS = ["chord-composer-state-v2", "chord-composer-state-v1"];

const state = {
  selectedRoot: ROOTS[0],
  selectedQuality: QUALITIES[0],
  sequence: [],
  customTemplates: [],
  audioContext: null,
  masterNode: null,
  activeNodes: new Set(),
  playbackTimers: [],
  isPlaying: false
};

const elements = {
  audioStatus: document.querySelector("#audioStatus"),
  bpmInput: document.querySelector("#bpmInput"),
  lengthSelect: document.querySelector("#lengthSelect"),
  playStyleSelect: document.querySelector("#playStyleSelect"),
  rootNoteToggle: document.querySelector("#rootNoteToggle"),
  offbeatToggle: document.querySelector("#offbeatToggle"),
  metronomeToggle: document.querySelector("#metronomeToggle"),
  playButton: document.querySelector("#playButton"),
  stopButton: document.querySelector("#stopButton"),
  clearSequenceButton: document.querySelector("#clearSequenceButton"),
  qualitySelect: document.querySelector("#qualitySelect"),
  chordGrid: document.querySelector("#chordGrid"),
  selectedChordLabel: document.querySelector("#selectedChordLabel"),
  addChordButton: document.querySelector("#addChordButton"),
  emptySequence: document.querySelector("#emptySequence"),
  sequenceTrack: document.querySelector("#sequenceTrack"),
  sequenceSummary: document.querySelector("#sequenceSummary"),
  exportMidiButton: document.querySelector("#exportMidiButton"),
  exportWavButton: document.querySelector("#exportWavButton"),
  projectImportButton: document.querySelector("#projectImportButton"),
  projectExportButton: document.querySelector("#projectExportButton"),
  projectFileInput: document.querySelector("#projectFileInput"),
  projectIoMessage: document.querySelector("#projectIoMessage"),
  progressionTemplateSelect: document.querySelector("#progressionTemplateSelect"),
  previewTemplateButton: document.querySelector("#previewTemplateButton"),
  insertTemplateButton: document.querySelector("#insertTemplateButton"),
  templateTypeBadge: document.querySelector("#templateTypeBadge"),
  templateChordList: document.querySelector("#templateChordList"),
  templateDescription: document.querySelector("#templateDescription"),
  customTemplateName: document.querySelector("#customTemplateName"),
  saveTemplateButton: document.querySelector("#saveTemplateButton"),
  deleteTemplateButton: document.querySelector("#deleteTemplateButton"),
  templateSaveMessage: document.querySelector("#templateSaveMessage"),
  sequenceItemTemplate: document.querySelector("#sequenceItemTemplate")
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function makeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getRootBySemitone(semitone) {
  const normalized = ((Number(semitone) % 12) + 12) % 12;
  return ROOTS.find((root) => root.semitone === normalized) || ROOTS[0];
}

function getQualityById(id) {
  return QUALITIES.find((quality) => quality.id === id) || QUALITIES[0];
}

function normalizeStyle(style) {
  return PLAY_STYLES.has(style) ? style : "block";
}

function getBpm() {
  const bpm = clamp(Number.parseInt(elements.bpmInput.value, 10) || 120, 30, 300);
  elements.bpmInput.value = String(bpm);
  return bpm;
}

function getSecondsPerBeat() {
  return 60 / getBpm();
}

function getChordLabel(root = state.selectedRoot, quality = state.selectedQuality) {
  return `${root.label}${quality.suffix}`;
}

function normalizeSequenceItem(item, fallback = {}) {
  const offbeat = Boolean(item?.offbeat ?? fallback.offbeat ?? false);
  const rootNote = offbeat || Boolean(item?.rootNote ?? fallback.rootNote ?? false);
  return {
    id: typeof item?.id === "string" ? item.id : makeId(),
    rootSemitone: getRootBySemitone(item?.rootSemitone ?? fallback.rootSemitone ?? 0).semitone,
    qualityId: getQualityById(item?.qualityId ?? fallback.qualityId ?? "major").id,
    beats: [1, 2, 4, 8].includes(Number(item?.beats ?? fallback.beats)) ? Number(item?.beats ?? fallback.beats) : 4,
    style: normalizeStyle(item?.style ?? fallback.style),
    rootNote,
    offbeat
  };
}

function getInsertSettings() {
  const offbeat = elements.offbeatToggle.checked;
  return {
    beats: [1, 2, 4, 8].includes(Number(elements.lengthSelect.value)) ? Number(elements.lengthSelect.value) : 4,
    style: normalizeStyle(elements.playStyleSelect.value),
    rootNote: offbeat || elements.rootNoteToggle.checked,
    offbeat
  };
}

function midiToFrequency(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

function getBassNote(rootSemitone) {
  return 36 + getRootBySemitone(rootSemitone).semitone;
}

function getBaseRightNotes(rootSemitone, qualityId) {
  const quality = getQualityById(qualityId);
  let base = 60 + getRootBySemitone(rootSemitone).semitone;
  if (base > 67) {
    base -= 12;
  }
  return quality.intervals.map((interval) => base + interval);
}

function createVoicingCandidates(item) {
  const base = getBaseRightNotes(item.rootSemitone, item.qualityId);
  const candidates = [];
  const seen = new Set();

  for (let inversion = 0; inversion < base.length; inversion += 1) {
    const inverted = base.map((note, index) => note + (index < inversion ? 12 : 0)).sort((a, b) => a - b);
    for (let shift = -24; shift <= 12; shift += 12) {
      const notes = inverted.map((note) => note + shift);
      if (notes[0] < 48 || notes.at(-1) > 86) {
        continue;
      }
      const key = notes.join(",");
      if (!seen.has(key)) {
        seen.add(key);
        candidates.push({ notes, inversion, shift });
      }
    }
  }

  return candidates;
}

function voicingDistance(previous, current) {
  const currentToPrevious = current.reduce((sum, note) => {
    return sum + Math.min(...previous.map((other) => Math.abs(note - other)));
  }, 0);
  const previousToCurrent = previous.reduce((sum, note) => {
    return sum + Math.min(...current.map((other) => Math.abs(note - other)));
  }, 0);
  const center = current.reduce((sum, note) => sum + note, 0) / current.length;
  const spread = current.at(-1) - current[0];
  return currentToPrevious + previousToCurrent * 0.55 + Math.abs(center - 66) * 0.14 + Math.max(0, spread - 18) * 0.3;
}

function getInversionLabel(candidate) {
  const inversionName = candidate.inversion === 0 ? "基本形" : `第${candidate.inversion}転回形`;
  if (candidate.shift <= -12) {
    return `${inversionName}（低め）`;
  }
  if (candidate.shift >= 12) {
    return `${inversionName}（高め）`;
  }
  return inversionName;
}

function computeVoiceLeading(sequence) {
  const result = [];
  let previousNotes = null;

  sequence.forEach((item, index) => {
    const candidates = createVoicingCandidates(item);
    let selected = candidates[0] || { notes: getBaseRightNotes(item.rootSemitone, item.qualityId), inversion: 0, shift: 0 };
    let bestCost = Number.POSITIVE_INFINITY;

    candidates.forEach((candidate) => {
      const center = candidate.notes.reduce((sum, note) => sum + note, 0) / candidate.notes.length;
      const cost = previousNotes
        ? voicingDistance(previousNotes, candidate.notes)
        : Math.abs(center - 66) * 0.45 + candidate.inversion * 0.35 + Math.abs(candidate.shift) * 0.02;
      if (cost < bestCost) {
        bestCost = cost;
        selected = candidate;
      }
    });

    result.push({
      notes: selected.notes,
      label: getInversionLabel(selected),
      index
    });
    previousNotes = selected.notes;
  });

  return result;
}

function addNoteEvent(events, startBeat, durationBeats, note, velocity, part = "right") {
  if (durationBeats <= 0) {
    return;
  }
  events.push({
    startBeat: Math.max(0, startBeat),
    durationBeats: Math.max(0.04, durationBeats),
    note: clamp(Math.round(note), 0, 127),
    velocity: clamp(Math.round(velocity), 1, 127),
    part
  });
}

function scheduleOnePassPattern(events, pattern, itemStart, itemBeats, options = {}) {
  if (pattern.length === 0) {
    return;
  }
  const preferredStep = options.preferredStep ?? 0.5;
  const step = Math.min(preferredStep, itemBeats / pattern.length);
  const total = step * pattern.length;
  const offset = options.align === "end" ? Math.max(0, itemBeats - total) : 0;
  const velocity = options.velocity ?? 82;

  pattern.forEach((note, index) => {
    addNoteEvent(
      events,
      itemStart + offset + index * step,
      Math.max(0.06, step * 0.82),
      note,
      velocity + (index === pattern.length - 1 ? 3 : 0),
      "right"
    );
  });
}

function addRightHandEvents(events, item, notes, itemStart) {
  const itemBeats = item.beats;

  if (item.style === "block") {
    notes.forEach((note) => addNoteEvent(events, itemStart, Math.max(0.08, itemBeats - 0.05), note, 82, "right"));
    return;
  }

  if (item.style === "quarter") {
    for (let beat = 0; beat < itemBeats; beat += 1) {
      const duration = Math.min(0.88, itemBeats - beat);
      notes.forEach((note) => addNoteEvent(events, itemStart + beat, duration, note, beat === 0 ? 86 : 78, "right"));
    }
    return;
  }

  if (item.style === "arpeggio") {
    const step = 0.5;
    const count = Math.ceil(itemBeats / step);
    for (let index = 0; index < count; index += 1) {
      const start = index * step;
      const remaining = itemBeats - start;
      if (remaining <= 0) {
        break;
      }
      addNoteEvent(events, itemStart + start, Math.min(0.44, remaining), notes[index % notes.length], 78, "right");
    }
    return;
  }

  if (item.style === "singleBacking") {
    const last = notes.length - 1;
    const pattern = [notes[0], notes[last], notes[Math.min(1, last)], notes[last]];
    scheduleOnePassPattern(events, pattern, itemStart, itemBeats, { velocity: 78 });
    return;
  }

  if (item.style === "counterMelody") {
    const extended = [...notes, notes[0] + 12];
    const last = extended.length - 1;
    const pattern = [
      extended[Math.min(1, last)],
      extended[Math.min(2, last)],
      extended[last],
      extended[Math.min(2, last)],
      extended[Math.min(1, last)],
      extended[0]
    ];
    scheduleOnePassPattern(events, pattern, itemStart, itemBeats, { velocity: 84 });
    return;
  }

  if (item.style === "fillIn") {
    const ascending = [...notes, notes[0] + 12];
    const descending = notes.slice(1).reverse();
    const pattern = [...ascending, ...descending];
    scheduleOnePassPattern(events, pattern, itemStart, itemBeats, { align: "end", velocity: 88 });
    return;
  }

  if (item.style === "ostinato") {
    const last = notes.length - 1;
    const middle = notes[Math.min(1, last)];
    const pattern = [notes[0], notes[last], middle, notes[last]];
    scheduleOnePassPattern(events, pattern, itemStart, itemBeats, { velocity: 80 });
  }
}

function addBassEvents(events, item, itemStart) {
  if (!item.rootNote && !item.offbeat) {
    return;
  }

  const bass = getBassNote(item.rootSemitone);
  if (item.offbeat) {
    const firstDuration = Math.max(0.08, item.beats - 0.55);
    addNoteEvent(events, itemStart, firstDuration, bass, 94, "bass");
    addNoteEvent(events, itemStart + Math.max(0, item.beats - 0.5), 0.45, bass, 101, "bass");
  } else {
    addNoteEvent(events, itemStart, Math.max(0.08, item.beats - 0.05), bass, 96, "bass");
  }
}

function buildNoteEvents(sequence) {
  const normalized = sequence.map((item) => normalizeSequenceItem(item));
  const voiceLeading = computeVoiceLeading(normalized);
  const events = [];
  let beatCursor = 0;

  normalized.forEach((item, index) => {
    addRightHandEvents(events, item, voiceLeading[index].notes, beatCursor);
    addBassEvents(events, item, beatCursor);
    beatCursor += item.beats;
  });

  return { events, totalBeats: beatCursor, voiceLeading };
}

async function ensureAudioContext() {
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("このブラウザはWeb Audio APIに対応していません。");
    }
    state.audioContext = new AudioContextClass();

    const compressor = state.audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, state.audioContext.currentTime);
    compressor.knee.setValueAtTime(18, state.audioContext.currentTime);
    compressor.ratio.setValueAtTime(3, state.audioContext.currentTime);
    compressor.attack.setValueAtTime(0.006, state.audioContext.currentTime);
    compressor.release.setValueAtTime(0.24, state.audioContext.currentTime);

    const master = state.audioContext.createGain();
    master.gain.setValueAtTime(0.82, state.audioContext.currentTime);
    master.connect(compressor);
    compressor.connect(state.audioContext.destination);
    state.masterNode = master;
  }

  if (state.audioContext.state === "suspended") {
    await state.audioContext.resume();
  }

  elements.audioStatus.textContent = "Audio: ピアノ音源使用可能";
  return state.audioContext;
}

function createPianoNote(context, destination, midiNote, startTime, duration, volume = 0.12) {
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(midiNote < 48 ? 2600 : 4200, startTime);
  filter.Q.setValueAtTime(0.7, startTime);
  filter.connect(destination);

  const isBass = midiNote < 48;
  const partials = isBass
    ? [[1, 0.5], [2, 0.28], [3, 0.14], [4, 0.07]]
    : [[1, 0.58], [2, 0.2], [3, 0.1], [4, 0.045]];
  const endTime = startTime + Math.max(0.05, duration);
  const attack = Math.min(0.012, duration * 0.12);
  const decayEnd = Math.min(endTime - 0.03, startTime + Math.min(0.34, duration * 0.45));

  partials.forEach(([multiple, level], partialIndex) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = partialIndex === 0 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(midiToFrequency(midiNote) * multiple, startTime);
    oscillator.detune.setValueAtTime(partialIndex % 2 === 0 ? 1.5 : -1.5, startTime);

    const peak = Math.max(0.0002, volume * level);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peak, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * 0.38), Math.max(startTime + attack + 0.01, decayEnd));
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gain);
    gain.connect(filter);
    oscillator.start(startTime);
    oscillator.stop(endTime + 0.03);

    if (context === state.audioContext) {
      state.activeNodes.add(oscillator);
      oscillator.addEventListener("ended", () => state.activeNodes.delete(oscillator), { once: true });
    }
  });
}

function scheduleMetronomeClick(context, destination, startTime, accent = false) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(accent ? 1550 : 1080, startTime);
  gain.gain.setValueAtTime(accent ? 0.09 : 0.052, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.045);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.055);

  if (context === state.audioContext) {
    state.activeNodes.add(oscillator);
    oscillator.addEventListener("ended", () => state.activeNodes.delete(oscillator), { once: true });
  }
}

function clearPlaybackTimers() {
  state.playbackTimers.forEach((timerId) => window.clearTimeout(timerId));
  state.playbackTimers = [];
}

function setActiveSequenceIndex(index) {
  elements.sequenceTrack.querySelectorAll(".sequence-item").forEach((node) => {
    node.classList.toggle("is-playing", Number(node.dataset.index) === index);
  });
}

function stopPlayback(updateStatus = true) {
  clearPlaybackTimers();
  state.activeNodes.forEach((node) => {
    try {
      node.stop();
    } catch (_error) {
      // すでに停止したノードは無視します。
    }
  });
  state.activeNodes.clear();
  state.isPlaying = false;
  setActiveSequenceIndex(-1);
  updateButtonStates();
  if (updateStatus) {
    elements.audioStatus.textContent = "Audio: 停止";
  }
}

async function playSequenceData(sequence, options = {}) {
  if (!Array.isArray(sequence) || sequence.length === 0) {
    return;
  }

  try {
    const context = await ensureAudioContext();
    stopPlayback(false);
    state.isPlaying = true;
    updateButtonStates();

    const { events, totalBeats } = buildNoteEvents(sequence);
    const secondsPerBeat = getSecondsPerBeat();
    const startTime = context.currentTime + 0.08;
    const destination = state.masterNode || context.destination;

    events.forEach((event) => {
      const volume = (event.velocity / 127) * (event.part === "bass" ? 0.19 : 0.13);
      createPianoNote(
        context,
        destination,
        event.note,
        startTime + event.startBeat * secondsPerBeat,
        event.durationBeats * secondsPerBeat,
        volume
      );
    });

    if (elements.metronomeToggle.checked) {
      for (let beat = 0; beat < totalBeats; beat += 1) {
        scheduleMetronomeClick(context, destination, startTime + beat * secondsPerBeat, beat % 4 === 0);
      }
    }

    if (options.highlightMain) {
      let beatCursor = 0;
      sequence.forEach((item, index) => {
        const delay = Math.max(0, (startTime + beatCursor * secondsPerBeat - context.currentTime) * 1000);
        state.playbackTimers.push(window.setTimeout(() => setActiveSequenceIndex(index), delay));
        beatCursor += normalizeSequenceItem(item).beats;
      });
    }

    elements.audioStatus.textContent = options.statusText || "Audio: 再生中";
    const finishDelay = Math.max(0, (startTime + totalBeats * secondsPerBeat - context.currentTime) * 1000 + 100);
    state.playbackTimers.push(window.setTimeout(() => {
      state.isPlaying = false;
      setActiveSequenceIndex(-1);
      clearPlaybackTimers();
      updateButtonStates();
      elements.audioStatus.textContent = options.finishText || "Audio: 再生完了";
    }, finishDelay));
  } catch (error) {
    stopPlayback(false);
    showError(error);
  }
}

function previewSelectedChord(root = state.selectedRoot, quality = state.selectedQuality) {
  const settings = getInsertSettings();
  return playSequenceData([
    normalizeSequenceItem({
      rootSemitone: root.semitone,
      qualityId: quality.id,
      ...settings
    })
  ], {
    statusText: "Audio: コード試聴中",
    finishText: "Audio: 試聴完了"
  });
}

function populateQualitySelect() {
  const fragment = document.createDocumentFragment();
  QUALITIES.forEach((quality) => {
    const option = document.createElement("option");
    option.value = quality.id;
    option.textContent = quality.name;
    fragment.appendChild(option);
  });
  elements.qualitySelect.replaceChildren(fragment);
}

function renderChordGrid() {
  const fragment = document.createDocumentFragment();
  ROOTS.forEach((root) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chord-button";
    button.textContent = getChordLabel(root, state.selectedQuality);
    button.setAttribute("role", "listitem");
    const selected = root.semitone === state.selectedRoot.semitone;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.addEventListener("click", () => {
      state.selectedRoot = root;
      renderChordGrid();
      updateSelectedChordLabel();
      saveState();
      previewSelectedChord(root, state.selectedQuality);
    });
    fragment.appendChild(button);
  });
  elements.chordGrid.replaceChildren(fragment);
}

function updateSelectedChordLabel() {
  elements.selectedChordLabel.textContent = getChordLabel();
}

function addSelectedChord() {
  const settings = getInsertSettings();
  state.sequence.push(normalizeSequenceItem({
    rootSemitone: state.selectedRoot.semitone,
    qualityId: state.selectedQuality.id,
    ...settings
  }));
  renderSequence();
  saveState();
}

function removeSequenceItem(id) {
  state.sequence = state.sequence.filter((item) => item.id !== id);
  renderSequence();
  saveState();
}

function renderSequence() {
  state.sequence = state.sequence.map((item) => normalizeSequenceItem(item));
  const voiceLeading = computeVoiceLeading(state.sequence);
  const fragment = document.createDocumentFragment();

  state.sequence.forEach((item, index) => {
    const root = getRootBySemitone(item.rootSemitone);
    const quality = getQualityById(item.qualityId);
    const node = elements.sequenceItemTemplate.content.firstElementChild.cloneNode(true);
    const styleSelect = node.querySelector(".sequence-style-select");
    const rootToggle = node.querySelector(".sequence-root-toggle");
    const offbeatToggle = node.querySelector(".sequence-offbeat-toggle");

    node.dataset.id = item.id;
    node.dataset.index = String(index);
    node.querySelector(".sequence-index").textContent = String(index + 1).padStart(2, "0");
    node.querySelector(".sequence-chord").textContent = getChordLabel(root, quality);
    node.querySelector(".sequence-length").textContent = `${item.beats}拍`;
    node.querySelector(".sequence-inversion").textContent = `右手：${voiceLeading[index].label}`;
    styleSelect.value = item.style;
    rootToggle.checked = item.rootNote;
    offbeatToggle.checked = item.offbeat;

    styleSelect.addEventListener("change", () => {
      item.style = normalizeStyle(styleSelect.value);
      saveState();
    });

    rootToggle.addEventListener("change", () => {
      item.rootNote = rootToggle.checked;
      if (!item.rootNote) {
        item.offbeat = false;
        offbeatToggle.checked = false;
      }
      saveState();
    });

    offbeatToggle.addEventListener("change", () => {
      item.offbeat = offbeatToggle.checked;
      if (item.offbeat) {
        item.rootNote = true;
        rootToggle.checked = true;
      }
      saveState();
    });

    node.addEventListener("dblclick", (event) => {
      if (event.target.closest("select, input, label, button")) {
        return;
      }
      removeSequenceItem(item.id);
    });

    node.addEventListener("keydown", (event) => {
      if ((event.key === "Delete" || event.key === "Backspace") && !event.target.closest("select, input")) {
        event.preventDefault();
        removeSequenceItem(item.id);
      }
    });

    fragment.appendChild(node);
  });

  elements.sequenceTrack.replaceChildren(fragment);
  elements.emptySequence.hidden = state.sequence.length > 0;
  elements.sequenceTrack.hidden = state.sequence.length === 0;
  const totalBeats = state.sequence.reduce((sum, item) => sum + item.beats, 0);
  elements.sequenceSummary.textContent = `${state.sequence.length}コード / ${totalBeats}拍`;
  updateButtonStates();
}

function updateButtonStates() {
  const empty = state.sequence.length === 0;
  elements.playButton.disabled = empty || state.isPlaying;
  elements.stopButton.disabled = !state.isPlaying;
  elements.clearSequenceButton.disabled = empty;
  elements.exportMidiButton.disabled = empty;
  elements.exportWavButton.disabled = empty;
  elements.saveTemplateButton.disabled = empty;
  const template = getSelectedTemplate();
  elements.deleteTemplateButton.disabled = !template || template.type !== "custom";
}

function getAllTemplates() {
  return [
    ...BASE_TEMPLATES.map((template) => ({ ...template, type: "builtin" })),
    ...state.customTemplates.map((template) => ({ ...template, type: "custom" }))
  ];
}

function getSelectedTemplate() {
  const id = elements.progressionTemplateSelect.value;
  return getAllTemplates().find((template) => template.id === id) || getAllTemplates()[0] || null;
}

function templateToSequence(template) {
  if (!template) {
    return [];
  }

  if (template.type === "custom") {
    return template.sequence.map((item) => normalizeSequenceItem({ ...item, id: makeId() }));
  }

  const settings = getInsertSettings();
  return template.chords.map(([rootSemitone, qualityId]) => normalizeSequenceItem({
    rootSemitone,
    qualityId,
    ...settings
  }));
}

function renderTemplateOptions(preferredId = null) {
  const previous = preferredId || elements.progressionTemplateSelect.value;
  const fragment = document.createDocumentFragment();
  const builtInGroup = document.createElement("optgroup");
  builtInGroup.label = "既存テンプレート";
  BASE_TEMPLATES.forEach((template) => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    builtInGroup.appendChild(option);
  });
  fragment.appendChild(builtInGroup);

  if (state.customTemplates.length > 0) {
    const customGroup = document.createElement("optgroup");
    customGroup.label = "保存したテンプレート";
    state.customTemplates.forEach((template) => {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = template.name;
      customGroup.appendChild(option);
    });
    fragment.appendChild(customGroup);
  }

  elements.progressionTemplateSelect.replaceChildren(fragment);
  const allIds = new Set(getAllTemplates().map((template) => template.id));
  elements.progressionTemplateSelect.value = allIds.has(previous) ? previous : BASE_TEMPLATES[0].id;
  updateTemplatePreview();
}

function updateTemplatePreview() {
  const template = getSelectedTemplate();
  if (!template) {
    elements.templateChordList.textContent = "";
    elements.templateDescription.textContent = "";
    elements.templateTypeBadge.textContent = "なし";
    updateButtonStates();
    return;
  }

  const sequence = templateToSequence(template);
  elements.templateChordList.textContent = sequence
    .map((item) => getChordLabel(getRootBySemitone(item.rootSemitone), getQualityById(item.qualityId)))
    .join(" → ");
  elements.templateDescription.textContent = template.description || "保存したコード進行です。";
  elements.templateTypeBadge.textContent = template.type === "custom" ? "保存済み" : "標準";
  updateButtonStates();
}

function saveCustomTemplate() {
  const name = elements.customTemplateName.value.trim();
  if (!name) {
    setTemplateMessage("テンプレート名を入力してください。");
    elements.customTemplateName.focus();
    return;
  }
  if (state.sequence.length === 0) {
    setTemplateMessage("保存するコード進行がありません。");
    return;
  }

  const existing = state.customTemplates.find((template) => template.name === name);
  const template = {
    id: existing?.id || `custom-${makeId()}`,
    name,
    description: "保存したコード進行です。",
    sequence: state.sequence.map((item) => normalizeSequenceItem({ ...item, id: makeId() }))
  };

  if (existing) {
    Object.assign(existing, template);
  } else {
    state.customTemplates.push(template);
  }

  saveState();
  renderTemplateOptions(template.id);
  setTemplateMessage(existing ? "同名テンプレートを更新しました。" : "テンプレートを保存しました。");
}

function deleteSelectedTemplate() {
  const template = getSelectedTemplate();
  if (!template || template.type !== "custom") {
    return;
  }
  state.customTemplates = state.customTemplates.filter((item) => item.id !== template.id);
  saveState();
  renderTemplateOptions();
  setTemplateMessage("保存テンプレートを削除しました。");
}

function setTemplateMessage(message) {
  elements.templateSaveMessage.textContent = message;
}

function setProjectMessage(message) {
  elements.projectIoMessage.textContent = message;
}

function createProjectPayload() {
  return {
    format: "chord-composer-project",
    version: 3,
    savedAt: new Date().toISOString(),
    settings: {
      bpm: getBpm(),
      length: Number(elements.lengthSelect.value),
      playStyle: normalizeStyle(elements.playStyleSelect.value),
      rootNote: elements.rootNoteToggle.checked,
      offbeat: elements.offbeatToggle.checked,
      metronome: elements.metronomeToggle.checked,
      selectedRootSemitone: state.selectedRoot.semitone,
      selectedQualityId: state.selectedQuality.id
    },
    sequence: state.sequence.map((item) => normalizeSequenceItem(item)),
    customTemplates: state.customTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description || "保存したコード進行です。",
      sequence: template.sequence.map((item) => normalizeSequenceItem(item))
    }))
  };
}

function applyProjectPayload(payload) {
  const settings = payload?.settings || payload || {};
  elements.bpmInput.value = String(clamp(Number(settings.bpm) || 120, 30, 300));
  elements.lengthSelect.value = [1, 2, 4, 8].includes(Number(settings.length)) ? String(settings.length) : "4";
  elements.playStyleSelect.value = normalizeStyle(settings.playStyle || settings.style);
  elements.offbeatToggle.checked = Boolean(settings.offbeat);
  elements.rootNoteToggle.checked = elements.offbeatToggle.checked || Boolean(settings.rootNote);
  elements.metronomeToggle.checked = Boolean(settings.metronome);
  state.selectedRoot = getRootBySemitone(settings.selectedRootSemitone);
  state.selectedQuality = getQualityById(settings.selectedQualityId);
  elements.qualitySelect.value = state.selectedQuality.id;

  state.sequence = Array.isArray(payload?.sequence)
    ? payload.sequence.map((item) => normalizeSequenceItem(item))
    : [];

  state.customTemplates = Array.isArray(payload?.customTemplates)
    ? payload.customTemplates
      .filter((template) => template && typeof template.name === "string" && Array.isArray(template.sequence))
      .map((template) => ({
        id: typeof template.id === "string" ? template.id : `custom-${makeId()}`,
        name: template.name.slice(0, 40),
        description: typeof template.description === "string" ? template.description : "保存したコード進行です。",
        sequence: template.sequence.map((item) => normalizeSequenceItem(item))
      }))
    : [];

  renderChordGrid();
  updateSelectedChordLabel();
  renderSequence();
  renderTemplateOptions();
  saveState();
}

function exportProject() {
  const blob = new Blob([JSON.stringify(createProjectPayload(), null, 2)], { type: "application/json" });
  downloadBlob(blob, `chord-composer-project-${getBpm()}bpm.json`);
  setProjectMessage("プロジェクトJSONを書き出しました。");
}

async function importProjectFile(file) {
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    if (!payload || (!Array.isArray(payload.sequence) && !Array.isArray(payload?.settings?.sequence))) {
      throw new Error("コード進行を含むプロジェクトJSONではありません。");
    }
    stopPlayback(false);
    applyProjectPayload(payload);
    setProjectMessage(`「${file.name}」を読み込みました。`);
  } catch (error) {
    showError(error);
    setProjectMessage("JSONの読み込みに失敗しました。");
  } finally {
    elements.projectFileInput.value = "";
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createProjectPayload()));
  } catch (error) {
    console.warn("状態の保存に失敗しました。", error);
  }
}

function loadState() {
  const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        continue;
      }
      applyProjectPayload(JSON.parse(raw));
      return;
    } catch (error) {
      console.warn(`保存データ ${key} の読み込みに失敗しました。`, error);
    }
  }
}

function encodeVariableLength(value) {
  let buffer = value & 0x7f;
  const bytes = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }
  return bytes;
}

function writeUint32(value) {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function writeUint16(value) {
  return [(value >>> 8) & 0xff, value & 0xff];
}

function createMidiBlob() {
  const ticksPerBeat = 480;
  const { events } = buildNoteEvents(state.sequence);
  const bpm = getBpm();
  const microsecondsPerQuarter = Math.round(60_000_000 / bpm);
  const timedEvents = [];

  timedEvents.push({ tick: 0, order: 0, data: [0xff, 0x51, 0x03, (microsecondsPerQuarter >>> 16) & 0xff, (microsecondsPerQuarter >>> 8) & 0xff, microsecondsPerQuarter & 0xff] });
  timedEvents.push({ tick: 0, order: 1, data: [0xc0, 0x00] });
  timedEvents.push({ tick: 0, order: 1, data: [0xc1, 0x00] });

  events.forEach((event) => {
    const channel = event.part === "bass" ? 1 : 0;
    const startTick = Math.max(0, Math.round(event.startBeat * ticksPerBeat));
    const endTick = Math.max(startTick + 1, Math.round((event.startBeat + event.durationBeats) * ticksPerBeat));
    timedEvents.push({ tick: startTick, order: 2, data: [0x90 | channel, event.note & 0x7f, event.velocity & 0x7f] });
    timedEvents.push({ tick: endTick, order: 1, data: [0x80 | channel, event.note & 0x7f, 0x00] });
  });

  timedEvents.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const track = [];
  let previousTick = 0;
  timedEvents.forEach((event) => {
    track.push(...encodeVariableLength(event.tick - previousTick), ...event.data);
    previousTick = event.tick;
  });
  track.push(0x00, 0xff, 0x2f, 0x00);

  const header = [
    0x4d, 0x54, 0x68, 0x64,
    0x00, 0x00, 0x00, 0x06,
    0x00, 0x00,
    0x00, 0x01,
    ...writeUint16(ticksPerBeat)
  ];
  const trackChunk = [0x4d, 0x54, 0x72, 0x6b, ...writeUint32(track.length), ...track];
  return new Blob([new Uint8Array([...header, ...trackChunk])], { type: "audio/midi" });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function writeAscii(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function audioBufferToWavBlob(audioBuffer) {
  const channelCount = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const sampleCount = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = sampleCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channels = Array.from({ length: channelCount }, (_, channel) => audioBuffer.getChannelData(channel));
  let offset = 44;
  for (let sample = 0; sample < sampleCount; sample += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const value = clamp(channels[channel][sample], -1, 1);
      view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: "audio/wav" });
}

async function exportWav() {
  if (state.sequence.length === 0) {
    return;
  }

  const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineAudioContextClass) {
    showError(new Error("このブラウザはWAV生成に対応していません。"));
    return;
  }

  elements.exportWavButton.disabled = true;
  elements.exportWavButton.textContent = "WAV生成中…";

  try {
    const sampleRate = 44_100;
    const secondsPerBeat = getSecondsPerBeat();
    const { events, totalBeats } = buildNoteEvents(state.sequence);
    const totalDuration = totalBeats * secondsPerBeat + 0.45;
    const context = new OfflineAudioContextClass(2, Math.ceil(totalDuration * sampleRate), sampleRate);
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, 0);
    compressor.knee.setValueAtTime(18, 0);
    compressor.ratio.setValueAtTime(3, 0);
    compressor.attack.setValueAtTime(0.006, 0);
    compressor.release.setValueAtTime(0.24, 0);
    const master = context.createGain();
    master.gain.setValueAtTime(0.84, 0);
    master.connect(compressor);
    compressor.connect(context.destination);

    events.forEach((event) => {
      const volume = (event.velocity / 127) * (event.part === "bass" ? 0.19 : 0.13);
      createPianoNote(
        context,
        master,
        event.note,
        event.startBeat * secondsPerBeat,
        event.durationBeats * secondsPerBeat,
        volume
      );
    });

    const rendered = await context.startRendering();
    downloadBlob(audioBufferToWavBlob(rendered), `chord-progression-${getBpm()}bpm.wav`);
    elements.audioStatus.textContent = "Audio: WAV書き出し完了";
  } catch (error) {
    showError(error);
  } finally {
    elements.exportWavButton.textContent = "WAV";
    updateButtonStates();
  }
}

function exportMidi() {
  if (state.sequence.length === 0) {
    return;
  }
  downloadBlob(createMidiBlob(), `chord-progression-${getBpm()}bpm.mid`);
  elements.audioStatus.textContent = "Audio: MIDI書き出し完了";
}

function showError(error) {
  console.error(error);
  const message = error instanceof Error ? error.message : String(error);
  elements.audioStatus.textContent = `エラー: ${message}`;
  window.alert(message);
}

function bindEvents() {
  elements.qualitySelect.addEventListener("change", () => {
    state.selectedQuality = getQualityById(elements.qualitySelect.value);
    renderChordGrid();
    updateSelectedChordLabel();
    saveState();
    previewSelectedChord();
  });

  elements.addChordButton.addEventListener("click", addSelectedChord);
  elements.playButton.addEventListener("click", () => playSequenceData(state.sequence, {
    highlightMain: true,
    statusText: "Audio: コード進行を再生中",
    finishText: "Audio: 再生完了"
  }));
  elements.stopButton.addEventListener("click", () => stopPlayback(true));
  elements.clearSequenceButton.addEventListener("click", () => {
    stopPlayback(false);
    state.sequence = [];
    renderSequence();
    saveState();
  });

  elements.exportMidiButton.addEventListener("click", exportMidi);
  elements.exportWavButton.addEventListener("click", exportWav);
  elements.projectExportButton.addEventListener("click", exportProject);
  elements.projectImportButton.addEventListener("click", () => elements.projectFileInput.click());
  elements.projectFileInput.addEventListener("change", () => {
    const [file] = elements.projectFileInput.files || [];
    if (file) {
      importProjectFile(file);
    }
  });

  elements.progressionTemplateSelect.addEventListener("change", updateTemplatePreview);
  elements.previewTemplateButton.addEventListener("click", () => {
    const template = getSelectedTemplate();
    playSequenceData(templateToSequence(template), {
      statusText: "Audio: テンプレート試聴中",
      finishText: "Audio: 試聴完了"
    });
  });
  elements.insertTemplateButton.addEventListener("click", () => {
    const template = getSelectedTemplate();
    state.sequence.push(...templateToSequence(template));
    renderSequence();
    saveState();
  });
  elements.saveTemplateButton.addEventListener("click", saveCustomTemplate);
  elements.deleteTemplateButton.addEventListener("click", deleteSelectedTemplate);

  elements.offbeatToggle.addEventListener("change", () => {
    if (elements.offbeatToggle.checked) {
      elements.rootNoteToggle.checked = true;
    }
    saveState();
    updateTemplatePreview();
  });
  elements.rootNoteToggle.addEventListener("change", () => {
    if (!elements.rootNoteToggle.checked) {
      elements.offbeatToggle.checked = false;
    }
    saveState();
    updateTemplatePreview();
  });

  [elements.bpmInput, elements.lengthSelect, elements.playStyleSelect, elements.metronomeToggle].forEach((element) => {
    element.addEventListener("change", () => {
      saveState();
      updateTemplatePreview();
    });
  });

  elements.bpmInput.addEventListener("blur", () => {
    getBpm();
    saveState();
  });

  window.addEventListener("beforeunload", () => stopPlayback(false));
}

function initialize() {
  populateQualitySelect();
  elements.qualitySelect.value = state.selectedQuality.id;
  loadState();
  elements.qualitySelect.value = state.selectedQuality.id;
  renderChordGrid();
  updateSelectedChordLabel();
  renderSequence();
  renderTemplateOptions();
  bindEvents();
  updateButtonStates();
}

initialize();
