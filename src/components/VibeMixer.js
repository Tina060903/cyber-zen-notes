// ============================================================
// Vibe Mixer - Floating Mini Panel for Environment & Audio
// ============================================================
import { t } from '../utils/i18n.js';
import { saveFile, loadFile, deleteFile, getAudioTrackKeys } from '../utils/storage.js';

export class VibeMixer {
  constructor(background, editor) {
    this.background = background;
    this.editor = editor;

    // Audio state
    this.audioContext = null;
    this.masterGain = null;
    this.rainNode = null;
    this.rainGain = null;
    this.isPlaying = false;

    // BGM tracks
    this.bgmTracks = [];
    this.activeBgmId = null;
    this.bgmGain = null;
    this.bgmSourceNode = null;

    this.elements = {};
    this.init();
  }

  init() {
    this.cacheElements();
    this.initDrag();
    this.initSliders();
    this.initBgUpload();
    this.initAudio();
    this.initBgmPlaylist();
  }

  cacheElements() {
    this.elements = {
      mixer: document.getElementById('vibe-mixer'),
      inner: document.getElementById('vibe-mixer-inner'),
      triggerZone: document.getElementById('vibe-mixer-trigger-zone'),
      rainSlider: document.getElementById('rain-slider'),
      rainVal: document.getElementById('rain-val'),
      blurSlider: document.getElementById('blur-slider'),
      blurVal: document.getElementById('blur-val'),
      opacitySlider: document.getElementById('opacity-slider'),
      opacityVal: document.getElementById('opacity-val'),
      snowSlider: document.getElementById('snow-slider'),
      snowVal: document.getElementById('snow-val'),
      rainSoundSlider: document.getElementById('rain-sound-slider'),
      rainSoundVal: document.getElementById('rain-sound-val'),
      bgmVolSlider: document.getElementById('bgm-vol-slider'),
      bgmVolVal: document.getElementById('bgm-vol-val'),
      bgUploadBtn: document.getElementById('bg-upload-btn'),
      bgFileInput: document.getElementById('bg-file-input'),
      bgRemoveBtn: document.getElementById('bg-remove-btn'),
      bgmUploadBtn: document.getElementById('bgm-upload-btn'),
      bgmFileInput: document.getElementById('bgm-file-input'),
      bgmPlaylist: document.getElementById('bgm-playlist'),
      bgmUploadedList: document.getElementById('bgm-uploaded-list'),
    };
  }

