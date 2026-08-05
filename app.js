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

const STORAGE_KEY = "chord-composer-state-v5";
const LEGACY_KEYS = ["chord-composer-state-v4", "chord-composer-state-v3", "chord-composer-state-v2", "chord-composer-state-v1"];

const state = {
  selectedRootSemitone: 0,
  selectedQualityId: "major",
  sequence: [],
  customTemplates: [],
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
    version: 5,
    settings: {
      bpm: getBpm(),
      length: Number(elements.lengthSelect.value) || 4,
      playStyle: normalizePlayStyle(elements.playStyleSelect.value),
      rootEnabled: elements.rootNoteToggle.checked,
      offbeatEnabled: elements.offbeatToggle.checked,
      metronome: elements.metronomeToggle.checked,
      selectedRootSemitone: state.selectedRootSemitone,
      selectedQualityId: state.selectedQualityId
    },
    sequence: state.sequence,
    customTemplates: state.customTemplates
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_error) {
    // プライベートモードなどで保存できない場合も、編集処理は継続します。
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

function schedulePianoNote(context, destination, midi, startTime, duration, velocity = 0.8, role = "right") {
  const baseFrequency = midiToFrequency(midi);
  const noteGain = context.createGain();
  const filter = context.createBiquadFilter();
  const endTime = startTime + Math.max(0.06, duration);
  const attack = role === "bass" ? 0.012 : 0.007;
  const decayPoint = startTime + Math.min(0.18, duration * 0.32);
  const releaseStart = Math.max(decayPoint, endTime - Math.min(0.24, duration * 0.38));

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(role === "bass" ? 2300 : 4200, startTime);
  filter.frequency.exponentialRampToValueAtTime(role === "bass" ? 850 : 1500, endTime);
  filter.Q.setValueAtTime(0.55, startTime);

  const baseVolume = (role === "bass" ? 0.22 : 0.15) * velocity;
  noteGain.gain.setValueAtTime(0.0001, startTime);
  noteGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, baseVolume), startTime + attack);
  noteGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, baseVolume * 0.48), decayPoint);
  noteGain.gain.setValueAtTime(Math.max(0.0002, baseVolume * 0.3), releaseStart);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  filter.connect(noteGain);
  noteGain.connect(destination);

  const harmonics = role === "bass"
    ? [[1, 1], [2, 0.48], [3, 0.25], [4, 0.1]]
    : [[1, 1], [2, 0.36], [3, 0.18], [4, 0.08]];

  harmonics.forEach(([multiple, amount], index) => {
    const oscillator = context.createOscillator();
    const harmonicGain = context.createGain();
    oscillator.type = index === 0 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(baseFrequency * multiple, startTime);
    oscillator.detune.setValueAtTime(index % 2 === 0 ? 1.2 : -1.2, startTime);
    harmonicGain.gain.setValueAtTime(amount, startTime);
    harmonicGain.gain.exponentialRampToValueAtTime(0.0001, endTime);
    oscillator.connect(harmonicGain);
    harmonicGain.connect(filter);
    oscillator.start(startTime);
    oscillator.stop(endTime + 0.03);
    trackNode(oscillator, context);
  });
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

function scheduleEvents(context, destination, noteEvents, startTime, secondsPerBeat) {
  noteEvents.forEach((event) => {
    schedulePianoNote(
      context,
      destination,
      event.midi,
      startTime + event.startBeat * secondsPerBeat,
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
    const built = buildNoteEvents(items);
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
  const { events } = buildNoteEvents(items);
  const midiEvents = [];
  const tempo = Math.round(60_000_000 / getBpm());
  midiEvents.push({ tick: 0, order: 0, bytes: [0xff, 0x51, 0x03, (tempo >>> 16) & 0xff, (tempo >>> 8) & 0xff, tempo & 0xff] });
  midiEvents.push({ tick: 0, order: 1, bytes: [0xc0, 0] });
  midiEvents.push({ tick: 0, order: 1, bytes: [0xc1, 0] });
  events.forEach((event) => {
    const channel = event.role === "bass" ? 1 : 0;
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
    const built = buildNoteEvents(state.sequence);
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
    version: 5,
    savedAt: new Date().toISOString(),
    settings: {
      bpm: getBpm(),
      length: Number(elements.lengthSelect.value) || 4,
      playStyle: normalizePlayStyle(elements.playStyleSelect.value),
      rootEnabled: elements.rootNoteToggle.checked,
      offbeatEnabled: elements.offbeatToggle.checked,
      metronome: elements.metronomeToggle.checked,
      selectedRootSemitone: state.selectedRootSemitone,
      selectedQualityId: state.selectedQualityId
    },
    sequence: state.sequence,
    customTemplates: state.customTemplates
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
  bindEvents();
  updateButtonStates();
}

initialize();
