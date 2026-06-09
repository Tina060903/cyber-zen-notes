// ============================================================
// File Manager - Note Management & History
// ============================================================
import { saveNote, loadNote, deleteNote, getAllNotesSummary, generateNoteId } from '../utils/storage.js';

export class FileManager {
  constructor(editor) {
    this.editor = editor;
    this.currentNoteId = null;
    this.notes = [];
    this.isOpen = false;

    this.elements = {
      manager: document.getElementById('file-manager'),
      inner: document.getElementById('file-manager-inner'),
      trigger: document.getElementById('file-manager-trigger'),
      triggerZone: document.getElementById('fm-trigger-zone'),
      noteList: document.getElementById('note-list'),
      newBtn: document.getElementById('fm-new-btn'),
    };

    this.init();
  }

  init() {
    this.initNewNote();

    // Load notes from storage
    this.refreshNotesList();

    // Auto-save when editor content changes
    this.editor.onContentChange(async (html, text) => {
      if (this.currentNoteId) {
        await this.autoSave();
      }
    });
  }

  initNewNote() {
    this.elements.newBtn.addEventListener('click', () => {
      this.createNewNote();
    });
  }

  /**
   * Create a new empty note
   */
  async createNewNote() {
    // Save current note first
    if (this.currentNoteId) {
      await this.autoSave();
    }

    const id = generateNoteId();
    const now = new Date().toISOString();
    const note = {
      title: 'Untitled',
      content: '<p>Start writing in the cyber zen...</p>',
      createdAt: now,
      updatedAt: now
    };

    await saveNote(id, note);
    this.currentNoteId = id;

    // Clear editor and set content
    this.editor.setContent(note.content);

    await this.refreshNotesList();
    this.highlightCurrentNote();
    showToast('New note created');
  }

  /**
   * Switch to an existing note
   */
  async switchToNote(id) {
    if (id === this.currentNoteId) return;

    // Save current note
    if (this.currentNoteId) {
      await this.autoSave();
    }

    const note = await loadNote(id);
    if (note) {
      this.currentNoteId = id;
      this.editor.setContent(note.content);
      await this.refreshNotesList();
      this.highlightCurrentNote();
    }
  }

  /**
   * Delete a note
   */
  async removeNote(id, event) {
    if (event) {
      event.stopPropagation();
    }

    if (this.notes.length <= 1) {
      showToast('Cannot delete the last note');
      return;
    }

    await deleteNote(id);

    if (id === this.currentNoteId) {
      this.currentNoteId = null;
      // Switch to first available note
      const notes = await getAllNotesSummary();
      if (notes.length > 0) {
        await this.switchToNote(notes[0].id);
      } else {
        await this.createNewNote();
      }
    } else {
      await this.refreshNotesList();
    }
    showToast('Note deleted');
  }

  /**
   * Save current note
   */
  async autoSave() {
    if (!this.currentNoteId) return;

    const content = this.editor.getContent();
    const text = this.editor.getText().trim();
    const title = text.split('\n')[0].substring(0, 50) || 'Untitled';

    const existing = await loadNote(this.currentNoteId);
    const note = {
      title: title,
      content: content,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveNote(this.currentNoteId, note);
  }

  /**
   * Refresh the notes list UI
   */
  async refreshNotesList() {
    this.notes = await getAllNotesSummary();
    this.renderNoteList();
  }

  /**
   * Render the note list
   */
  renderNoteList() {
    this.elements.noteList.innerHTML = '';

    if (this.notes.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;';
      empty.textContent = 'No notes yet. Create one!';
      this.elements.noteList.appendChild(empty);
      return;
    }

    for (const note of this.notes) {
      const item = document.createElement('div');
      item.className = 'note-item';
      if (note.id === this.currentNoteId) {
        item.classList.add('active');
      }
      item.dataset.id = note.id;

      const title = document.createElement('span');
      title.className = 'note-item-title';
      title.textContent = note.title;

      const date = document.createElement('span');
      date.className = 'note-item-date';
      const d = new Date(note.updatedAt);
      date.textContent = `${d.getMonth() + 1}/${d.getDate()}`;

      const delBtn = document.createElement('button');
      delBtn.className = 'note-item-delete';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', (e) => this.removeNote(note.id, e));

      item.appendChild(title);
      item.appendChild(date);
      item.appendChild(delBtn);

      item.addEventListener('click', () => this.switchToNote(note.id));
      this.elements.noteList.appendChild(item);
    }
  }

  /**
   * Highlight the current note in the list
   */
  highlightCurrentNote() {
    const items = this.elements.noteList.querySelectorAll('.note-item');
    for (const item of items) {
      item.classList.toggle('active', item.dataset.id === this.currentNoteId);
    }
  }

  /**
   * Get current note ID
   */
  getCurrentNoteId() {
    return this.currentNoteId;
  }
}
