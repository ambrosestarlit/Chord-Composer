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

const PLAY_STYLES = {
  block: "ベタ打ち",
  quarter: "四分弾き",
  arpeggio: "アルペジオ",
  singleBacking: "単音バッキング",
  counterMelody: "カウンターメロディ",
  fillIn: "フィルイン",
  ostinato: "オスティナート"
};

const BUILTIN_TEMPLATES = [
  { id: "royal", name: "王道進行", description: "J-POPで使いやすい IV–V–iii–vi。", chords: ["F", "G", "Em", "Am"] },
  { id: "canon", name: "カノン進行", description: "滑らかで歌を乗せやすい定番8コード。", chords: ["C", "G", "Am", "Em", "F", "C", "F", "G"] },
  { id: "komuro", name: "小室進行", description: "疾走感と切なさを出しやすい進行。", chords: ["Am", "F", "G", "C"] },
  { id: "pop-punk", name: "ポップパンク進行", description: "明快で勢いのある I–V–vi–IV。", chords: ["C", "G", "Am", "F"] },
  { id: "1645", name: "循環進行 1-6-4-5", description: "素直に循環する歌もの向け進行。", chords: ["C", "Am", "F", "G"] },
  { id: "1625", name: "循環進行 1-6-2-5", description: "ジャズやバラードにも合う循環。", chords: ["Cmaj7", "Am7", "Dm7", "G7"] },
  { id: "turnaround", name: "ジャズ・ターンアラウンド", description: "I–vi–ii–Vの定番ターンアラウンド。", chords: ["Cmaj7", "Am7", "Dm7", "G7"] },
  { id: "251", name: "ツー・ファイブ・ワン", description: "解決感の強いジャズ基本進行。", chords: ["Dm7", "G7", "Cmaj7"] },
  { id: "sad-minor", name: "切ないマイナー進行", description: "静かで切ない vi–IV–I–V。", chords: ["Am", "F", "C", "G"] },
  { id: "andalusian", name: "アンダルシア進行", description: "下降感が印象的なマイナー進行。", chords: ["Am", "G", "F", "E"] },
  { id: "dramatic", name: "ドラマチック進行", description: "緊張と解放を作りやすい進行。", chords: ["Am", "F", "Dm", "E"] },
  { id: "blues12", name: "12小節ブルース", description: "Cキーの12小節ブルース。", chords: ["C7", "C7", "C7", "C7", "F7", "F7", "C7", "C7", "G7", "F7", "C7", "G7"] }
];



const PATTERN_STEPS = 16;
const STEP_BEATS = 0.25;

const BASS_ROWS = [
  { id: "root", label: "ルート", interval: 0 },
  { id: "fifth", label: "5度", interval: 7 },
  { id: "octave", label: "オクターブ", interval: 12 }
];

const DRUM_ROWS = [
  { id: "kick", label: "キック", midi: 36 },
  { id: "snare", label: "スネア", midi: 38 },
  { id: "closedHat", label: "クローズHH", midi: 42 },
  { id: "openHat", label: "オープンHH", midi: 46 }
];

function makePattern(rowIds, activeByRow = {}) {
  return Object.fromEntries(rowIds.map((rowId) => [
    rowId,
    Array.from({ length: PATTERN_STEPS }, (_, index) => Boolean(activeByRow[rowId]?.includes(index)))
  ]));
}

const BASS_TEMPLATES = [
  {
    id: "bass-quarter-root",
    name: "ルート4分",
    description: "各拍の頭でコードのルートを鳴らす基本パターン。",
    pattern: makePattern(BASS_ROWS.map((row) => row.id), { root: [0, 4, 8, 12] })
  },
  {
    id: "bass-eighth-root",
    name: "ルート8分",
    description: "ルートを8分音符で刻む、安定したベースパターン。",
    pattern: makePattern(BASS_ROWS.map((row) => row.id), { root: [0, 2, 4, 6, 8, 10, 12, 14] })
  },
  {
    id: "bass-octave",
    name: "オクターブ8分",
    description: "ルートと1オクターブ上を交互に鳴らすパターン。",
    pattern: makePattern(BASS_ROWS.map((row) => row.id), {
      root: [0, 4, 8, 12],
      octave: [2, 6, 10, 14]
    })
  },
  {
    id: "bass-root-fifth",
    name: "ルート＋5度",
    description: "ルートと5度を交互に使う、動きのある8分パターン。",
    pattern: makePattern(BASS_ROWS.map((row) => row.id), {
      root: [0, 4, 8, 12],
      fifth: [2, 6, 10, 14]
    })
  }
];

const DRUM_TEMPLATES = [
  {
    id: "drum-8beat",
    name: "8ビート",
    description: "ハイハットを8分で刻み、2拍・4拍にスネアを置く基本8ビート。",
    pattern: makePattern(DRUM_ROWS.map((row) => row.id), {
      kick: [0, 8],
      snare: [4, 12],
      closedHat: [0, 2, 4, 6, 8, 10, 12, 14]
    })
  },
  {
    id: "drum-16beat",
    name: "16ビート",
    description: "ハイハットを16分で細かく刻む16ビート。キックとスネアは基本位置に配置。",
    pattern: makePattern(DRUM_ROWS.map((row) => row.id), {
      kick: [0, 7, 8, 10],
      snare: [4, 12],
      closedHat: Array.from({ length: PATTERN_STEPS }, (_, index) => index)
    })
  },
  {
    id: "drum-dance",
    name: "ダンスビート（4つ打ち）",
    description: "キックを4分音符で4つ打ちし、裏拍にオープンハイハットを置くダンス系パターン。",
    pattern: makePattern(DRUM_ROWS.map((row) => row.id), {
      kick: [0, 4, 8, 12],
      snare: [4, 12],
      closedHat: [0, 4, 8, 12],
      openHat: [2, 6, 10, 14]
    })
  }
];

const STORAGE_KEY = "chord-composer-state-v6";
const LEGACY_KEYS = ["chord-composer-state-v5", "chord-composer-state-v4", "chord-composer-state-v3", "chord-composer-state-v2", "chord-composer-state-v1"];

const state = {
  selectedRootSemitone: 0,
  selectedQualityId: "major",
  sequence: [],
  customTemplates: [],
  inputMode: "bass",
  bassEnabled: false,
  drumEnabled: false,
  bassPattern: makePattern(BASS_ROWS.map((row) => row.id)),
  drumPattern: makePattern(DRUM_ROWS.map((row) => row.id)),
  audioContext: null,
  activeNodes: new Set(),
  playbackTimers: [],
  isPlaying: false,
  activeSequenceIndex: -1
};