  /** Draggable floating panel */
  initDrag() {
    const panel = this.elements.mixer;
    const handle = this.elements.inner;
    if (!panel || !handle) return;

    // Restore saved position
    const saved = localStorage.getItem('vibe-mixer-pos');
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        panel.style.left = pos.x + 'px';
        panel.style.top = pos.y + 'px';
        panel.style.transform = 'none';
      } catch(e) {}
    }

    let isDragging = false;
    let startX, startY, origX, origY;

    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('input, button, .bgm-track')) return;
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      origX = rect.left;
      origY = rect.top;
      panel.style.transform = 'none';
      panel.style.left = origX + 'px';
      panel.style.top = origY + 'px';
      panel.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      panel.style.left = (origX + dx) + 'px';
      panel.style.top = (origY + dy) + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      panel.style.transition = '';
      const rect = panel.getBoundingClientRect();
      localStorage.setItem('vibe-mixer-pos', JSON.stringify({
        x: rect.left, y: rect.top
      }));
    });
  }

  // ========== Sliders ==========

  initSliders() {
    this.elements.rainSlider.addEventListener('input', () => {
      const val = parseFloat(this.elements.rainSlider.value);
      this.elements.rainVal.textContent = val.toFixed(2);
      this.background.setParams({ rainAmount: val });
    });
    this.elements.blurSlider.addEventListener('input', () => {
      const val = parseFloat(this.elements.blurSlider.value);
      this.elements.blurVal.textContent = val.toFixed(2);
      this.background.setParams({ blur: val });
    });
    this.elements.opacitySlider.addEventListener('input', () => {
      const val = parseFloat(this.elements.opacitySlider.value);
      this.elements.opacityVal.textContent = val.toFixed(2);
      this.background.setParams({ opacity: val });
    });
    this.elements.snowSlider.addEventListener('input', () => {
      const val = parseFloat(this.elements.snowSlider.value);
      this.elements.snowVal.textContent = val.toFixed(2);
      this.background.setParams({ snowAmount: val });
    });
    this.elements.rainSoundSlider.addEventListener('input', () => {
      const val = parseFloat(this.elements.rainSoundSlider.value);
      this.elements.rainSoundVal.textContent = val.toFixed(2);
      const numInput = document.getElementById('rain-sound-num');
      if (numInput) numInput.value = Math.round(val * 100);
      this.setRainVolume(val);
    });
    const rainNum = document.getElementById('rain-sound-num');
    if (rainNum) {
      rainNum.addEventListener('input', function() {
        const raw = parseInt(this.value) || 0;
        const val = Math.min(100, Math.max(0, raw)) / 100;
        document.getElementById('rain-sound-slider').value = val;
        document.getElementById('rain-sound-val').textContent = val.toFixed(2);
        vibeMixer.setRainVolume(val);
      });
    }
    this.elements.bgmVolSlider.addEventListener('input', () => {
      const val = parseFloat(this.elements.bgmVolSlider.value);
      this.elements.bgmVolVal.textContent = val.toFixed(2);
      const numInput = document.getElementById('bgm-vol-num');
      if (numInput) numInput.value = Math.round(val * 100);
      this.setBgmVolume(val);
    });
    const bgmNum = document.getElementById('bgm-vol-num');
    if (bgmNum) {
      bgmNum.addEventListener('input', function() {
        const raw = parseInt(this.value) || 0;
        const val = Math.min(100, Math.max(0, raw)) / 100;
        document.getElementById('bgm-vol-slider').value = val;
        document.getElementById('bgm-vol-val').textContent = val.toFixed(2);
        vibeMixer.setBgmVolume(val);
      });
    }
  }

  // ========== Background Image Upload (with persistence) ==========

  initBgUpload() {
    this.elements.bgUploadBtn.addEventListener('click', () => {
      this.elements.bgFileInput.click();
    });
    this.elements.bgFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await this.background.setCustomBackground(file);
        this.elements.bgUploadBtn.textContent = '✓ Image Loaded';
        this.elements.bgUploadBtn.classList.add('uploaded');
        this.elements.bgRemoveBtn.style.display = 'block';
        saveFile('bg-image', file);
        showToast('Background image loaded');
      }
    });
    this.elements.bgRemoveBtn.addEventListener('click', () => {
      this.background.removeCustomBackground();
      this.elements.bgUploadBtn.textContent = '📁 Upload Image';
      this.elements.bgUploadBtn.classList.remove('uploaded');
      this.elements.bgRemoveBtn.style.display = 'none';
      this.elements.bgFileInput.value = '';
      deleteFile('bg-image');
      showToast('Background removed');
    });
  }

  /** Restore saved background image on startup */
  async restoreSavedBg() {
    const blob = await loadFile('bg-image');
    if (!blob) return;
    const file = new File([blob], 'saved-bg', { type: blob.type });
    await this.background.setCustomBackground(file);
    this.elements.bgUploadBtn.textContent = '✓ Image Loaded';
    this.elements.bgUploadBtn.classList.add('uploaded');
    this.elements.bgRemoveBtn.style.display = 'block';
  }

  /** Restore saved audio tracks on startup */
  async restoreSavedTracks() {
    const keys = await getAudioTrackKeys();
    for (const key of keys) {
      const blob = await loadFile(key);
      if (!blob) continue;
      const meta = await import('../utils/storage.js').then(m => m.getFileMeta(key));
      const name = meta?.name || 'Saved track';
      const file = new File([blob], name, { type: blob.type });
      const trackId = key.replace('audio-', '');
      this.addUploadedTrack(file, trackId);
    }
  }

  // ========== Audio Engine ==========

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Web Audio API not available');
      this.elements.rainSoundSlider.disabled = true;
      this.elements.bgmVolSlider.disabled = true;
    }
  }

  ensureContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // ========== Rain Sound ==========

  startRainSound() {
    if (!this.audioContext || this.rainNode) return;
    this.ensureContext();

    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    // Pure white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    this.rainNode = this.audioContext.createBufferSource();
    this.rainNode.buffer = buffer;
    this.rainNode.loop = true;

    this.rainGain = this.audioContext.createGain();
    this.rainGain.gain.value = 0;

    this.rainNode.connect(this.rainGain);
    this.rainGain.connect(this.audioContext.destination);
    this.rainNode.start();

    const initialVol = parseFloat(this.elements.rainSoundSlider.value);
    this.setRainVolume(initialVol);
  }

  setRainVolume(val) {
    if (this.rainGain) {
      this.rainGain.gain.value = val * 0.3;
    }
    // Also control built-in ambient tracks
    const active = this.bgmTracks.find(t => t.id === this.activeBgmId);
    if (active && active.type === 'builtin' && active.gain) {
      active.gain.gain.value = val * 0.4;
    }
  }

  // ========== BGM Playlist System ==========

  initBgmPlaylist() {
    // Built-in tracks (Web Audio API generated)
    this.registerBuiltinTracks();
    // Upload button
    this.elements.bgmUploadBtn.addEventListener('click', () => {
      this.elements.bgmFileInput.click();
    });
    this.elements.bgmFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.addUploadedTrack(file);
      }
    });

    // Update track names on language change
    document.addEventListener('language-changed', () => {
      this.updateTrackNames();
    });
  }

  /**
   * Update built-in track names when language changes
   */
  updateTrackNames() {
    // Update built-in tracks from i18n
    const trackMap = {
      'builtin-rain': 'track.rain',
      'builtin-forest': 'track.forest',
      'builtin-ocean': 'track.ocean',
      'builtin-wind': 'track.wind'
    };
    document.querySelectorAll('.bgm-track').forEach(el => {
      const trackId = el.dataset.track;
      const key = trackMap[trackId];
      if (key) {
        const nameEl = el.querySelector('.track-name');
        if (nameEl) {
          nameEl.textContent = t(key);
        }
      }
    });
  }

  registerBuiltinTracks() {
    const builtins = [
      { id: 'builtin-rain', name: 'Rain Ambience', desc: '雨声白噪音', icon: '🌧', type: 'builtin', factory: () => this.createRainAmbience() },
      { id: 'builtin-forest', name: 'Forest Night', desc: '森林夜晚（带虫鸣）', icon: '🌲', type: 'builtin', factory: () => this.createForestAmbience() },
      { id: 'builtin-ocean', name: 'Ocean Waves', desc: '海浪声（带潮涌调制）', icon: '🌊', type: 'builtin', factory: () => this.createOceanAmbience() },
      { id: 'builtin-wind', name: 'Wind & Leaves', desc: '风声与树叶', icon: '🍃', type: 'builtin', factory: () => this.createWindAmbience() },
    ];

    const playlist = this.elements.bgmPlaylist;
    playlist.innerHTML = '';

    for (const track of builtins) {
      this.bgmTracks.push({
        id: track.id,
        name: track.name,
        desc: track.desc,
        icon: track.icon,
        type: 'builtin',
        factory: track.factory,
        source: null,
        gain: null,
      mediaSource: null,
        isActive: false
      });

      const el = document.createElement('div');
      el.className = 'bgm-track';
      el.dataset.track = track.id;
      el.innerHTML = `
        <span class="track-icon">${track.icon}</span>
        <div class="track-info">
          <span class="track-name">${track.name}</span>
          <span class="track-desc">${track.desc}</span>
        </div>
        <span class="track-status"></span>
      `;
      el.addEventListener('click', () => this.toggleTrack(track.id));
      playlist.appendChild(el);
    }
  }

  /**
   * Stop current track, play new one (or stop if same)
   */
  toggleTrack(trackId) {
    this.ensureContext();
    const track = this.bgmTracks.find(t => t.id === trackId);
    if (!track) return;

    if (this.activeBgmId === trackId) {
      // Stop this track
      this.stopBgm();
      return;
    }

    // Stop any currently playing BGM
    this.stopBgmInternal();

    // Play the selected track
    this.playTrack(track);
  }

  playTrack(track) {
    if (!this.audioContext) return;

    if (track.type === 'builtin') {
      const vol = parseFloat(this.elements.rainSoundSlider.value);
      track.gain = this.audioContext.createGain();
      track.gain.gain.value = vol * 0.4;
      
      const result = track.factory();
      if (result) {
        result.connect(track.gain);
        track.gain.connect(this.audioContext.destination);
        track.source = result;
      }
    } else if (track.type === 'uploaded') {
      const vol = parseFloat(this.elements.bgmVolSlider.value);
      if (track.audioEl) {
        track.audioEl.volume = vol * 0.5;
        track.audioEl.loop = true;
        // Ensure track starts from beginning if it was paused
        if (track.audioEl.paused) {
          track.audioEl.currentTime = 0;
        }
        track.audioEl.play().catch((err) => {
          console.error("Playback failed:", err);
          showToast("Playback failed. Please interact with the page first.");
        });
        track.source = track.audioEl;
      }
    }

    track.isActive = true;
    this.activeBgmId = track.id;
    this.updateBgmUI();
  }

  stopBgmInternal() {
    const active = this.bgmTracks.find(t => t.id === this.activeBgmId);
    if (active) {
      if (active.type === 'builtin' && active.source) {
        try { active.source.stop(); } catch(e) {}
        try { active.source.disconnect(); } catch(e) {}
        active.source = null;
        if (active.gain) {
          try { active.gain.disconnect(); } catch(e) {}
          active.gain = null;
        }
      } else if (active.type === 'uploaded' && active.audioEl) {
        active.audioEl.pause();
        active.audioEl.currentTime = 0;
        active.source = null;
        if (active.gain) {
          try { active.gain.disconnect(); } catch(e) {}
          active.gain = null;
        }
      }
      active.isActive = false;
    }
    this.activeBgmId = null;
  }

  /**
   * Public stop - stops BGM and updates UI
   */
  stopBgm() {
    this.stopBgmInternal();
    this.updateBgmUI();
  }

  /**
   * Update playlist UI to show active/inactive state
   */
  updateBgmUI() {
    // Update built-in tracks
    this.elements.bgmPlaylist.querySelectorAll('.bgm-track').forEach(el => {
      const trackId = el.dataset.track;
      const track = this.bgmTracks.find(t => t.id === trackId);
      el.classList.toggle('active', track?.isActive || false);
      const statusEl = el.querySelector('.track-status');
      if (statusEl) {
        statusEl.textContent = track?.isActive ? '▶' : '';
      }
    });

    // Update uploaded tracks
    this.elements.bgmUploadedList.querySelectorAll('.bgm-track').forEach(el => {
      const trackId = el.dataset.track;
      const track = this.bgmTracks.find(t => t.id === trackId);
      el.classList.toggle('active', track?.isActive || false);
      const statusEl = el.querySelector('.track-status');
      if (statusEl) {
        statusEl.textContent = track?.isActive ? '▶' : '';
      }
    });
  }

  setBgmVolume(val) {
    // Control only uploaded custom tracks
    const active = this.bgmTracks.find(t => t.id === this.activeBgmId);
    if (active && active.type === 'uploaded' && active.audioEl) {
      active.audioEl.volume = val * 0.5;
    }
  }

  // ========== Built-in Audio Synthesis Factories ==========

  createRainAmbience() {
    if (!this.audioContext) return null;
    const ctx = this.audioContext;
    const sampleRate = ctx.sampleRate;
    const duration = 4;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3;

      // Add occasional "drops"
      if (i % 997 === 0) {
        data[i] += (Math.random() - 0.5) * 0.5;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();
    return source;
  }

  createForestAmbience() {
    if (!this.audioContext) return null;
    const ctx = this.audioContext;
    const sampleRate = ctx.sampleRate;
    const duration = 4;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Band-pass filtered noise for rustling leaves
      data[i] = (lastOut + (0.03 * white)) / 1.03;
      lastOut = data[i];
      data[i] *= 2.5;

      // Occasional cricket/bird chirp simulation
      if (i % 2011 === 0) {
        const chirp = Math.sin(i * 0.05) * Math.exp(-i * 0.0001) * 0.3;
        data[i] += chirp;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Bandpass filter for forest-y sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 0.8;

    source.connect(filter);
    source.start();
    return filter;
  }

  createOceanAmbience() {
    if (!this.audioContext) return null;
    const ctx = this.audioContext;
    const sampleRate = ctx.sampleRate;
    const duration = 6;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Heavy low-pass for ocean rumble
      data[i] = (lastOut + (0.01 * white)) / 1.01;
      lastOut = data[i];
      data[i] *= 4;

      // Wave modulation - slow swell
      const wavePhase = (i / sampleRate) % 6;
      const swell = Math.sin(wavePhase * Math.PI * 2 / 6) * 0.3 + 0.7;
      data[i] *= swell;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Low-pass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    source.connect(filter);
    source.start();
    return filter;
  }

  createWindAmbience() {
    if (!this.audioContext) return null;
    const ctx = this.audioContext;
    const sampleRate = ctx.sampleRate;
    const duration = 5;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.04 * white)) / 1.04;
      lastOut = data[i];
      data[i] *= 2;

      // Gust modulation
      const gustPhase = (i / sampleRate);
      const gust = Math.sin(gustPhase * 0.3) * 0.4 + 0.6;
      data[i] *= gust;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Bandpass for windy sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 1.2;

    source.connect(filter);
    source.start();
    return filter;
  }

  // ========== Uploaded Track Management ==========

  addUploadedTrack(file, persistKey) {
    if (!this.audioContext) return;

    const id = persistKey || 'upload_' + Date.now();
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.loop = true;

    const track = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ''),
      icon: '🎵',
      type: 'uploaded',
      source: null,
      audioEl: audio,
      gain: null,
      mediaSource: null,
      isActive: false,
      file,
      persistKey: id
    };

    this.bgmTracks.push(track);
    this.renderUploadedTrack(track);

    // Save to IndexedDB for persistence
    saveFile('audio-' + id, file);

    showToast(`🎵 Loaded: ${file.name}`);
  }

  /** Restore previously saved audio tracks on startup */
  async restoreSavedTracks() {
    const keys = await getAudioTrackKeys();
    for (const key of keys) {
      const blob = await loadFile(key);
      if (!blob) continue;
      // Reconstruct a File-like object
      const meta = await import('../utils/storage.js').then(m => m.getFileMeta(key));
      const name = meta?.name || 'Saved track';
      const file = new File([blob], name, { type: blob.type });
      // Extract the original id from the key (strip 'audio-' prefix)
      const trackId = key.replace('audio-', '');
      this.addUploadedTrack(file, trackId);
    }
  }

  renderUploadedTrack(track) {
    const el = document.createElement('div');
    el.className = 'bgm-track';
    el.dataset.track = track.id;
    el.dataset.type = 'uploaded';
    el.innerHTML = `
      <span class="track-icon">🎵</span>
      <span class="track-name">${track.name}</span>
      <span class="track-status"></span>
      <button class="track-remove" title="Remove">✕</button>
    `;

    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('track-remove')) return;
      this.toggleTrack(track.id);
    });

    el.querySelector('.track-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeUploadedTrack(track.id);
    });

    this.elements.bgmUploadedList.appendChild(el);
  }

  removeUploadedTrack(trackId) {
    const track = this.bgmTracks.find(t => t.id === trackId);
    if (!track) return;

    if (this.activeBgmId === trackId) {
      this.stopBgm();
    }

    if (track.audioEl) {
      track.audioEl.pause();
      const url = track.audioEl.src;
      track.audioEl.src = '';
      URL.revokeObjectURL(url);
      track.audioEl = null;
      track._mediaConnected = false;
    }

    // Also remove from IndexedDB
    deleteFile('audio-' + trackId);

    const idx = this.bgmTracks.indexOf(track);
    if (idx > -1) this.bgmTracks.splice(idx, 1);

    const el = this.elements.bgmUploadedList.querySelector(`[data-track="${trackId}"]`);
    if (el) el.remove();
  }

  // ========== Public Controls ==========

  /**
   * Toggle all audio on/off (for session resume)
   */
  toggleAudio(active) {
    this.isPlaying = active;
    this.ensureContext();

    if (active) {
      if (!this.rainNode) {
        this.startRainSound();
      }
    }
    // Rain sound stays independent of BGM
  }

  /**
   * Clean up on dispose
   */
  dispose() {
    this.stopBgm();
    if (this.rainNode) {
      try { this.rainNode.stop(); } catch(e) {}
      this.rainNode.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

/**
 * Toast notification helper
 */
function showToast(message, duration = 2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

window.showToast = showToast;
