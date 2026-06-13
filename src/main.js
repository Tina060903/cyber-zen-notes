// ============================================================
// Cyber Zen Notes - Main Entry Point
// ============================================================
import { Background } from './components/Background.js';
import { Editor } from './components/Editor.js';
import { VibeMixer } from './components/VibeMixer.js';
import { ZenTimer } from './components/ZenTimer.js';
import { FileManager } from './components/FileManager.js';
import { exportTxt, exportDocx } from './utils/export.js';
import { loadNote, getAllNotesSummary, generateNoteId, saveNote } from './utils/storage.js';
import * as mammoth from 'mammoth';
import { initI18n, setLanguage, getLanguage, t } from './utils/i18n.js';

// --- Initialize i18n ---
initI18n();

// --- Language Toggle ---
document.getElementById('lang-toggle')?.addEventListener('click', () => {
  const current = getLanguage();
  const next = current === 'zh' ? 'en' : 'zh';
  setLanguage(next);
  showToast(t('toast.saved'));
});

// --- Initialize Components ---
const background = new Background(document.getElementById('bg-canvas'));
const editor = new Editor();
const vibeMixer = new VibeMixer(background, editor);
const zenTimer = new ZenTimer();
const fileManager = new FileManager(editor);

// --- Mode Switcher ---
const modeBtns = document.querySelectorAll('.mode-btn');
const modeStatus = document.getElementById('current-mode-status');

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const mode = btn.dataset.mode;
    background.setMode(mode);
    
    // Update status text
    if (modeStatus) {
      modeStatus.textContent = `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`;
    }
    
    showToast(`${mode} mode`);
  });
});

// --- Ghost UI: Everything hidden by default, shows on hover ---
function setupGhost() {
  // Mode switcher: hover top
  let modeTimer = null;
  const modeSwitcher = document.getElementById('mode-switcher');
  const topTrigger = document.getElementById('top-trigger');

  topTrigger.addEventListener('mouseenter', () => {
    clearTimeout(modeTimer);
    modeSwitcher.classList.add('visible');
  });
  modeSwitcher.addEventListener('mouseenter', () => {
    clearTimeout(modeTimer);
    modeSwitcher.classList.add('visible');
  });
  modeSwitcher.addEventListener('mouseleave', () => {
    modeTimer = setTimeout(() => modeSwitcher.classList.remove('visible'), 600);
  });
  topTrigger.addEventListener('mouseleave', (e) => {
    if (!modeSwitcher.contains(e.relatedTarget)) {
      modeTimer = setTimeout(() => modeSwitcher.classList.remove('visible'), 600);
    }
  });

  // Editor toolbar: hover over editor area
  const editorContainer = document.getElementById('editor-container');
  const toolbar = document.getElementById('editor-toolbar');
  let editorTimer = null;
  editorContainer.addEventListener('mouseenter', () => {
    clearTimeout(editorTimer);
    toolbar?.classList.add('visible');
  });
  editorContainer.addEventListener('mouseleave', () => {
    editorTimer = setTimeout(() => toolbar?.classList.remove('visible'), 500);
  });

  // Lang toggle: top-right proximity
  const langToggle = document.getElementById('lang-toggle');
  const notesTrigger = document.getElementById('notes-trigger');
  
  document.addEventListener('mousemove', (e) => {
    if (e.clientY < 100 && e.clientX > window.innerWidth - 200) {
      langToggle?.classList.add('visible');
      notesTrigger?.classList.add('visible');
    } else if (!langToggle?.matches(':hover') && !notesTrigger?.matches(':hover')) {
      langToggle?.classList.remove('visible');
      notesTrigger?.classList.remove('visible');
    }
  });

  langToggle?.addEventListener('mouseenter', () => langToggle.classList.add('visible'));
  langToggle?.addEventListener('mouseleave', () => langToggle.classList.remove('visible'));
  notesTrigger?.addEventListener('mouseenter', () => notesTrigger.classList.add('visible'));
  notesTrigger?.addEventListener('mouseleave', () => notesTrigger.classList.remove('visible'));

  // Notes trigger: toggle File Manager
  notesTrigger?.addEventListener('click', () => {
    const fmPanel = document.getElementById('file-manager');
    fmPanel?.classList.toggle('visible');
  });

  // Mixer trigger: toggle Vibe Mixer
  const mixerTrigger = document.getElementById('mixer-trigger');
  mixerTrigger?.addEventListener('click', () => {
    const vibeMixerPanel = document.getElementById('vibe-mixer');
    vibeMixerPanel?.classList.toggle('visible');
  });

  // Zen Timer: proximity-based show
  const zenTimer = document.getElementById('zen-timer');
  document.addEventListener('mousemove', (e) => {
    const dist = Math.hypot(e.clientX - window.innerWidth/2, e.clientY - (window.innerHeight - 60));
    if (dist < 150) {
      zenTimer?.classList.add('visible');
    } else if (!zenTimer?.matches(':hover')) {
      zenTimer?.classList.remove('visible');
    }
  });

  // Top-left icon: toggle mode switcher + editor toolbar
  const topLeftIcon = document.getElementById('top-left-icon');
  topLeftIcon?.addEventListener('click', () => {
    // Toggle mode switcher
    const isModeVisible = modeSwitcher.classList.contains('visible');
    if (isModeVisible) {
      modeSwitcher.classList.remove('visible');
    } else {
      modeSwitcher.classList.add('visible');
      // Auto-hide after 3s
      clearTimeout(modeTimer);
      modeTimer = setTimeout(() => modeSwitcher.classList.remove('visible'), 3000);
    }

    // Toggle editor toolbar
    const toolbar = document.getElementById('editor-toolbar');
    if (toolbar) {
      const isToolbarVisible = toolbar.classList.contains('visible');
      if (isToolbarVisible) {
        toolbar.classList.remove('visible');
      } else {
        toolbar.classList.add('visible');
        setTimeout(() => toolbar.classList.remove('visible'), 3000);
      }
    }
  });
}