const elements = {
  audioStatus: document.querySelector("#audioStatus"),
  bpmInput: document.querySelector("#bpmInput"),
  lengthSelect: document.querySelector("#lengthSelect"),
  playStyleSelect: document.querySelector("#playStyleSelect"),
  rootNoteToggle: document.querySelector("#rootNoteToggle"),
  offbeatToggle: document.querySelector("#offbeatToggle"),
  metronomeToggle: document.querySelector("#metronomeToggle"),
  qualitySelect: document.querySelector("#qualitySelect"),
  chordGrid: document.querySelector("#chordGrid"),
  selectedChordLabel: document.querySelector("#selectedChordLabel"),
  addChordButton: document.querySelector("#addChordButton"),
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
  accompanimentTemplateSelect: document.querySelector("#accompanimentTemplateSelect"),
  previewAccompanimentTemplateButton: document.querySelector("#previewAccompanimentTemplateButton"),
  applyAccompanimentTemplateButton: document.querySelector("#applyAccompanimentTemplateButton"),
  accompanimentTemplateBadge: document.querySelector("#accompanimentTemplateBadge"),
  accompanimentTemplateName: document.querySelector("#accompanimentTemplateName"),
  accompanimentTemplateDescription: document.querySelector("#accompanimentTemplateDescription"),
  inputModeTabs: [...document.querySelectorAll("[data-input-mode]")],
  bassInputView: document.querySelector("#bassInputView"),
  drumInputView: document.querySelector("#drumInputView"),
  bassTrackToggle: document.querySelector("#bassTrackToggle"),
  drumTrackToggle: document.querySelector("#drumTrackToggle"),
  clearBassPatternButton: document.querySelector("#clearBassPatternButton"),
  clearDrumPatternButton: document.querySelector("#clearDrumPatternButton"),
  bassPatternGrid: document.querySelector("#bassPatternGrid"),
  drumPatternGrid: document.querySelector("#drumPatternGrid"),
  accompanimentStatus: document.querySelector("#accompanimentStatus"),
  playButton: document.querySelector("#playButton"),
  stopButton: document.querySelector("#stopButton"),
  clearSequenceButton: document.querySelector("#clearSequenceButton"),
  sequenceSummary: document.querySelector("#sequenceSummary"),
  emptySequence: document.querySelector("#emptySequence"),
  sequenceTrack: document.querySelector("#sequenceTrack"),
  sequenceItemTemplate: document.querySelector("#sequenceItemTemplate"),
  exportMidiButton: document.querySelector("#exportMidiButton"),
  exportWavButton: document.querySelector("#exportWavButton"),
  projectImportButton: document.querySelector("#projectImportButton"),
  projectExportButton: document.querySelector("#projectExportButton"),
  projectFileInput: document.querySelector("#projectFileInput"),
  projectIoMessage: document.querySelector("#projectIoMessage"),
  helpButton: document.querySelector("#helpButton"),
  helpDialog: document.querySelector("#helpDialog"),
  helpCloseButton: document.querySelector("#helpCloseButton"),
  helpFooterCloseButton: document.querySelector("#helpFooterCloseButton")
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function uniqueId(prefix = "item") {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getRootBySemitone(semitone) {
  const normalized = ((Number(semitone) % 12) + 12) % 12;
  return ROOTS.find((root) => root.semitone === normalized) || ROOTS[0];
}

function getQualityById(id) {
  return QUALITIES.find((quality) => quality.id === id) || QUALITIES[0];
}

function getSelectedRoot() {
  return getRootBySemitone(state.selectedRootSemitone);
}

function getSelectedQuality() {
  return getQualityById(state.selectedQualityId);
}

function getChordLabel(root = getSelectedRoot(), quality = getSelectedQuality()) {
  return `${root.label}${quality.suffix}`;
}

function parseChordLabel(label) {
  const source = String(label || "").trim();
  const rootMatch = source.match(/^([A-G](?:#)?)/);
  if (!rootMatch) {
    return { rootSemitone: 0, qualityId: "major" };
  }
  const root = ROOTS.find((candidate) => candidate.label === rootMatch[1]) || ROOTS[0];
  const suffix = source.slice(rootMatch[1].length);
  const quality = QUALITIES.find((candidate) => candidate.suffix === suffix) || QUALITIES[0];
  return { rootSemitone: root.semitone, qualityId: quality.id };
}

function normalizePlayStyle(value) {
  return Object.hasOwn(PLAY_STYLES, value) ? value : "block";
}

function normalizeSequenceItem(raw) {
  const rootSemitone = Number.isFinite(Number(raw?.rootSemitone))
    ? ((Number(raw.rootSemitone) % 12) + 12) % 12
    : parseChordLabel(raw?.label || raw?.chord).rootSemitone;
  const parsed = parseChordLabel(raw?.label || raw?.chord);
  const qualityId = QUALITIES.some((quality) => quality.id === raw?.qualityId)
    ? raw.qualityId
    : parsed.qualityId;
  const rootEnabled = Boolean(raw?.rootEnabled ?? raw?.rootNote ?? false);
  const offbeatEnabled = Boolean(raw?.offbeatEnabled ?? raw?.offbeat ?? false) && rootEnabled;
  return {
    id: typeof raw?.id === "string" && raw.id ? raw.id : uniqueId("chord"),
    rootSemitone,
    qualityId,
    beats: clamp(Math.round(Number(raw?.beats) || 4), 1, 32),
    playStyle: normalizePlayStyle(raw?.playStyle || raw?.style),
    rootEnabled,
    offbeatEnabled
  };
}

function cloneSequenceItems(items) {
  return items.map((item) => ({ ...normalizeSequenceItem(item), id: uniqueId("chord") }));
}

function normalizePattern(rawPattern, rows) {
  return Object.fromEntries(rows.map((row) => {
    const source = Array.isArray(rawPattern?.[row.id]) ? rawPattern[row.id] : [];
    return [row.id, Array.from({ length: PATTERN_STEPS }, (_, index) => Boolean(source[index]))];
  }));
}

function clonePattern(pattern, rows) {
  return normalizePattern(pattern, rows);
}

function hasPatternNotes(pattern, rows) {
  return rows.some((row) => pattern[row.id]?.some(Boolean));
}

function getBpm() {
  const bpm = clamp(Math.round(Number(elements.bpmInput.value) || 120), 30, 300);
  elements.bpmInput.value = String(bpm);
  return bpm;
}

function getSecondsPerBeat() {
  return 60 / getBpm();
}

function selectedInsertSettings() {
  const rootEnabled = elements.rootNoteToggle.checked || elements.offbeatToggle.checked;
  return {
    beats: clamp(Math.round(Number(elements.lengthSelect.value) || 4), 1, 32),
    playStyle: normalizePlayStyle(elements.playStyleSelect.value),
    rootEnabled,
    offbeatEnabled: elements.offbeatToggle.checked && rootEnabled
  };
}

function makeItem(rootSemitone, qualityId, settings = selectedInsertSettings()) {
  return normalizeSequenceItem({
    id: uniqueId("chord"),
    rootSemitone,
    qualityId,
    beats: settings.beats,
    playStyle: settings.playStyle,
    rootEnabled: settings.rootEnabled,
    offbeatEnabled: settings.offbeatEnabled
  });
}

function setMessage(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.style.color = isError ? "#8d2f2f" : "";
}

function saveState() {
  const data = {
    version: 6,
    settings: {
      bpm: getBpm(),
      length: Number(elements.lengthSelect.value) || 4,
      playStyle: normalizePlayStyle(elements.playStyleSelect.value),
      rootEnabled: elements.rootNoteToggle.checked,
      offbeatEnabled: elements.offbeatToggle.checked,
      metronome: elements.metronomeToggle.checked,
      selectedRootSemitone: state.selectedRootSemitone,
      selectedQualityId: state.selectedQualityId,
      inputMode: state.inputMode,
      bassEnabled: state.bassEnabled,
      drumEnabled: state.drumEnabled
    },
    sequence: state.sequence,
    customTemplates: state.customTemplates,
    bassPattern: state.bassPattern,
    drumPattern: state.drumPattern
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_error) {
    // 保存領域を利用できない環境では、現在のセッションだけで動作します。
  }
}

function readStoredData() {
  const keys = [STORAGE_KEY, ...LEGACY_KEYS];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (_error) {
      // 壊れた旧データは読み飛ばします。
    }
  }
  return null;
}

function applyLoadedData(data) {
  const settings = data?.settings || data || {};
  elements.bpmInput.value = String(clamp(Math.round(Number(settings.bpm) || 120), 30, 300));
  const lengthValue = String(clamp(Math.round(Number(settings.length ?? settings.beats) || 4), 1, 32));
  if (![...elements.lengthSelect.options].some((option) => option.value === lengthValue)) {
    const option = document.createElement("option");
    option.value = lengthValue;
    option.textContent = `${lengthValue}拍`;
    elements.lengthSelect.append(option);
  }
  elements.lengthSelect.value = lengthValue;
  elements.playStyleSelect.value = normalizePlayStyle(settings.playStyle);
  elements.rootNoteToggle.checked = Boolean(settings.rootEnabled ?? settings.rootNote);
  elements.offbeatToggle.checked = Boolean(settings.offbeatEnabled ?? settings.offbeat) && elements.rootNoteToggle.checked;
  elements.metronomeToggle.checked = Boolean(settings.metronome);
  state.selectedRootSemitone = Number.isFinite(Number(settings.selectedRootSemitone))
    ? ((Number(settings.selectedRootSemitone) % 12) + 12) % 12
    : 0;
  state.selectedQualityId = QUALITIES.some((quality) => quality.id === settings.selectedQualityId)
    ? settings.selectedQualityId
    : "major";
  state.inputMode = settings.inputMode === "drums" ? "drums" : "bass";
  state.bassEnabled = Boolean(settings.bassEnabled ?? data?.bassEnabled ?? false);
  state.drumEnabled = Boolean(settings.drumEnabled ?? data?.drumEnabled ?? false);
  state.bassPattern = normalizePattern(data?.bassPattern, BASS_ROWS);
  state.drumPattern = normalizePattern(data?.drumPattern, DRUM_ROWS);
  state.sequence = Array.isArray(data?.sequence) ? data.sequence.map(normalizeSequenceItem) : [];
  state.customTemplates = Array.isArray(data?.customTemplates)
    ? data.customTemplates.map((template) => ({
        id: typeof template.id === "string" && template.id ? template.id : uniqueId("template"),
        name: String(template.name || "保存テンプレート").slice(0, 40),
        items: Array.isArray(template.items || template.sequence)
          ? (template.items || template.sequence).map(normalizeSequenceItem)
          : []
      }))
    : [];
}

function loadState() {
  const stored = readStoredData();
  if (stored) applyLoadedData(stored);
}

function populateQualitySelect() {
  elements.qualitySelect.replaceChildren(...QUALITIES.map((quality) => {
    const option = document.createElement("option");
    option.value = quality.id;
    option.textContent = quality.name;
    return option;
  }));
  elements.qualitySelect.value = state.selectedQualityId;
}

function renderChordGrid() {
  const quality = getSelectedQuality();
  const fragment = document.createDocumentFragment();
  ROOTS.forEach((root) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chord-button";
    button.textContent = getChordLabel(root, quality);
    button.classList.toggle("is-selected", root.semitone === state.selectedRootSemitone);
    button.setAttribute("aria-pressed", String(root.semitone === state.selectedRootSemitone));
    button.addEventListener("click", async () => {
      state.selectedRootSemitone = root.semitone;
      renderChordGrid();
      updateSelectedChordLabel();
      saveState();
      await previewSingleChord(root.semitone, quality.id);
    });
    fragment.append(button);
  });
  elements.chordGrid.replaceChildren(fragment);
}

function updateSelectedChordLabel() {
  elements.selectedChordLabel.textContent = getChordLabel();
}

function generateVoicingCandidates(rootSemitone, qualityId) {
  const quality = getQualityById(qualityId);
  const baseIntervals = quality.intervals;
  const candidates = [];
  for (let inversion = 0; inversion < baseIntervals.length; inversion += 1) {
    const rotated = baseIntervals.slice(inversion).concat(baseIntervals.slice(0, inversion).map((value) => value + 12));
    for (let octave = 3; octave <= 6; octave += 1) {
      const rootMidi = 12 * (octave + 1) + rootSemitone;
      const notes = rotated.map((interval) => rootMidi + interval);
      if (notes[0] >= 48 && notes[notes.length - 1] <= 88) {
        candidates.push({ notes, inversion });
      }
    }
  }
  return candidates;
}

function voicingDistance(previous, candidate) {
  const length = Math.max(previous.length, candidate.length);
  let cost = 0;
  for (let index = 0; index < length; index += 1) {
    const from = previous[Math.min(index, previous.length - 1)];
    const to = candidate[Math.min(index, candidate.length - 1)];
    cost += Math.abs(from - to);
  }
  const center = candidate.reduce((sum, note) => sum + note, 0) / candidate.length;
  cost += Math.abs(center - 65) * 0.12;
  return cost;
}

function computeVoicings(items) {
  const result = [];
  let previous = null;
  items.forEach((item) => {
    const candidates = generateVoicingCandidates(item.rootSemitone, item.qualityId);
    let selected = candidates[0] || { notes: [60], inversion: 0 };
    if (!previous) {
      selected = candidates.reduce((best, candidate) => {
        const center = candidate.notes.reduce((sum, note) => sum + note, 0) / candidate.notes.length;
        const bestCenter = best.notes.reduce((sum, note) => sum + note, 0) / best.notes.length;
        return Math.abs(center - 64) < Math.abs(bestCenter - 64) ? candidate : best;
      }, selected);
    } else {
      selected = candidates.reduce((best, candidate) => (
        voicingDistance(previous, candidate.notes) < voicingDistance(previous, best.notes) ? candidate : best
      ), selected);
    }
    result.push(selected);
    previous = selected.notes;
  });
  return result;
}

function inversionLabel(inversion) {
  if (inversion === 0) return "右手：基本形";
  return `右手：第${inversion}転回形`;
}

function updateSequenceHighlight(activeIndex = -1) {
  state.activeSequenceIndex = activeIndex;
  elements.sequenceTrack.querySelectorAll(".sequence-item").forEach((node, index) => {
    node.classList.toggle("is-playing", index === activeIndex);
  });
}

function renderSequence() {
  const voicings = computeVoicings(state.sequence);
  const fragment = document.createDocumentFragment();
  state.sequence.forEach((item, index) => {
    const node = elements.sequenceItemTemplate.content.firstElementChild.cloneNode(true);
    const root = getRootBySemitone(item.rootSemitone);
    const quality = getQualityById(item.qualityId);
    node.dataset.id = item.id;
    node.classList.toggle("is-playing", index === state.activeSequenceIndex);
    node.querySelector(".sequence-index").textContent = String(index + 1).padStart(2, "0");
    node.querySelector(".sequence-chord").textContent = getChordLabel(root, quality);
    node.querySelector(".sequence-inversion").textContent = `${inversionLabel(voicings[index]?.inversion || 0)} / ${voicings[index]?.notes.map(midiToNoteName).join("・") || ""}`;

    const beatsInput = node.querySelector(".sequence-beats-input");
    beatsInput.value = String(item.beats);
    beatsInput.addEventListener("change", () => {
      stopPlayback();
      item.beats = clamp(Math.round(Number(beatsInput.value) || 1), 1, 32);
      renderSequence();
      saveState();
    });

    const styleSelect = node.querySelector(".sequence-style-select");
    styleSelect.value = item.playStyle;
    styleSelect.addEventListener("change", () => {
      stopPlayback();
      item.playStyle = normalizePlayStyle(styleSelect.value);
      saveState();
    });

    const rootToggle = node.querySelector(".sequence-root-toggle");
    const offbeatToggle = node.querySelector(".sequence-offbeat-toggle");
    rootToggle.checked = item.rootEnabled;
    offbeatToggle.checked = item.offbeatEnabled;

    rootToggle.addEventListener("change", () => {
      stopPlayback();
      item.rootEnabled = rootToggle.checked;
      if (!item.rootEnabled) {
        item.offbeatEnabled = false;
        offbeatToggle.checked = false;
      }
      saveState();
    });

    offbeatToggle.addEventListener("change", () => {
      stopPlayback();
      item.offbeatEnabled = offbeatToggle.checked;
      if (item.offbeatEnabled) {
        item.rootEnabled = true;
        rootToggle.checked = true;
      }
      saveState();
    });

    node.querySelectorAll("input, select, label, button").forEach((control) => {
      control.addEventListener("dblclick", (event) => event.stopPropagation());
      control.addEventListener("click", (event) => event.stopPropagation());
    });

    node.addEventListener("dblclick", () => {
      stopPlayback();
      state.sequence = state.sequence.filter((candidate) => candidate.id !== item.id);
      renderSequence();
      saveState();
    });
    node.addEventListener("keydown", (event) => {
      if ((event.key === "Delete" || event.key === "Backspace") && !event.target.closest("input,select")) {
        event.preventDefault();
        stopPlayback();
        state.sequence = state.sequence.filter((candidate) => candidate.id !== item.id);
        renderSequence();
        saveState();
      }
    });
    fragment.append(node);
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
}

function addSelectedChord() {
  state.sequence.push(makeItem(state.selectedRootSemitone, state.selectedQualityId));
  renderSequence();
  saveState();
  elements.sequenceTrack.scrollLeft = elements.sequenceTrack.scrollWidth;
}

function templateToItems(template) {
  if (!template) return [];
  if (template.type === "custom") return cloneSequenceItems(template.items);
  const settings = selectedInsertSettings();
  return template.chords.map((label) => {
    const parsed = parseChordLabel(label);
    return makeItem(parsed.rootSemitone, parsed.qualityId, settings);
  });
}

function getSelectedTemplate() {
  const value = elements.progressionTemplateSelect.value;
  if (value.startsWith("builtin:")) {
    const id = value.slice("builtin:".length);
    const template = BUILTIN_TEMPLATES.find((candidate) => candidate.id === id);
    return template ? { ...template, type: "builtin" } : null;
  }
  if (value.startsWith("custom:")) {
    const id = value.slice("custom:".length);
    const template = state.customTemplates.find((candidate) => candidate.id === id);
    return template ? { ...template, type: "custom" } : null;
  }
  return null;
}

function populateTemplateSelect(preferredValue = "") {
  const oldValue = preferredValue || elements.progressionTemplateSelect.value;
  const builtinGroup = document.createElement("optgroup");
  builtinGroup.label = "既存テンプレート";
  BUILTIN_TEMPLATES.forEach((template) => {
    const option = document.createElement("option");
    option.value = `builtin:${template.id}`;
    option.textContent = template.name;
    builtinGroup.append(option);
  });
  const nodes = [builtinGroup];
  if (state.customTemplates.length > 0) {
    const customGroup = document.createElement("optgroup");
    customGroup.label = "保存テンプレート";
    state.customTemplates.forEach((template) => {
      const option = document.createElement("option");
      option.value = `custom:${template.id}`;
      option.textContent = template.name;
      customGroup.append(option);
    });
    nodes.push(customGroup);
  }
  elements.progressionTemplateSelect.replaceChildren(...nodes);
  if ([...elements.progressionTemplateSelect.options].some((option) => option.value === oldValue)) {
    elements.progressionTemplateSelect.value = oldValue;
  }
  renderTemplatePreview();
}

function renderTemplatePreview() {
  const template = getSelectedTemplate();
  if (!template) {
    elements.templateChordList.textContent = "";
    elements.templateDescription.textContent = "";
    elements.templateTypeBadge.textContent = "標準";
    elements.deleteTemplateButton.disabled = true;
    return;
  }
  const labels = template.type === "custom"
    ? template.items.map((item) => getChordLabel(getRootBySemitone(item.rootSemitone), getQualityById(item.qualityId)))
    : template.chords;
  elements.templateChordList.textContent = labels.join(" → ");
  elements.templateDescription.textContent = template.type === "custom"
    ? "保存時の拍数・演奏方法・ルート音・裏拍を保持しています。"
    : template.description;
  elements.templateTypeBadge.textContent = template.type === "custom" ? "保存" : "標準";
  elements.deleteTemplateButton.disabled = template.type !== "custom";
}

function saveCurrentAsTemplate() {
  if (state.sequence.length === 0) return;
  const name = elements.customTemplateName.value.trim();
  if (!name) {
    setMessage(elements.templateSaveMessage, "テンプレート名を入力してください。", true);
    return;
  }
  const existing = state.customTemplates.find((template) => template.name === name);
  if (existing) {
    existing.items = state.sequence.map((item) => ({ ...item, id: uniqueId("template-chord") }));
    populateTemplateSelect(`custom:${existing.id}`);
    setMessage(elements.templateSaveMessage, "同名テンプレートを更新しました。");
  } else {
    const template = {
      id: uniqueId("template"),
      name: name.slice(0, 40),
      items: state.sequence.map((item) => ({ ...item, id: uniqueId("template-chord") }))
    };
    state.customTemplates.push(template);
    populateTemplateSelect(`custom:${template.id}`);
    setMessage(elements.templateSaveMessage, "テンプレートを保存しました。");
  }
  elements.customTemplateName.value = "";
  saveState();
}

function deleteSelectedTemplate() {
  const template = getSelectedTemplate();
  if (!template || template.type !== "custom") return;
  state.customTemplates = state.customTemplates.filter((candidate) => candidate.id !== template.id);
  populateTemplateSelect();
  setMessage(elements.templateSaveMessage, "保存テンプレートを削除しました。");
  saveState();
}

function getAccompanimentTemplates(mode = state.inputMode) {
  return mode === "drums" ? DRUM_TEMPLATES : BASS_TEMPLATES;
}

function getSelectedAccompanimentTemplate() {
  return getAccompanimentTemplates().find((template) => template.id === elements.accompanimentTemplateSelect.value)
    || getAccompanimentTemplates()[0]
    || null;
}

function populateAccompanimentTemplateSelect(preferredId = "") {
  const templates = getAccompanimentTemplates();
  const previous = preferredId || elements.accompanimentTemplateSelect.value;
  elements.accompanimentTemplateSelect.replaceChildren(...templates.map((template) => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    return option;
  }));
  if (templates.some((template) => template.id === previous)) {
    elements.accompanimentTemplateSelect.value = previous;
  }
  renderAccompanimentTemplatePreview();
}

function renderAccompanimentTemplatePreview() {
  const template = getSelectedAccompanimentTemplate();
  if (!template) {
    elements.accompanimentTemplateName.textContent = "";
    elements.accompanimentTemplateDescription.textContent = "";
    return;
  }
  elements.accompanimentTemplateBadge.textContent = state.inputMode === "drums" ? "ドラム" : "ベース";
  elements.accompanimentTemplateName.textContent = template.name;
  elements.accompanimentTemplateDescription.textContent = template.description;
}

function updateAccompanimentStatus() {
  elements.accompanimentStatus.textContent = `ベース：${state.bassEnabled ? "ON" : "OFF"} / ドラム：${state.drumEnabled ? "ON" : "OFF"}`;
}

function setInputMode(mode, shouldSave = true) {
  state.inputMode = mode === "drums" ? "drums" : "bass";
  elements.inputModeTabs.forEach((tab) => {
    const active = tab.dataset.inputMode === state.inputMode;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  elements.bassInputView.hidden = state.inputMode !== "bass";
  elements.drumInputView.hidden = state.inputMode !== "drums";
  populateAccompanimentTemplateSelect();
  if (shouldSave) saveState();
}

function renderPatternGrid(container, rows, pattern, mode) {
  const grid = document.createElement("div");
  grid.className = "pattern-grid";

  const corner = document.createElement("div");
  corner.className = "pattern-corner";
  corner.textContent = "1小節";
  grid.append(corner);

  const labels = ["1", "e", "&", "a", "2", "e", "&", "a", "3", "e", "&", "a", "4", "e", "&", "a"];
  labels.forEach((label, index) => {
    const stepLabel = document.createElement("div");
    stepLabel.className = "pattern-step-label";
    if (index % 4 === 0) stepLabel.classList.add("is-beat-start");
    stepLabel.textContent = label;
    grid.append(stepLabel);
  });

  rows.forEach((row) => {
    const rowLabel = document.createElement("div");
    rowLabel.className = "pattern-row-label";
    rowLabel.textContent = row.label;
    grid.append(rowLabel);

    for (let step = 0; step < PATTERN_STEPS; step += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pattern-step-button";
      if (step % 4 === 0) button.classList.add("is-beat-start");
      const active = Boolean(pattern[row.id]?.[step]);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", `${row.label} ${step + 1}ステップ`);
      button.addEventListener("click", () => {
        pattern[row.id][step] = !pattern[row.id][step];
        if (mode === "bass" && pattern[row.id][step]) state.bassEnabled = true;
        if (mode === "drums" && pattern[row.id][step]) state.drumEnabled = true;
        renderAccompanimentEditors();
        saveState();
      });
      grid.append(button);
    }
  });

  container.replaceChildren(grid);
}

function renderAccompanimentEditors() {
  elements.bassTrackToggle.checked = state.bassEnabled;
  elements.drumTrackToggle.checked = state.drumEnabled;
  renderPatternGrid(elements.bassPatternGrid, BASS_ROWS, state.bassPattern, "bass");
  renderPatternGrid(elements.drumPatternGrid, DRUM_ROWS, state.drumPattern, "drums");
  updateAccompanimentStatus();
}

function applyAccompanimentTemplate() {
  const template = getSelectedAccompanimentTemplate();
  if (!template) return;
  if (state.inputMode === "drums") {
    state.drumPattern = clonePattern(template.pattern, DRUM_ROWS);
    state.drumEnabled = true;
  } else {
    state.bassPattern = clonePattern(template.pattern, BASS_ROWS);
    state.bassEnabled = true;
  }
  renderAccompanimentEditors();
  saveState();
}

function clearAccompanimentPattern(mode) {
  stopPlayback();
  if (mode === "drums") {
    state.drumPattern = makePattern(DRUM_ROWS.map((row) => row.id));
    state.drumEnabled = false;
  } else {
    state.bassPattern = makePattern(BASS_ROWS.map((row) => row.id));
    state.bassEnabled = false;
  }
  renderAccompanimentEditors();
  saveState();
}

function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function midiToNoteName(midi) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${names[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

async function ensureAudioContext() {
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("このブラウザはWeb Audio APIに対応していません。");
    state.audioContext = new AudioContextClass();
  }
  if (state.audioContext.state === "suspended") await state.audioContext.resume();
  elements.audioStatus.textContent = "Audio: ピアノ音源準備完了";
  return state.audioContext;
}

function trackNode(node, context) {
  if (context !== state.audioContext) return;
  state.activeNodes.add(node);
  node.addEventListener("ended", () => state.activeNodes.delete(node), { once: true });
}

function createHammerNoise(context, destination, startTime, volume) {
  const sampleRate = context.sampleRate || 44_100;
  const noiseDuration = 0.018;
  const frameCount = Math.max(1, Math.ceil(sampleRate * noiseDuration));
  const buffer = context.createBuffer(1, frameCount, sampleRate);
  const samples = buffer.getChannelData(0);

  for (let index = 0; index < frameCount; index += 1) {
    const progress = index / frameCount;
    samples[index] = (Math.random() * 2 - 1) * Math.pow(1 - progress, 3.5);
  }

  const source = context.createBufferSource();
  const highpass = context.createBiquadFilter();
  const lowpass = context.createBiquadFilter();
  const gain = context.createGain();

  source.buffer = buffer;
  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(900, startTime);
  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(5_200, startTime);

  gain.gain.setValueAtTime(Math.max(0.0001, volume), startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + noiseDuration);

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(destination);
  source.start(startTime);
  source.stop(startTime + noiseDuration + 0.005);
  trackNode(source, context);
}

function schedulePianoNote(context, destination, midi, startTime, duration, velocity = 0.8, role = "right") {
  const safeDuration = Math.max(0.055, duration);
  const endTime = startTime + safeDuration;
  const release = Math.min(0.22, Math.max(0.06, safeDuration * 0.24));
  const releaseStart = Math.max(startTime + 0.045, endTime - release);
  const lowRegister = role === "bass" || midi < 48;
  const baseFrequency = midiToFrequency(midi);

  const toneFilter = context.createBiquadFilter();
  const toneOutput = context.createGain();
  toneFilter.type = "lowpass";
  toneFilter.frequency.setValueAtTime(lowRegister ? 3_800 : 5_400, startTime);
  toneFilter.Q.setValueAtTime(0.32, startTime);
  toneOutput.gain.setValueAtTime(0.92, startTime);
  toneFilter.connect(toneOutput);
  toneOutput.connect(destination);

  const partials = lowRegister
    ? [
        { ratio: 1.0000, level: 1.00, sustain: 0.30 },
        { ratio: 2.0025, level: 0.68, sustain: 0.16 },
        { ratio: 3.0060, level: 0.34, sustain: 0.08 },
        { ratio: 4.0110, level: 0.17, sustain: 0.04 }
      ]
    : [
        { ratio: 1.0000, level: 1.00, sustain: 0.25 },
        { ratio: 2.0025, level: 0.40, sustain: 0.12 },
        { ratio: 3.0060, level: 0.17, sustain: 0.055 },
        { ratio: 4.0110, level: 0.075, sustain: 0.025 }
      ];

  const roleVolume = role === "bass" ? 0.18 : 0.115;
  const volume = roleVolume * velocity;
  const normalizedVolume = Math.max(
    0.0004,
    volume / Math.sqrt(partials.reduce((sum, partial) => sum + partial.level * partial.level, 0))
  );

  partials.forEach((partial, index) => {
    const oscillator = context.createOscillator();
    const partialGain = context.createGain();
    const attack = index === 0 ? 0.0045 : 0.0028;
    const peak = Math.max(0.0002, normalizedVolume * partial.level);
    const sustain = Math.max(0.00012, peak * partial.sustain);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(baseFrequency * partial.ratio, startTime);
    oscillator.detune.setValueAtTime(index === 0 ? 0 : (index % 2 === 0 ? 1.2 : -1.2), startTime);

    partialGain.gain.setValueAtTime(0.0001, startTime);
    partialGain.gain.exponentialRampToValueAtTime(peak, startTime + attack);
    partialGain.gain.exponentialRampToValueAtTime(
      Math.max(sustain * 1.55, 0.00012),
      Math.min(releaseStart, startTime + Math.min(0.16, safeDuration * 0.34))
    );
    partialGain.gain.setValueAtTime(sustain, releaseStart);
    partialGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(partialGain);
    partialGain.connect(toneFilter);
    oscillator.start(startTime);
    oscillator.stop(endTime + 0.035);
    trackNode(oscillator, context);
  });

  createHammerNoise(
    context,
    destination,
    startTime,
    normalizedVolume * (lowRegister ? 0.055 : 0.09)
  );
}

function scheduleMetronomeClick(context, destination, startTime, accent = false) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(accent ? 1500 : 1050, startTime);
  gain.gain.setValueAtTime(accent ? 0.08 : 0.045, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.045);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.055);
  trackNode(oscillator, context);
}

function createShortNoiseBuffer(context, durationSeconds) {
  const sampleRate = context.sampleRate || 44_100;
  const frameCount = Math.max(1, Math.ceil(sampleRate * durationSeconds));
  const buffer = context.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }
  return buffer;
}

function scheduleKick(context, destination, startTime, velocity = 0.9) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(145, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(48, startTime + 0.11);
  gain.gain.setValueAtTime(Math.max(0.0001, 0.5 * velocity), startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.24);
  trackNode(oscillator, context);
}

function scheduleSnare(context, destination, startTime, velocity = 0.82) {
  const noise = context.createBufferSource();
  const highpass = context.createBiquadFilter();
  const noiseGain = context.createGain();
  noise.buffer = createShortNoiseBuffer(context, 0.18);
  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(900, startTime);
  noiseGain.gain.setValueAtTime(Math.max(0.0001, 0.24 * velocity), startTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.17);
  noise.connect(highpass);
  highpass.connect(noiseGain);
  noiseGain.connect(destination);
  noise.start(startTime);
  noise.stop(startTime + 0.19);
  trackNode(noise, context);

  const tone = context.createOscillator();
  const toneGain = context.createGain();
  tone.type = "triangle";
  tone.frequency.setValueAtTime(185, startTime);
  toneGain.gain.setValueAtTime(Math.max(0.0001, 0.09 * velocity), startTime);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.1);
  tone.connect(toneGain);
  toneGain.connect(destination);
  tone.start(startTime);
  tone.stop(startTime + 0.11);
  trackNode(tone, context);
}

function scheduleHiHat(context, destination, startTime, velocity = 0.65, open = false) {
  const duration = open ? 0.22 : 0.07;
  const source = context.createBufferSource();
  const highpass = context.createBiquadFilter();
  const bandpass = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = createShortNoiseBuffer(context, duration);
  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(5_500, startTime);
  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(open ? 9_200 : 10_500, startTime);
  bandpass.Q.setValueAtTime(0.7, startTime);
  gain.gain.setValueAtTime(Math.max(0.0001, (open ? 0.11 : 0.085) * velocity), startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  source.connect(highpass);
  highpass.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(destination);
  source.start(startTime);
  source.stop(startTime + duration + 0.01);
  trackNode(source, context);
}

function scheduleDrumHit(context, destination, event, startTime) {
  if (event.drumType === "kick") scheduleKick(context, destination, startTime, event.velocity);
  else if (event.drumType === "snare") scheduleSnare(context, destination, startTime, event.velocity);
  else if (event.drumType === "openHat") scheduleHiHat(context, destination, startTime, event.velocity, true);
  else scheduleHiHat(context, destination, startTime, event.velocity, false);
}

function oneCycleEvents(notes, pattern, startBeat, availableBeats, nominalStep = 0.5, velocity = 0.72) {
  if (availableBeats <= 0 || pattern.length === 0) return [];
  const step = Math.min(nominalStep, availableBeats / pattern.length);
  const duration = Math.max(0.12, step * 0.82);
  return pattern.map((noteIndex, index) => ({
    midi: notes[((noteIndex % notes.length) + notes.length) % notes.length],
    startBeat: startBeat + index * step,
    durationBeat: duration,
    velocity,
    role: "right"
  }));
}

function buildNoteEvents(items) {
  const voicings = computeVoicings(items);
  const events = [];
  let cursor = 0;
  items.forEach((item, index) => {
    const notes = voicings[index]?.notes || [60, 64, 67];
    const beats = item.beats;
    const rightVelocity = 0.78;
    if (item.playStyle === "quarter") {
      for (let beat = 0; beat < beats; beat += 1) {
        notes.forEach((midi) => events.push({ midi, startBeat: cursor + beat, durationBeat: Math.min(0.86, beats - beat), velocity: rightVelocity, role: "right" }));
      }
    } else if (item.playStyle === "arpeggio") {
      for (let step = 0; step < Math.ceil(beats * 2); step += 1) {
        const start = step * 0.5;
        if (start >= beats) break;
        events.push({ midi: notes[step % notes.length], startBeat: cursor + start, durationBeat: Math.min(0.44, beats - start), velocity: 0.76, role: "right" });
      }
    } else if (item.playStyle === "singleBacking") {
      events.push(...oneCycleEvents(notes, [0, 1, 2, 1], cursor, Math.min(beats, 2), 0.5, 0.76));
    } else if (item.playStyle === "counterMelody") {
      events.push(...oneCycleEvents(notes, [2, 1, 0, 1, 2, 0], cursor, Math.min(beats, 3), 0.5, 0.7));
    } else if (item.playStyle === "fillIn") {
      const pattern = [0, 1, 2, notes.length - 1, 2, 1];
      const cycleLength = Math.min(beats, pattern.length * 0.5);
      events.push(...oneCycleEvents(notes, pattern, cursor + Math.max(0, beats - cycleLength), cycleLength, 0.5, 0.76));
    } else if (item.playStyle === "ostinato") {
      events.push(...oneCycleEvents(notes, [0, 1, 2, 1, 0, 1, 2, 1], cursor, Math.min(beats, 4), 0.5, 0.72));
    } else {
      notes.forEach((midi) => events.push({ midi, startBeat: cursor, durationBeat: Math.max(0.2, beats - 0.05), velocity: rightVelocity, role: "right" }));
    }

    if (item.rootEnabled) {
      let rootMidi = 36 + item.rootSemitone;
      if (rootMidi > 47) rootMidi -= 12;
      const rootDuration = item.offbeatEnabled ? Math.max(0.2, beats - 0.56) : Math.max(0.2, beats - 0.04);
      events.push({ midi: rootMidi, startBeat: cursor, durationBeat: rootDuration, velocity: 0.92, role: "bass" });
      if (item.offbeatEnabled) {
        events.push({ midi: rootMidi, startBeat: cursor + Math.max(0, beats - 0.5), durationBeat: 0.46, velocity: 0.96, role: "bass" });
      }
    }
    cursor += beats;
  });
  return { events, totalBeats: cursor };
}

function chordAtBeat(items, beat) {
  let cursor = 0;
  for (const item of items) {
    const end = cursor + item.beats;
    if (beat >= cursor && beat < end) return item;
    cursor = end;
  }
  return items[items.length - 1] || null;
}

function buildBassEvents(items, totalBeats, pattern = state.bassPattern) {
  if (!items.length || totalBeats <= 0) return [];
  const events = [];
  const totalSteps = Math.ceil(totalBeats / STEP_BEATS);
  for (let absoluteStep = 0; absoluteStep < totalSteps; absoluteStep += 1) {
    const startBeat = absoluteStep * STEP_BEATS;
    if (startBeat >= totalBeats) break;
    const patternStep = absoluteStep % PATTERN_STEPS;
    const chord = chordAtBeat(items, startBeat);
    if (!chord) continue;
    BASS_ROWS.forEach((row) => {
      if (!pattern[row.id]?.[patternStep]) return;
      let midi = 36 + chord.rootSemitone + row.interval;
      while (midi > 59) midi -= 12;
      while (midi < 28) midi += 12;
      events.push({
        midi,
        startBeat,
        durationBeat: Math.min(0.22, Math.max(0.08, totalBeats - startBeat)),
        velocity: row.id === "root" ? 0.84 : 0.76,
        role: "bass"
      });
    });
  }
  return events;
}

function buildDrumEvents(totalBeats, pattern = state.drumPattern) {
  if (totalBeats <= 0) return [];
  const events = [];
  const totalSteps = Math.ceil(totalBeats / STEP_BEATS);
  for (let absoluteStep = 0; absoluteStep < totalSteps; absoluteStep += 1) {
    const startBeat = absoluteStep * STEP_BEATS;
    if (startBeat >= totalBeats) break;
    const patternStep = absoluteStep % PATTERN_STEPS;
    DRUM_ROWS.forEach((row) => {
      if (!pattern[row.id]?.[patternStep]) return;
      const velocity = row.id === "kick" ? 0.95 : row.id === "snare" ? 0.86 : 0.7;
      events.push({
        midi: row.midi,
        startBeat,
        durationBeat: row.id === "openHat" ? 0.2 : 0.08,
        velocity,
        role: "drum",
        drumType: row.id
      });
    });
  }
  return events;
}

function buildArrangementEvents(items, includeAccompaniment = true) {
  const built = buildNoteEvents(items);
  const events = [...built.events];
  if (includeAccompaniment && state.bassEnabled && hasPatternNotes(state.bassPattern, BASS_ROWS)) {
    events.push(...buildBassEvents(items, built.totalBeats));
  }
  if (includeAccompaniment && state.drumEnabled && hasPatternNotes(state.drumPattern, DRUM_ROWS)) {
    events.push(...buildDrumEvents(built.totalBeats));
  }
  return { events, totalBeats: built.totalBeats };
}

function scheduleEvents(context, destination, noteEvents, startTime, secondsPerBeat) {
  noteEvents.forEach((event) => {
    const eventStart = startTime + event.startBeat * secondsPerBeat;
    if (event.role === "drum") {
      scheduleDrumHit(context, destination, event, eventStart);
      return;
    }
    schedulePianoNote(
      context,
      destination,
      event.midi,
      eventStart,
      Math.max(0.06, event.durationBeat * secondsPerBeat),
      event.velocity,
      event.role
    );
  });
}

function clearPlaybackTimers() {
  state.playbackTimers.forEach((timer) => window.clearTimeout(timer));
  state.playbackTimers = [];
}

function stopPlayback() {
  clearPlaybackTimers();
  state.activeNodes.forEach((node) => {
    try { node.stop(); } catch (_error) { /* 停止済み */ }
  });
  state.activeNodes.clear();
  state.isPlaying = false;
  updateSequenceHighlight(-1);
  updateButtonStates();
  elements.audioStatus.textContent = "Audio: 停止";
}

async function playItems(items, highlightMainSequence = false) {
  if (!items.length) return;
  try {
    stopPlayback();
    const context = await ensureAudioContext();
    const secondsPerBeat = getSecondsPerBeat();
    const startTime = context.currentTime + 0.08;
    const built = buildArrangementEvents(items, highlightMainSequence);
    state.isPlaying = true;
    updateButtonStates();
    scheduleEvents(context, context.destination, built.events, startTime, secondsPerBeat);

    if (elements.metronomeToggle.checked) {
      for (let beat = 0; beat < built.totalBeats; beat += 1) {
        scheduleMetronomeClick(context, context.destination, startTime + beat * secondsPerBeat, beat % 4 === 0);
      }
    }

    if (highlightMainSequence) {
      let cursor = 0;
      items.forEach((item, index) => {
        const timer = window.setTimeout(() => updateSequenceHighlight(index), Math.max(0, (startTime - context.currentTime + cursor * secondsPerBeat) * 1000));
        state.playbackTimers.push(timer);
        cursor += item.beats;
      });
    }

    const endTimer = window.setTimeout(() => {
      state.isPlaying = false;
      updateSequenceHighlight(-1);
      updateButtonStates();
      elements.audioStatus.textContent = "Audio: 再生完了";
    }, Math.max(0, (startTime - context.currentTime + built.totalBeats * secondsPerBeat + 0.15) * 1000));
    state.playbackTimers.push(endTimer);
  } catch (error) {
    stopPlayback();
    setMessage(elements.projectIoMessage, error.message || String(error), true);
  }
}

async function previewSingleChord(rootSemitone, qualityId) {
  const settings = selectedInsertSettings();
  const previewBeats = Math.min(settings.beats, 4);
  await playItems([makeItem(rootSemitone, qualityId, { ...settings, beats: previewBeats })], false);
}

async function previewAccompanimentTemplate() {
  const template = getSelectedAccompanimentTemplate();
  if (!template) return;
  try {
    stopPlayback();
    const context = await ensureAudioContext();
    const secondsPerBeat = getSecondsPerBeat();
    const startTime = context.currentTime + 0.08;
    let events = [];
    if (state.inputMode === "drums") {
      events = buildDrumEvents(4, template.pattern);
    } else {
      const previewItem = makeItem(state.selectedRootSemitone, state.selectedQualityId, {
        beats: 4,
        playStyle: "block",
        rootEnabled: false,
        offbeatEnabled: false
      });
      events = buildBassEvents([previewItem], 4, template.pattern);
    }
    state.isPlaying = true;
    updateButtonStates();
    scheduleEvents(context, context.destination, events, startTime, secondsPerBeat);
    const timer = window.setTimeout(() => {
      state.isPlaying = false;
      updateButtonStates();
      elements.audioStatus.textContent = "Audio: 試聴完了";
    }, Math.max(0, (startTime - context.currentTime + 4 * secondsPerBeat + 0.2) * 1000));
    state.playbackTimers.push(timer);
    elements.audioStatus.textContent = state.inputMode === "drums" ? "Audio: ドラム試聴中" : "Audio: ベース試聴中";
  } catch (error) {
    stopPlayback();
    setMessage(elements.projectIoMessage, error.message || String(error), true);
  }
}

function encodeVariableLength(value) {
  let buffer = value & 0x7f;
  const bytes = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= ((value & 0x7f) | 0x80);
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

function uint32(value) {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function uint16(value) {
  return [(value >>> 8) & 0xff, value & 0xff];
}

function createMidiBlob(items = state.sequence) {
  const ppq = 480;
  const { events } = buildArrangementEvents(items, true);
  const midiEvents = [];
  const tempo = Math.round(60_000_000 / getBpm());
  midiEvents.push({ tick: 0, order: 0, bytes: [0xff, 0x51, 0x03, (tempo >>> 16) & 0xff, (tempo >>> 8) & 0xff, tempo & 0xff] });
  midiEvents.push({ tick: 0, order: 1, bytes: [0xc0, 0] });
  midiEvents.push({ tick: 0, order: 1, bytes: [0xc1, 0] });
  events.forEach((event) => {
    const channel = event.role === "drum" ? 9 : event.role === "bass" ? 1 : 0;
    const startTick = Math.round(event.startBeat * ppq);
    const endTick = Math.max(startTick + 1, Math.round((event.startBeat + event.durationBeat) * ppq));
    const velocity = clamp(Math.round(event.velocity * 105), 1, 127);
    midiEvents.push({ tick: startTick, order: 2, bytes: [0x90 | channel, clamp(Math.round(event.midi), 0, 127), velocity] });
    midiEvents.push({ tick: endTick, order: 1, bytes: [0x80 | channel, clamp(Math.round(event.midi), 0, 127), 0] });
  });
  midiEvents.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const track = [];
  let lastTick = 0;
  midiEvents.forEach((event) => {
    track.push(...encodeVariableLength(event.tick - lastTick), ...event.bytes);
    lastTick = event.tick;
  });
  track.push(0x00, 0xff, 0x2f, 0x00);
  const bytes = [
    0x4d, 0x54, 0x68, 0x64, ...uint32(6), ...uint16(0), ...uint16(1), ...uint16(ppq),
    0x4d, 0x54, 0x72, 0x6b, ...uint32(track.length), ...track
  ];
  return new Blob([new Uint8Array(bytes)], { type: "audio/midi" });
}

function audioBufferToWavBlob(buffer) {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const frames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = frames * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);
  const writeString = (offset, value) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);
  const channelData = Array.from({ length: channels }, (_, index) => buffer.getChannelData(index));
  let offset = 44;
  for (let frame = 0; frame < frames; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = clamp(channelData[channel][frame], -1, 1);
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportWav() {
  if (!state.sequence.length) return;
  const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineAudioContextClass) {
    setMessage(elements.projectIoMessage, "このブラウザはWAV生成に対応していません。", true);
    return;
  }
  const oldText = elements.exportWavButton.textContent;
  elements.exportWavButton.disabled = true;
  elements.exportWavButton.textContent = "WAV生成中…";
  try {
    const secondsPerBeat = getSecondsPerBeat();
    const built = buildArrangementEvents(state.sequence, true);
    const sampleRate = 44100;
    const duration = built.totalBeats * secondsPerBeat + 0.7;
    const context = new OfflineAudioContextClass(2, Math.ceil(duration * sampleRate), sampleRate);
    const master = context.createGain();
    master.gain.setValueAtTime(0.82, 0);
    master.connect(context.destination);
    scheduleEvents(context, master, built.events, 0.04, secondsPerBeat);
    const rendered = await context.startRendering();
    downloadBlob(audioBufferToWavBlob(rendered), `chord-composer-${getBpm()}bpm.wav`);
    setMessage(elements.projectIoMessage, "WAVを書き出しました。");
  } catch (error) {
    setMessage(elements.projectIoMessage, error.message || String(error), true);
  } finally {
    elements.exportWavButton.textContent = oldText;
    updateButtonStates();
  }
}

function buildProjectData() {
  return {
    format: "ChordComposerProject",
    version: 6,
    savedAt: new Date().toISOString(),
    settings: {
      bpm: getBpm(),
      length: Number(elements.lengthSelect.value) || 4,
      playStyle: normalizePlayStyle(elements.playStyleSelect.value),
      rootEnabled: elements.rootNoteToggle.checked,
      offbeatEnabled: elements.offbeatToggle.checked,
      metronome: elements.metronomeToggle.checked,
      selectedRootSemitone: state.selectedRootSemitone,
      selectedQualityId: state.selectedQualityId,
      inputMode: state.inputMode,
      bassEnabled: state.bassEnabled,
      drumEnabled: state.drumEnabled
    },
    sequence: state.sequence,
    customTemplates: state.customTemplates,
    bassPattern: state.bassPattern,
    drumPattern: state.drumPattern
  };
}

function exportProjectJson() {
  const json = JSON.stringify(buildProjectData(), null, 2);
  downloadBlob(new Blob([json], { type: "application/json" }), `chord-composer-project-${new Date().toISOString().slice(0, 10)}.json`);
  setMessage(elements.projectIoMessage, "プロジェクトJSONを書き出しました。");
}

async function importProjectJson(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || typeof data !== "object" || (!Array.isArray(data.sequence) && data.format !== "ChordComposerProject")) {
      throw new Error("Chord ComposerのプロジェクトJSONではありません。");
    }
    stopPlayback();
    applyLoadedData(data);
    populateQualitySelect();
    renderChordGrid();
    updateSelectedChordLabel();
    populateTemplateSelect();
    renderSequence();
    renderAccompanimentEditors();
    setInputMode(state.inputMode, false);
    saveState();
    setMessage(elements.projectIoMessage, "プロジェクトを読み込みました。");
  } catch (error) {
    setMessage(elements.projectIoMessage, error.message || "JSONを読み込めませんでした。", true);
  } finally {
    elements.projectFileInput.value = "";
  }
}

function openHelp() {
  if (typeof elements.helpDialog.showModal === "function") elements.helpDialog.showModal();
  else elements.helpDialog.setAttribute("open", "");
}

function closeHelp() {
  if (typeof elements.helpDialog.close === "function") elements.helpDialog.close();
  else elements.helpDialog.removeAttribute("open");
}

function bindEvents() {
  elements.qualitySelect.addEventListener("change", () => {
    state.selectedQualityId = elements.qualitySelect.value;
    renderChordGrid();
    updateSelectedChordLabel();
    saveState();
  });
  elements.addChordButton.addEventListener("click", addSelectedChord);
  elements.playButton.addEventListener("click", () => playItems(state.sequence, true));
  elements.stopButton.addEventListener("click", stopPlayback);
  elements.clearSequenceButton.addEventListener("click", () => {
    stopPlayback();
    state.sequence = [];
    renderSequence();
    saveState();
  });

  elements.rootNoteToggle.addEventListener("change", () => {
    if (!elements.rootNoteToggle.checked) elements.offbeatToggle.checked = false;
    saveState();
  });
  elements.offbeatToggle.addEventListener("change", () => {
    if (elements.offbeatToggle.checked) elements.rootNoteToggle.checked = true;
    saveState();
  });
  [elements.bpmInput, elements.lengthSelect, elements.playStyleSelect, elements.metronomeToggle].forEach((element) => {
    element.addEventListener("change", saveState);
  });
  elements.bpmInput.addEventListener("blur", () => { getBpm(); saveState(); });

  elements.progressionTemplateSelect.addEventListener("change", renderTemplatePreview);
  elements.previewTemplateButton.addEventListener("click", () => playItems(templateToItems(getSelectedTemplate()), false));
  elements.insertTemplateButton.addEventListener("click", () => {
    const items = templateToItems(getSelectedTemplate());
    state.sequence.push(...items);
    renderSequence();
    saveState();
    elements.sequenceTrack.scrollLeft = elements.sequenceTrack.scrollWidth;
  });
  elements.saveTemplateButton.addEventListener("click", saveCurrentAsTemplate);
  elements.deleteTemplateButton.addEventListener("click", deleteSelectedTemplate);

  elements.inputModeTabs.forEach((tab) => {
    tab.addEventListener("click", () => setInputMode(tab.dataset.inputMode));
  });
  elements.accompanimentTemplateSelect.addEventListener("change", renderAccompanimentTemplatePreview);
  elements.previewAccompanimentTemplateButton.addEventListener("click", previewAccompanimentTemplate);
  elements.applyAccompanimentTemplateButton.addEventListener("click", applyAccompanimentTemplate);
  elements.bassTrackToggle.addEventListener("change", () => {
    state.bassEnabled = elements.bassTrackToggle.checked;
    updateAccompanimentStatus();
    saveState();
  });
  elements.drumTrackToggle.addEventListener("change", () => {
    state.drumEnabled = elements.drumTrackToggle.checked;
    updateAccompanimentStatus();
    saveState();
  });
  elements.clearBassPatternButton.addEventListener("click", () => clearAccompanimentPattern("bass"));
  elements.clearDrumPatternButton.addEventListener("click", () => clearAccompanimentPattern("drums"));

  elements.exportMidiButton.addEventListener("click", () => {
    if (!state.sequence.length) return;
    downloadBlob(createMidiBlob(), `chord-composer-${getBpm()}bpm.mid`);
    setMessage(elements.projectIoMessage, "MIDIを書き出しました。");
  });
  elements.exportWavButton.addEventListener("click", exportWav);
  elements.projectExportButton.addEventListener("click", exportProjectJson);
  elements.projectImportButton.addEventListener("click", () => elements.projectFileInput.click());
  elements.projectFileInput.addEventListener("change", () => {
    const file = elements.projectFileInput.files?.[0];
    if (file) importProjectJson(file);
  });

  elements.helpButton.addEventListener("click", openHelp);
  elements.helpCloseButton.addEventListener("click", closeHelp);
  elements.helpFooterCloseButton.addEventListener("click", closeHelp);
  elements.helpDialog.addEventListener("click", (event) => {
    if (event.target === elements.helpDialog) closeHelp();
  });
  window.addEventListener("beforeunload", stopPlayback);
}

function initialize() {
  loadState();
  populateQualitySelect();
  renderChordGrid();
  updateSelectedChordLabel();
  populateTemplateSelect();
  renderSequence();
  renderAccompanimentEditors();
  setInputMode(state.inputMode, false);
  bindEvents();
  updateButtonStates();
}

initialize();
