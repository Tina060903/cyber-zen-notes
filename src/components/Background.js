// ============================================================
// Background System - Three.js WebGL Shader Backgrounds
// ============================================================
import * as THREE from 'three';
import {
  vertexShader,
  rainFragmentShader,
  snowFragmentShader,
  starFragmentShader,
  pureFragmentShader,
  defaultFragmentShader
} from '../shaders.js';

/**
 * Manages the full-screen WebGL background with shader effects
 */
export class Background {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.mesh = null;
    this.material = null;
    this.currentMode = 'rain';
    this.clock = new THREE.Clock();
    this.customTexture = null;
    this.useCustomBg = false;
    this.defaultTexture = this.createDefaultTexture();

    // Uniform values
    this.params = {
      rainAmount: 0.5,
      blur: 0.5,
      opacity: 1.0,
      snowAmount: 0.5
    };

    this.init();
    this.animate();
  }

  /** Create a dark ambient gradient texture as default background */
  createDefaultTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(0.5, '#0d0d0d');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  init() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Scene with orthographic camera for full-screen quad
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Create shader material
    this.createMaterial('rain');

    // Full-screen quad
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    // Handle resize
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);

    // Handle mouse movement for shader effects
    this._onMouseMove = this._onMouseMove.bind(this);
    window.addEventListener('mousemove', this._onMouseMove);
  }

  _onMouseMove(e) {
    if (this.material && this.material.uniforms) {
      this.material.uniforms.uMouse.value.set(
        e.clientX / window.innerWidth,
        1.0 - (e.clientY / window.innerHeight)
      );
    }
  }

  createMaterial(mode) {
    this.currentMode = mode;

    let fragmentShader;
    switch (mode) {
      case 'rain':
        fragmentShader = rainFragmentShader;
        break;
      case 'snow':
        fragmentShader = snowFragmentShader;
        break;
      case 'star':
        fragmentShader = starFragmentShader;
        break;
      case 'none':
        fragmentShader = pureFragmentShader;
        break;
      default:
        fragmentShader = defaultFragmentShader;
        break;
    }

    const uniforms = {
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uTime: { value: 0 },
      uRainAmount: { value: this.params.rainAmount },
      uBlur: { value: this.params.blur },
      uOpacity: { value: this.params.opacity },
      uSnowAmount: { value: this.params.snowAmount },
      uTexture1: { value: this.customTexture || this.defaultTexture },
      uUseCustomBg: { value: this.useCustomBg },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uImageAspect: { value: 1.0 }
    };

    if (this.material) {
      this.material.dispose();
    }

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false,
      transparent: false
    });

    if (this.mesh) {
      this.mesh.material = this.material;
    }
  }

  _onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    if (this.material.uniforms) {
      this.material.uniforms.uResolution.value.set(width, height);
    }
  }

  /**
   * Set background mode
   * @param {'rain'|'snow'|'star'|'none'} mode
   */
  setMode(mode) {
    this.createMaterial(mode);
  }

  /**
   * Update shader parameters
   */
  setParams(params) {
    Object.assign(this.params, params);
    if (this.material.uniforms) {
      if (params.rainAmount !== undefined) {
        this.material.uniforms.uRainAmount.value = params.rainAmount;
      }
      if (params.blur !== undefined) {
        this.material.uniforms.uBlur.value = params.blur;
      }
      if (params.opacity !== undefined) {
        this.material.uniforms.uOpacity.value = params.opacity;
      }
      if (params.snowAmount !== undefined) {
        this.material.uniforms.uSnowAmount.value = params.snowAmount;
      }
    }
  }

  /**
   * Set custom background image
   */
  setCustomBackground(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const texture = new THREE.Texture(img);
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          texture.needsUpdate = true;

          this.customTexture = texture;
          this.useCustomBg = true;

          const aspect = img.width / img.height;

          if (this.material.uniforms) {
            this.material.uniforms.uTexture1.value = texture;
            this.material.uniforms.uUseCustomBg.value = true;
            this.material.uniforms.uImageAspect.value = aspect;
          }
          resolve(true);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Remove custom background
   */
  removeCustomBackground() {
    this.useCustomBg = false;
    if (this.material.uniforms) {
      this.material.uniforms.uUseCustomBg.value = false;
    }
    this.customTexture = null;
  }

  /**
   * Animation loop
   */
  animate() {
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    if (this.material.uniforms) {
      this.material.uniforms.uTime.value = elapsed;
    }

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Clean up
   */
  dispose() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('mousemove', this._onMouseMove);
    if (this.renderer) this.renderer.dispose();
    if (this.material) this.material.dispose();
  }
}