// Initialize ghost system
setupGhost();

// Editor toolbar visibility on hover is handled by setupGhost() above.
// No automatic ghost-hidden for the editor body - it would block font selection
// and character deletion (pointer-events: none).
// The editor only ghost-hides via the 5s idle in Editor.setGhost(), which is
// only cosmetic (opacity) and doesn't block interaction.

// --- Export ---
const exportBtn = document.getElementById('export-btn');
const exportDropdown = document.getElementById('export-dropdown');

exportBtn?.addEventListener('click', () => {
  exportDropdown?.classList.toggle('show');
});

document.addEventListener('click', (e) => {
  if (exportBtn && !exportBtn.contains(e.target) && exportDropdown && !exportDropdown.contains(e.target)) {
    exportDropdown.classList.remove('show');
  }
});

document.querySelectorAll('.export-option').forEach(opt => {
  opt.addEventListener('click', async () => {
    exportDropdown?.classList.remove('show');
    const format = opt.dataset.format;
    const content = editor.getContent();
    const text = editor.getText().trim();
    const title = text.split('\n')[0].substring(0, 50) || 'cyber-zen-note';

    try {
      let filename;
      if (format === 'txt') {
        filename = exportTxt(content, title);
      } else if (format === 'docx') {
        filename = await exportDocx(content, title);
      }
      showToast(`✅ Exported: ${filename}`);
    } catch (err) {
      console.error('Export failed:', err);
      showToast('❌ Export failed');
    }
  });
});

// --- Save to Local Button (TXT / DOCX dropdown) ---
const saveBtn = document.getElementById('save-local-btn');
if (saveBtn) {
  let menuEl = null;
  function closeSaveMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } }
  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menuEl) { closeSaveMenu(); return; }
    menuEl = document.createElement('div');
    menuEl.style.cssText = 'position:fixed;z-index:300;background:rgba(0,0,0,0.85);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:4px;min-width:90px;';
    const r = saveBtn.getBoundingClientRect();
    menuEl.style.left = r.left + 'px';
    menuEl.style.top = (r.bottom + 4) + 'px';
    const content = editor.getContent();
    const text = editor.getText().trim();
    const title = text.split('\n')[0].substring(0, 50) || 'cyber-zen-note';
    const mk = (label, fn) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'display:block;width:100%;text-align:left;background:transparent;border:none;color:rgba(255,255,255,0.5);font-size:10px;padding:6px 12px;border-radius:4px;cursor:pointer;letter-spacing:1px;transition:all 0.2s;';
      b.onmouseenter = () => { b.style.background = 'rgba(255,255,255,0.06)'; b.style.color = '#fff'; };
      b.onmouseleave = () => { b.style.background = 'transparent'; b.style.color = 'rgba(255,255,255,0.5)'; };
      b.addEventListener('click', async () => { await fn(); closeSaveMenu(); });
      menuEl.appendChild(b);
    };
    mk('.txt', () => { const fn = exportTxt(content, title); showToast(`✅ ${fn}`); });
    mk('.docx', async () => { const fn = await exportDocx(content, title); showToast(`✅ ${fn}`); });
    document.body.appendChild(menuEl);
  });
  document.addEventListener('click', (e) => {
    if (menuEl && e.target !== saveBtn) closeSaveMenu();
  });
}

// --- File Upload (TXT / DOCX / TEX) ---
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
if (uploadBtn && fileInput) {
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const name = file.name;
    const ext = name.split('.').pop().toLowerCase();
    try {
      let content = '';
      if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        content = result.value;
        if (result.messages.length > 0) {
          console.warn('mammoth warnings:', result.messages);
        }
      } else if (ext === 'txt' || ext === 'tex') {
        content = await file.text();
        content = content.replace(/\n/g, '<br>');
      } else {
        showToast('❌ Unsupported file type');
        return;
      }
      // Wrap in paragraph if not HTML
      if (!content.startsWith('<')) {
        content = `<p>${content}</p>`;
      }
      editor.setContent(content);
      fileManager.autoSave();
      showToast(`✅ Loaded: ${name}`);
    } catch (err) {
      console.error('File load failed:', err);
      showToast('❌ Failed to load file');
    }
    fileInput.value = '';
  });
}

