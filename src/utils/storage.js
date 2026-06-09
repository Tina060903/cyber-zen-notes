// ============================================================
// Storage Utility - IndexedDB via localforage
// ============================================================
import localforage from 'localforage';

// Initialize localforage instances
const notesStore = localforage.createInstance({
  name: 'cyber-zen-notes',
  storeName: 'notes'
});

const metaStore = localforage.createInstance({
  name: 'cyber-zen-notes',
  storeName: 'meta'
});

/**
 * Save a note
 * @param {string} id
 * @param {{ title: string, content: string, updatedAt: string }} note
 */
export async function saveNote(id, note) {
  await notesStore.setItem(id, note);
  // Also update the index
  let index = await metaStore.getItem('noteIndex') || [];
  if (!index.includes(id)) {
    index.unshift(id);
    await metaStore.setItem('noteIndex', index);
  }
}

/**
 * Load a note by ID
 */
export async function loadNote(id) {
  return await notesStore.getItem(id);
}

/**
 * Delete a note
 */
export async function deleteNote(id) {
  await notesStore.removeItem(id);
  let index = await metaStore.getItem('noteIndex') || [];
  index = index.filter(i => i !== id);
  await metaStore.setItem('noteIndex', index);
}

/**
 * Get all note IDs in order
 */
export async function getNoteIndex() {
  return await metaStore.getItem('noteIndex') || [];
}

/**
 * Get summary list of all notes (id + title + updatedAt)
 */
export async function getAllNotesSummary() {
  const index = await getNoteIndex();
  const summaries = [];
  for (const id of index) {
    const note = await notesStore.getItem(id);
    if (note) {
      summaries.push({
        id,
        title: note.title || 'Untitled',
        updatedAt: note.updatedAt || new Date().toISOString()
      });
    }
  }
  return summaries;
}

/**
 * Save app settings
 */
export async function saveSettings(settings) {
  await metaStore.setItem('settings', settings);
}

/**
 * Load app settings
 */
export async function loadSettings() {
  return await metaStore.getItem('settings') || {};
}

/**
 * Generate a unique note ID
 */
export function generateNoteId() {
  return 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

// === File persistence (images, audio) via IndexedDB ===
const fileStore = localforage.createInstance({
  name: 'cyber-zen-notes',
  storeName: 'files'
});

export async function saveFile(key, file) {
  const buffer = await file.arrayBuffer();
  await fileStore.setItem(key, {
    data: buffer,
    type: file.type,
    name: file.name,
    size: file.size
  });
}

export async function loadFile(key) {
  const saved = await fileStore.getItem(key);
  if (!saved) return null;
  return new Blob([saved.data], { type: saved.type });
}

export async function getFileMeta(key) {
  const saved = await fileStore.getItem(key);
  if (!saved) return null;
  return { name: saved.name, type: saved.type, size: saved.size };
}

export async function deleteFile(key) {
  await fileStore.removeItem(key);
}

export async function getAudioTrackKeys() {
  const keys = await fileStore.keys();
  return keys.filter(k => k.startsWith('audio-'));
}
