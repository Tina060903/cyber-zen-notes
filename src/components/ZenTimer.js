// ============================================================
// Zen Timer - Mindful Countdown Timer
// ============================================================

export class ZenTimer {
  constructor() {
    this.duration = 25 * 60;
    this.remaining = 0;

    // Listen for language changes to update timer UI text
    document.addEventListener('language-changed', () => {
      // mode toggle icon stays as-is (symbol)
      // other timer elements are symbols so no translation needed
    });
    this.isRunning = false;
    this.interval = null;
    this.mode = 'ring'; // 'ring' or 'bar'

    this.elements = {
      display: document.getElementById('timer-display'),
      input: document.getElementById('timer-input'),
      toggle: document.getElementById('timer-toggle'),
      reset: document.getElementById('timer-reset'),
      modeToggle: document.getElementById('timer-mode-toggle'),
      ring: document.getElementById('timer-progress-ring'),
      bar: document.getElementById('timer-progress-bar'),
      ringFg: document.querySelector('#timer-progress-ring .fg-ring'),
      barFill: document.querySelector('#timer-progress-bar .fill'),
      container: document.getElementById('zen-timer')
    };

    // Ring circumference
    this.ringCircumference = 2 * Math.PI * 24; // r=24

    this.init();
  }

  init() {
    // Set initial display
    this.updateDisplay();

    // Toggle start/pause
    this.elements.toggle.addEventListener('click', () => {
      if (this.isRunning) {
        this.pause();
      } else {
        this.start();
      }
    });

    // Reset
    this.elements.reset.addEventListener('click', () => {
      this.reset();
    });

    // Click display to edit duration
    this.elements.display.addEventListener('click', () => {
      if (!this.isRunning) {
        this.elements.display.style.display = 'none';
        this.elements.input.style.display = 'block';
        this.elements.input.focus();
        this.elements.input.select();
      }
    });

    // Duration input handling
    const finishEditing = () => {
      const mins = parseInt(this.elements.input.value) || 25;
      this.duration = Math.max(1, Math.min(120, mins)) * 60;
      this.remaining = this.duration;
      this.elements.input.style.display = 'none';
      this.elements.display.style.display = 'block';
      this.updateDisplay();
      this.updateProgress(1);
    };

    this.elements.input.addEventListener('blur', finishEditing);
    this.elements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.elements.input.blur();
      }
    });

    // Toggle ring/bar mode
    this.elements.modeToggle.addEventListener('click', () => {
      this.mode = this.mode === 'ring' ? 'bar' : 'ring';
      this.elements.modeToggle.textContent = this.mode === 'ring' ? '◯' : '▬';
      this.elements.ring.style.display = this.mode === 'ring' ? 'block' : 'none';
      this.elements.bar.style.display = this.mode === 'bar' ? 'block' : 'none';
    });

    // Initial progress ring setup
    this.elements.ringFg.style.strokeDasharray = this.ringCircumference;
    this.elements.ringFg.style.strokeDashoffset = '0';
  }

  start() {
    if (this.remaining <= 0) {
      this.remaining = this.duration;
    }

    this.isRunning = true;
    this.elements.toggle.textContent = '❚❚';

    const startTime = Date.now();
    const startRemaining = this.remaining;

    this.interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      this.remaining = Math.max(0, startRemaining - elapsed);

      this.updateDisplay();
      this.updateProgress(this.remaining / this.duration);

      if (this.remaining <= 0) {
        this.complete();
      }
    }, 100);
  }

  pause() {
    this.isRunning = false;
    this.elements.toggle.textContent = '▶';
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  reset() {
    this.pause();
    const mins = parseInt(this.elements.input.value) || 25;
    this.duration = Math.max(1, Math.min(120, mins)) * 60;
    this.remaining = this.duration;
    this.updateDisplay();
    this.updateProgress(1);
    this.elements.toggle.textContent = '▶';
  }

  complete() {
    this.pause();
    this.elements.toggle.textContent = '▶';
    this.updateProgress(0);

    // Visual flash effect
    this.elements.container.style.transition = 'none';
    this.elements.container.style.borderColor = 'rgba(120, 140, 255, 0.8)';
    this.elements.container.style.boxShadow = '0 0 30px rgba(120, 140, 255, 0.3)';

    setTimeout(() => {
      this.elements.container.style.transition = 'all 0.5s ease';
      this.elements.container.style.borderColor = '';
      this.elements.container.style.boxShadow = '';
    }, 2000);

    // Reset to full after completion display
    setTimeout(() => {
      this.reset();
    }, 5000);

    showToast('🌿 Zen session complete!');
  }

  updateDisplay() {
    const mins = Math.floor(this.remaining / 60);
    const secs = Math.floor(this.remaining % 60);
    this.elements.display.textContent =
      `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  updateProgress(ratio) {
    // ratio: 1 = full, 0 = empty
    if (this.mode === 'ring') {
      const offset = this.ringCircumference * (1 - ratio);
      this.elements.ringFg.style.strokeDashoffset = offset;
    } else {
      this.elements.barFill.style.width = `${ratio * 100}%`;
    }
  }

}