// --- Keyboard Shortcuts ---
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + S - Save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    fileManager.autoSave().then(() => showToast('💾 Saved'));
  }

  // Ctrl/Cmd + N - New Note
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    fileManager.createNewNote();
  }

  // Escape - Close sidebars
  if (e.key === 'Escape') {
    document.getElementById('vibe-mixer').classList.remove('open');
    document.getElementById('file-manager').classList.remove('open');
  }
});

// --- Initialize with a default note ---
async function initializeApp() {
  try {
    // Load existing notes
    const notes = await getAllNotesSummary();

    if (notes.length > 0) {
      // Load the first note
      const firstNote = await loadNote(notes[0].id);
      if (firstNote) {
        fileManager.currentNoteId = notes[0].id;
        editor.setContent(firstNote.content);

        // Restore font setting
        const settings = JSON.parse(localStorage.getItem('cyber-zen-settings') || '{}');
        if (settings.font) {
          editor.setFont(settings.font);
        }
      }
    } else {
      // Create a bilingual welcome note
      const id = generateNoteId();
      const now = new Date().toISOString();
      const welcomeContent = `
        <h1>Welcome to Cyber Zen 🌸</h1>
        <p><em>Your immersive mindflow note-taking space / 你的沉浸式心流笔记空间</em></p>
        <p> </p>
        <p>✦ Use the <strong>Vibe Mixer</strong> (left) to adjust rain, blur, and sound<br>
        ✦ 使用左侧<strong>氛围控制</strong>面板调节雨量、模糊和音效</p>
        <p>✦ Browse notes from the <strong>Notes</strong> panel (right)<br>
        ✦ 从右侧<strong>笔记</strong>面板浏览你的笔记</p>
        <p>✦ Hover at the <strong>top</strong> to switch backgrounds<br>
        ✦ 悬停<strong>顶部</strong>切换背景模式</p>
        <p>✦ Upload your own images or music to personalize<br>
        ✦ 上传自定义图片或音乐来个性化空间</p>
        <p> </p>
        <p style="text-align: center;">🌿 <em>Begin your flow / 开始你的心流...</em></p>
      `.trim();

      await saveNote(id, {
        title: 'Welcome to Cyber Zen',
        content: welcomeContent,
        createdAt: now,
        updatedAt: now
      });

      fileManager.currentNoteId = id;
      editor.setContent(welcomeContent);
    }

    // Refresh notes list
    await fileManager.refreshNotesList();
    fileManager.highlightCurrentNote();

    // Load settings
    const savedSettings = JSON.parse(localStorage.getItem('cyber-zen-settings') || '{}');
    if (savedSettings.mode) {
      const btn = document.querySelector(`.mode-btn[data-mode="${savedSettings.mode}"]`);
      if (btn) btn.click();
    }
    if (savedSettings.rainAmount !== undefined) {
      document.getElementById('rain-slider').value = savedSettings.rainAmount;
      document.getElementById('rain-slider').dispatchEvent(new Event('input'));
    }
    if (savedSettings.snowAmount !== undefined) {
      document.getElementById('snow-slider').value = savedSettings.snowAmount;
      document.getElementById('snow-slider').dispatchEvent(new Event('input'));
    }

    // Restore saved background image and audio tracks
    await vibeMixer.restoreSavedBg();
    await vibeMixer.restoreSavedTracks();

    // Hide loading screen
    setTimeout(() => {
      const loading = document.getElementById('loading-screen');
      loading.classList.add('hidden');
      setTimeout(() => loading.remove(), 800);
    }, 500);

    // Start timer with welcome
    showToast('🌿 Cyber Zen Notes ready');
  } catch (err) {
    console.error('Init error:', err);
    const loading = document.getElementById('loading-screen');
    loading.innerHTML = `
      <p style="color: var(--text-muted);">Error loading notes. Refreshing...</p>
    `;
    setTimeout(() => location.reload(), 2000);
  }
}

// Start the app
initializeApp();

// --- Save settings on change ---
function saveSettings() {
  const settings = {
    mode: document.querySelector('.mode-btn.active')?.dataset.mode || 'rain',
    rainAmount: parseFloat(document.getElementById('rain-slider').value),
    snowAmount: parseFloat(document.getElementById('snow-slider').value),
    font: document.querySelector('.font-option.active')?.dataset.font || 'sans',
  };
  localStorage.setItem('cyber-zen-settings', JSON.stringify(settings));
}

// Auto-save settings periodically
setInterval(saveSettings, 5000);

// Save on page unload
window.addEventListener('beforeunload', () => {
  fileManager.autoSave();
  saveSettings();
  vibeMixer.dispose();
  background.dispose();
});
