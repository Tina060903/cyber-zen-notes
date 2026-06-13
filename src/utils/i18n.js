// ============================================================
// i18n - Chinese/English UI Translation System
// ============================================================

const translations = {
  zh: {
    'lang.name': '中文',
    'mode.rain': '🌧 下雨',
    'mode.snow': '❄ 下雪',
    'mode.star': '✨ 星空',
    'mode.none': '◯ 纯净',
    'editor.placeholder': '开始在赛博禅意中书写...',
    'font.sans': '无衬线',
    'font.serif': '衬线',
    'font.mono': '等宽',
    'toolbar.bold': 'B',
    'toolbar.italic': 'I',
    'toolbar.underline': 'U',
    'toolbar.alignLeft': '≡',
    'toolbar.alignCenter': '≡',
    'toolbar.alignRight': '≡',
    'export.btn': '📥 导出',
    'export.txt': '导出为 .txt',
    'export.docx': '导出为 .docx',
    'toolbar.upload': '📂 打开文件',
    'sidebar.vibe': '氛围控制',
    'sidebar.notes': '笔记',
    'mixer.environment': '环境',
    'mixer.rain': '雨量',
    'mixer.blur': '模糊度',
    'mixer.opacity': '透明度',
    'mixer.snow': '雪密度',
    'mixer.bgImage': '背景图片',
    'mixer.uploadImage': '📁 上传图片',
    'mixer.removeImage': '✕ 移除背景',
    'mixer.imageLoaded': '✓ 图片已加载',
    'mixer.audio': '音频控制',
    'mixer.rainSound': '环境白噪音',
    'mixer.bgmVol': '自定义音乐',
    'mixer.musicPlayer': '🎵 氛围音轨',
    'mixer.uploadedTracks': '📁 已上传的曲目',
    'mixer.uploadAudio': '🎵 上传音频文件',
    'mixer.noTracks': '暂无曲目',
    'track.rain': '雨声',
    'track.forest': '森林之夜',
    'track.ocean': '海浪',
    'track.wind': '风与叶',
    'fm.title': '历史项目',
    'fm.newNote': '新笔记',
    'fm.noNotes': '暂无笔记，新建一个吧',
    'fm.deleteConfirm': '确定删除？',
    'timer.display': '25:00',
    'timer.start': '▶',
    'timer.pause': '❚❚',
    'timer.reset': '↺',
    'timer.modeRing': '◯',
    'timer.modeBar': '▬',
    'timer.min': '分钟',
    'timer.complete': '🌿 禅定完成！',
    'toast.saved': '💾 已保存',
    'toast.exported': '✅ 已导出',
    'toast.welcome': '🌿 Cyber Zen 已就绪',
    'toast.created': '新笔记已创建',
    'toast.deleted': '笔记已删除',
    'toast.bgLoaded': '背景图片已加载',
    'toast.bgRemoved': '背景已移除',
    'toast.bgmLoaded': '🎵 已加载',
    'toast.exportFailed': '❌ 导出失败',
    'toast.cannotDelete': '不能删除最后一个笔记',
    'loading.text': '加载中...',
    'welcome.title': '欢迎来到 Cyber Zen',
    'welcome.subtitle': '你的沉浸式心流笔记空间',
    'welcome.line1': '✦ 使用左侧的<strong>氛围控制</strong>面板调节雨量、模糊和音效',
    'welcome.line2': '✦ 从右侧<strong>笔记</strong>面板浏览你的笔记',
    'welcome.line3': '✦ 悬停<strong>顶部</strong>切换下雨/下雪/星空背景',
    'welcome.line4': '✦ 上传自定义图片或音乐来个性化空间',
    'welcome.line5': '✦ 底部禅定计时器帮助你专注',
    'welcome.begin': '🌿 <em>开始你的心流...</em>',
    'shortcut.save': '保存',
    'shortcut.new': '新建',
    'shortcut.close': '关闭侧边栏',
  },

  en: {
    'lang.name': 'English',
    'mode.rain': '🌧 Rain',
    'mode.snow': '❄ Snow',
    'mode.star': '✨ Star',
    'mode.none': '◯ None',
    'editor.placeholder': 'Start writing in the cyber zen...',
    'font.sans': 'Sans',
    'font.serif': 'Serif',
    'font.mono': 'Mono',
    'toolbar.bold': 'B',
    'toolbar.italic': 'I',
    'toolbar.underline': 'U',
    'toolbar.alignLeft': '≡',
    'toolbar.alignCenter': '≡',
    'toolbar.alignRight': '≡',
    'export.btn': '📥 Export',
    'export.txt': 'Export as .txt',
    'export.docx': 'Export as .docx',
    'toolbar.upload': '📂 Open File',
    'sidebar.vibe': 'Vibe Mixer',
    'sidebar.notes': 'Notes',
    'mixer.environment': 'Environment',
    'mixer.rain': 'Rain',
    'mixer.blur': 'Blur',
    'mixer.opacity': 'Opacity',
    'mixer.snow': 'Snow',
    'mixer.bgImage': 'Background',
    'mixer.uploadImage': '📁 Upload Image',
    'mixer.removeImage': '✕ Remove',
    'mixer.imageLoaded': '✓ Image Loaded',
    'mixer.audio': 'Audio Control',
    'mixer.rainSound': 'Ambient Noise',
    'mixer.bgmVol': 'Custom Music',
    'mixer.musicPlayer': '🎵 Soundscapes',
    'mixer.uploadedTracks': '📁 Uploaded Tracks',
    'mixer.uploadAudio': '🎵 Upload Audio',
    'mixer.noTracks': 'No tracks yet',
    'track.rain': 'Rain Ambience',
    'track.forest': 'Forest Night',
    'track.ocean': 'Ocean',
    'track.wind': 'Wind',
    'fm.title': 'History',
    'fm.newNote': 'New Note',
    'fm.noNotes': 'No notes yet. Create one!',
    'fm.deleteConfirm': 'Delete?',
    'timer.display': '25:00',
    'timer.start': '▶',
    'timer.pause': '❚❚',
    'timer.reset': '↺',
    'timer.modeRing': '◯',
    'timer.modeBar': '▬',
    'timer.min': 'min',
    'timer.complete': '🌿 Zen session complete!',
    'toast.saved': '💾 Saved',
    'toast.exported': '✅ Exported',
    'toast.welcome': '🌿 Cyber Zen Notes ready',
    'toast.created': 'New note created',
    'toast.deleted': 'Note deleted',
    'toast.bgLoaded': 'Background image loaded',
    'toast.bgRemoved': 'Background removed',
    'toast.bgmLoaded': '🎵 Loaded',
    'toast.exportFailed': '❌ Export failed',
    'toast.cannotDelete': 'Cannot delete the last note',
    'loading.text': 'Loading Cyber Zen',
    'welcome.title': 'Welcome to Cyber Zen',
    'welcome.subtitle': 'Your immersive mindflow note-taking space.',
    'welcome.line1': '✦ Use the <strong>Vibe Mixer</strong> (left) to adjust rain, blur, and sound.',
    'welcome.line2': '✦ Browse notes from the <strong>Notes</strong> panel (right).',
    'welcome.line3': '✦ Hover at the <strong>top</strong> to switch Rain / Snow / Star modes.',
    'welcome.line4': '✦ Upload your own images or music to personalize.',
    'welcome.line5': '✦ The Zen Timer helps you focus.',
    'welcome.begin': '🌿 <em>Begin your flow...</em>',
    'shortcut.save': 'Save',
    'shortcut.new': 'New',
    'shortcut.close': 'Close sidebars',
  }
};

let currentLang = 'zh';

/**
 * Get translation for a key
 */
export function t(key) {
  return translations[currentLang]?.[key] || translations['zh']?.[key] || key;
}

/**
 * Switch language and update all UI elements
 */
export function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('cyber-zen-lang', lang);
  updateUI();
}

/**
 * Get current language
 */
export function getLanguage() {
  return currentLang;
}

/**
 * Update all DOM elements with data-i18n attributes
 */
function updateUI() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    if (el.tagName === 'INPUT' && el.type === 'text') {
      el.placeholder = translation;
    } else if (el.tagName === 'TEXTAREA') {
      el.placeholder = translation;
    } else {
      el.innerHTML = translation;
    }
  });

  // Update language toggle button
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.textContent = currentLang === 'zh' ? 'EN' : '中文';
  }

  // Dispatch event for components that need to update dynamically
  document.dispatchEvent(new CustomEvent('language-changed', {
    detail: { lang: currentLang }
  }));
}

/**
 * Initialize i18n - load saved language preference
 */
export function initI18n() {
  const saved = localStorage.getItem('cyber-zen-lang');
  if (saved === 'en') {
    currentLang = 'en';
  }
  // Apply initial translations
  setTimeout(updateUI, 0);
}
