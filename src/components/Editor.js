// ============================================================
// Editor - Quill.js Rich Text Editor
// Uses Quill without built-in toolbar, uses custom toolbar
// ============================================================
import Quill from 'quill';
import 'quill/dist/quill.core.css';

// Register custom font options
const FontAttributor = Quill.import('attributors/style/font');
FontAttributor.whitelist = ['sans', 'serif', 'mono'];
Quill.register(FontAttributor, true);

// Override Quill's inline font-family to use actual fonts
const fontOverrideStyle = document.createElement('style');
fontOverrideStyle.textContent = `
  [style*="font-family: sans"] { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important; }
  [style*="font-family: serif"] { font-family: 'Playfair Display', Georgia, serif !important; }
  [style*="font-family: mono"] { font-family: 'JetBrains Mono', 'Fira Code', monospace !important; }
`;
document.head.appendChild(fontOverrideStyle);

export class Editor {
  constructor() {
    this.contentChangeCallback = null;
    this.toolbarEl = document.getElementById('editor-toolbar');
    this.editorContainer = document.getElementById('editor');

    this.initQuill();
    this.connectToolbar();
    this.initGhost();
  }

  initQuill() {
    // Create Quill WITHOUT toolbar module (we use custom toolbar)
    this.quill = new Quill('#editor', {
      theme: 'snow',
      modules: {
        toolbar: false,
        keyboard: {
          bindings: {
            tab: {
              key: 9,
              handler: () => {
                const range = this.quill.getSelection();
                if (range) {
                  this.quill.insertText(range.index, '    ');
                  this.quill.setSelection(range.index + 4);
                }
                return false;
              }
            }
          }
        }
      },
      placeholder: 'Start writing in the cyber zen...'
    });

    this.quill.on('text-change', () => {
      if (this.contentChangeCallback) {
        this.contentChangeCallback(this.getContent(), this.getText());
      }
    });

    this.quill.on('selection-change', (range) => {
      if (range) this.updateToolbarState();
    });

    // React to language changes
    document.addEventListener('language-changed', (e) => {
      if (e.detail.lang === 'zh') {
        this.quill.root.dataset.placeholder = '开始在赛博禅意中书写...';
      } else {
        this.quill.root.dataset.placeholder = 'Start writing in the cyber zen...';
      }
    });

    this.editorEl = document.getElementById('editor');

    // Clean up empty default toolbar that snow theme might add
    const defaultToolbar = this.editorContainer.querySelector('.ql-toolbar');
    if (defaultToolbar) defaultToolbar.remove();
  }

  initGhost() {
    // Ghost mode allows the editor to become transparent/hidden for focus
    this.editorEl = document.getElementById('editor');
  }

  setGhost(active) {
    if (active) {
      this.toolbarEl.classList.add('ghost-hidden');
      this.editorEl.classList.add('ghost-hidden');
    } else {
      this.toolbarEl.classList.remove('ghost-hidden');
      this.editorEl.classList.remove('ghost-hidden');
    }
  }

  connectToolbar() {
    // Font selector cards
    document.querySelectorAll('.font-option').forEach(card => {
      card.addEventListener('click', () => {
        const font = card.dataset.font;
        document.querySelectorAll('.font-option').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.quill.format('font', font);
        this.quill.focus();
      });
    });

    // Size selector buttons
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = btn.dataset.size;
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sizeMap = { small: '14px', medium: '18px', large: '24px' };
        this.quill.root.style.fontSize = sizeMap[size] || '18px';
        this.quill.focus();
      });
    });

    // Bold
    document.querySelector('.ql-bold')?.addEventListener('click', () => {
      this.quill.format('bold', !this.quill.getFormat().bold);
    });
    // Italic
    document.querySelector('.ql-italic')?.addEventListener('click', () => {
      this.quill.format('italic', !this.quill.getFormat().italic);
    });
    // Underline
    document.querySelector('.ql-underline')?.addEventListener('click', () => {
      this.quill.format('underline', !this.quill.getFormat().underline);
    });
    // Alignment
    document.querySelectorAll('.ql-align').forEach(btn => {
      btn.addEventListener('click', () => {
        this.quill.format('align', btn.getAttribute('value'));
        this.quill.focus();
      });
    });
  }

  updateToolbarState() {
    const range = this.quill.getSelection();
    if (!range) return;
    const formats = this.quill.getFormat(range);
    document.querySelector('.ql-bold')?.classList.toggle('ql-active', !!formats.bold);
    document.querySelector('.ql-italic')?.classList.toggle('ql-active', !!formats.italic);
    document.querySelector('.ql-underline')?.classList.toggle('ql-active', !!formats.underline);
    const align = formats.align || 'left';
    document.querySelectorAll('.ql-align').forEach(b => {
      b.classList.toggle('ql-active', b.getAttribute('value') === align);
    });
    const currentFont = formats.font || 'sans';
    document.querySelectorAll('.font-option').forEach(card => {
      card.classList.toggle('active', card.dataset.font === currentFont);
    });
  }

  setContent(html) {
    this.quill.root.innerHTML = html;
  }
  getContent() { return this.quill.root.innerHTML; }
  getText() { return this.quill.getText(); }
  focus() { this.quill.focus(); }

  setFont(fontName) {
    if (fontName) {
      this.quill.format('font', fontName);
      document.querySelectorAll('.font-option').forEach(card => {
        card.classList.toggle('active', card.dataset.font === fontName);
      });
    }
  }

  onContentChange(callback) {
    this.contentChangeCallback = callback;
  }

  getQuill() {
    return this.quill;
  }
}
