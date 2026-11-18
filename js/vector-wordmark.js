/**
 * Vector Wordmark Engine — Originkit / SAKSHAM Edition
 * High-performance WebGL2/WebGL1 dynamic vector typography and CAD lattice simulation.
 * Features:
 * - 2D Canvas Dual-Channel Atlas (R: Soft Fill, G: Dotted Vector Paths)
 * - Ring-Blur Shader with Radial Cursor Proximity Unmasking
 * - Real-Time Trilateral Lattice Snap & Harmonic Drift Physics
 * - Monospace Live Coordinate Readout Badges
 * - Viewport Visibility & Intersection-Based Throttling (60fps lock)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VectorWordmark = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MAX_DPR = 2;
  const REF_WIDTH = 1200;
  const MAX_TEX = 4096;

  const HANDLES = 3;
  const CELL_ASPECT = 0.6;
  const DRIFT_X = 0.08;
  const DRIFT_Y = 0.04;
  const DRIFT_RATE = 1.3;
  const DRIFT_RATE_Y = 1.3 * 1.3;
  const SWEEP_RATE = 0.5;
  const SWEEP_BAND = 0.28;
  const RESNAP = 0.2;
  const DAMP_REF = 20;
  const SPEED_REF = 50;
  const LABEL_MAX = 0.65;
  const DOT_DIAMETER = 4 / 440;
  const DOT_PITCH = 12 / 440;

  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const fract = (x) => x - Math.floor(x);

  function parseColor(input, fallback) {
    if (!input) return fallback;
    let s = String(input).trim();
    if (s.slice(0, 4).toLowerCase() === 'var(') {
      const comma = s.indexOf(',');
      const close = s.lastIndexOf(')');
      if (comma < 0 || close < comma) return fallback;
      s = s.slice(comma + 1, close).trim();
    }
    if (s[0] === '#') {
      let h = s.slice(1);
      if (h.length === 3 || h.length === 4) {
        let x = '';
        for (const c of h) x += c + c;
        h = x;
      }
      if (h.length === 6) h += 'ff';
      if (h.length !== 8 || /[^0-9a-f]/i.test(h)) return fallback;
      return [
        parseInt(h.slice(0, 2), 16) / 255,
        parseInt(h.slice(2, 4), 16) / 255,
        parseInt(h.slice(4, 6), 16) / 255,
        parseInt(h.slice(6, 8), 16) / 255,
      ];
    }
    const m = s.match(/^(rgba?|hsla?)\(([^)]*)\)$/i);
    if (!m) return fallback;
    const parts = m[2].split(/[\s,/]+/).filter((p) => p.length > 0);
    if (parts.length < 3) return fallback;
    const num = (t, scale) => {
      const v = parseFloat(t);
      if (!Number.isFinite(v)) return 0;
      return t.indexOf('%') >= 0 ? (v / 100) * scale : v;
    };
    const alpha = parts.length > 3 ? clamp(num(parts[3], 1), 0, 1) : 1;
    if (m[1].toLowerCase().slice(0, 3) === 'rgb') {
      return [
        clamp(num(parts[0], 255) / 255, 0, 1),
        clamp(num(parts[1], 255) / 255, 0, 1),
        clamp(num(parts[2], 255) / 255, 0, 1),
        alpha,
      ];
    }
    const hh = fract(parseFloat(parts[0]) / 360);
    const sat = clamp(num(parts[1], 1), 0, 1);
    const li = clamp(num(parts[2], 1), 0, 1);
    const q = li < 0.5 ? li * (1 + sat) : li + sat - li * sat;
    const p = 2 * li - q;
    const chan = (t) => {
      let u = fract(t);
      if (u < 1 / 6) return p + (q - p) * 6 * u;
      if (u < 1 / 2) return q;
      if (u < 2 / 3) return p + (q - p) * (2 / 3 - u) * 6;
      return p;
    };
    return [chan(hh + 1 / 3), chan(hh), chan(hh - 1 / 3), alpha];
  }

  const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
}`;

  const FRAG = `
precision highp float;

uniform sampler2D uMap;
uniform vec2 uRes;
uniform vec2 uAtlas;
uniform vec2 uPtr;
uniform float uReach;
uniform vec3 uText;
uniform vec3 uShade;
uniform vec4 uAccent;
uniform vec2 uV0;
uniform vec2 uV1;
uniform vec2 uV2;
uniform float uHalf;

varying vec2 vUv;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 blurRG(vec2 uv, float e) {
    vec4 sum = vec4(0.0);
    for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float th = radians(fi / 6.0 * 360.0);
        vec2 dir = vec2(cos(th), sin(th));
        vec2 off = dir * (hash(vec2(fi, uv.x + uv.y)) + e);
        sum += texture2D(uMap, uv + off * e);
    }
    return (sum / 6.0).rg;
}

vec2 segment(vec2 p, vec2 a, vec2 b) {
    vec2 ab = b - a;
    vec2 ap = p - a;
    float t = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-8), 0.0, 1.0);
    return vec2(length(ap - ab * t), t);
}

float stroke(float d, float lw, float px) {
    return 1.0 - smoothstep(lw, lw + px, d);
}

float dashedLine(vec2 p, vec2 a, vec2 b, float lw, float px) {
    vec2 s = segment(p, a, b);
    float dash = step(0.5, fract(s.y * length(b - a) * 100.0));
    return stroke(s.x, lw, px) * dash;
}

float boxEdge(vec2 p, vec2 c, float h, float lw, float px) {
    vec2 q = abs(p - c) - vec2(h);
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    return stroke(abs(d), lw, px);
}

void main() {
    float aspect = uRes.x / uRes.y;

    vec2 E = (vUv * uRes - (uRes - uAtlas) * 0.5) / uAtlas;
    float inside = step(0.0, E.x) * step(E.x, 1.0) * step(0.0, E.y) * step(E.y, 1.0);
    vec2 safeUv = clamp(E, 0.0, 1.0);

    float b = clamp(1.0 - E.y * 3.5, 0.0, 1.0) * 0.008;
    vec2 soft = blurRG(safeUv, b);
    vec2 sharp = blurRG(safeUv, b * 0.1);

    float d = length((vUv - uPtr) / vec2(1.0, aspect));
    float k = 1.0 - pow(smoothstep(0.0, max(uReach, 1e-4), d), 3.0);

    float mask = mix(soft.r, sharp.g, k) * inside;
    vec3 fill = mix(uShade, uText, smoothstep(0.0, 1.0, E.y));

    vec2 P = vec2(vUv.x * aspect, vUv.y);
    float px = 1.0 / uRes.y;
    float lw = px * 0.2;
    float lines = max(
        max(dashedLine(P, uV0, uV1, lw, px), dashedLine(P, uV1, uV2, lw, px)),
        dashedLine(P, uV2, uV0, lw, px)
    );
    float boxes = max(
        max(boxEdge(P, uV0, uHalf, lw, px), boxEdge(P, uV1, uHalf, lw, px)),
        boxEdge(P, uV2, uHalf, lw, px)
    );
    float A = max(lines, boxes) * uAccent.a * (1.0 - vUv.y);

    vec4 card = vec4(fill * mask, mask);
    vec4 comp = vec4(uAccent.rgb * A, A) + card * (1.0 - A);

    gl_FragColor = comp * pow(clamp(E.y, 0.0, 1.0), 0.7);
}`;

  function compile(gl, vs, fs) {
    const make = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('Shader compile failed:', gl.getShaderInfoLog(sh));
      }
      return sh;
    };
    const p = gl.createProgram();
    gl.attachShader(p, make(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, make(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('Program link failed:', gl.getProgramInfoLog(p));
    }
    return p;
  }

  function fontString(f, px) {
    return `${f.style} ${f.weight} ${px}px ${f.family}`;
  }

  function buildAtlas(text, f, drawFontPx, dpr) {
    const probe = document.createElement('canvas').getContext('2d');
    if (!probe) return null;

    const setFont = (ctx, px) => {
      ctx.font = fontString(f, px);
      try {
        if ('letterSpacing' in ctx) {
          ctx.letterSpacing = f.letterSpacing;
        }
      } catch (e) {}
    };

    const measure = (px) => {
      setFont(probe, px);
      const m = probe.measureText(text);
      const asc = m.actualBoundingBoxAscent || px * 0.8;
      const desc = m.actualBoundingBoxDescent || px * 0.22;
      return { w: Math.max(1, m.width), asc, desc };
    };

    let fpx = Math.max(8, drawFontPx * dpr);
    let m = measure(fpx);
    let pad = fpx * 0.12;
    const over = Math.max(
      (m.w + pad * 2) / MAX_TEX,
      (m.asc + m.desc + pad * 2) / MAX_TEX
    );
    if (over > 1) {
      fpx = Math.max(8, fpx / over);
      m = measure(fpx);
      pad = fpx * 0.12;
    }

    const w = Math.max(1, Math.ceil(m.w + pad * 2));
    const h = Math.max(1, Math.ceil(m.asc + m.desc + pad * 2));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    setFont(ctx, fpx);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.globalCompositeOperation = 'lighter';

    ctx.fillStyle = '#ff0000';
    ctx.fillText(text, pad, pad + m.asc);

    const block = m.asc + m.desc;
    ctx.strokeStyle = '#00ff00';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1, block * DOT_DIAMETER);
    ctx.setLineDash([0, Math.max(2, block * DOT_PITCH)]);
    ctx.strokeText(text, pad, pad + m.asc);

    const cssPerPx = drawFontPx / fpx;
    return { canvas, cssW: w * cssPerPx, cssH: h * cssPerPx };
  }

  class VectorWordmarkEngine {
    constructor(host, options = {}) {
      if (!host) return;
      this.host = host;
      this.opts = Object.assign(
        {
          text: host.dataset.text || 'SAKSHAM',
          fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
          fontWeight: '800',
          fontStyle: 'normal',
          fontSize: 190,
          letterSpacing: '-0.03em',
          background: 'transparent',
          textColor: '#FFFFFF',
          shade: '#38BDF8',
          accent: 'rgba(56, 189, 248, 0.75)',
          reach: 320,
          speed: 50,
          damping: 60,
          handleSize: 109,
          handleSpread: 27,
          showLabels: true,
        },
        options
      );

      this.alive = true;
      this.running = true;
      this.inViewport = true;
      this.raf = 0;
      this.last = 0;

      this.initDOM();
      this.initGL();
      this.bindEvents();
      this.start();
    }

    initDOM() {
      this.host.classList.add('vector-wordmark-host');
      this.host.style.position = 'relative';
      this.host.style.overflow = 'hidden';
      this.host.style.backgroundColor = this.opts.background;

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'vector-wordmark-canvas';
      this.canvas.style.position = 'absolute';
      this.canvas.style.inset = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.display = 'block';
      this.host.appendChild(this.canvas);

      const accentRGBA = parseColor(this.opts.accent, [0.22, 0.74, 0.97, 0.75]);
      this.labelColor = `rgb(${Math.round(accentRGBA[0] * 255)}, ${Math.round(
        accentRGBA[1] * 255
      )}, ${Math.round(accentRGBA[2] * 255)})`;

      this.labelEls = [];
      if (this.opts.showLabels) {
        for (let i = 0; i < HANDLES; i++) {
          const el = document.createElement('div');
          el.className = 'vector-wordmark-label';
          el.style.position = 'absolute';
          el.style.left = '0';
          el.style.top = '0';
          el.style.opacity = String(LABEL_MAX);
          el.style.pointerEvents = 'none';
          el.style.whiteSpace = 'nowrap';
          el.style.fontFamily = "'IBM Plex Mono', 'Fira Code', ui-monospace, monospace";
          el.style.fontSize = '11px';
          el.style.letterSpacing = '0.08em';
          el.style.color = this.labelColor;
          el.style.transform = 'translate(-999px, -999px)';
          this.host.appendChild(el);
          this.labelEls.push(el);
        }
      }
    }

    initGL() {
      const attrs = {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        powerPreference: 'high-performance',
      };
      this.gl = this.canvas.getContext('webgl2', attrs) || this.canvas.getContext('webgl', attrs);
      if (!this.gl) {
        console.warn('VectorWordmark: WebGL context unavailable. Falling back.');
        this.renderFallback();
        return;
      }

      this.isGL2 =
        typeof WebGL2RenderingContext !== 'undefined' &&
        this.gl instanceof WebGL2RenderingContext;

      this.prog = compile(this.gl, VERT, FRAG);
      this.U = {
        map: this.gl.getUniformLocation(this.prog, 'uMap'),
        res: this.gl.getUniformLocation(this.prog, 'uRes'),
        atlas: this.gl.getUniformLocation(this.prog, 'uAtlas'),
        ptr: this.gl.getUniformLocation(this.prog, 'uPtr'),
        reach: this.gl.getUniformLocation(this.prog, 'uReach'),
        text: this.gl.getUniformLocation(this.prog, 'uText'),
        shade: this.gl.getUniformLocation(this.prog, 'uShade'),
        accent: this.gl.getUniformLocation(this.prog, 'uAccent'),
        v0: this.gl.getUniformLocation(this.prog, 'uV0'),
        v1: this.gl.getUniformLocation(this.prog, 'uV1'),
        v2: this.gl.getUniformLocation(this.prog, 'uV2'),
        half: this.gl.getUniformLocation(this.prog, 'uHalf'),
      };

      this.quad = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quad);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        this.gl.STATIC_DRAW
      );
      this.gl.enableVertexAttribArray(0);
      this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
      this.gl.disable(this.gl.BLEND);

      this.tex = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        1,
        1,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 255])
      );
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

      this.boxW = Math.max(1, this.host.offsetWidth);
      this.boxH = Math.max(1, this.host.offsetHeight);
      this.boxDirty = true;
      this.dpr = 1;
      this.bufW = 0;
      this.bufH = 0;
      this.atlasRatioW = 1;
      this.atlasRatioH = 1;
      this.atlasKey = '';

      this.target = { x: -0.5, y: 0.5 };
      this.eased = { x: -0.5, y: 0.5 };
      this.cells = [];
      this.verts = [];
      for (let i = 0; i < HANDLES; i++) {
        this.cells.push({ x: -0.5, y: 0.5 });
        this.verts.push({ x: -0.5, y: 0.5 });
      }
      this.hasPointer = false;
      this.sweepClock = 0;
      this.driftT = 0;
      this.pointerIdleTimer = null;
    }

    renderFallback() {
      const fallback = document.createElement('div');
      fallback.className = 'vector-wordmark-fallback';
      fallback.style.cssText =
        'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:900;letter-spacing:-0.03em;color:#FFF;font-size:clamp(40px, 10vw, 160px);';
      fallback.textContent = this.opts.text;
      this.host.appendChild(fallback);
    }

    drawFontPx() {
      return this.opts.fontSize * (this.boxW / REF_WIDTH);
    }

    resize() {
      this.boxW = Math.max(1, this.host.offsetWidth);
      this.boxH = Math.max(1, this.host.offsetHeight);
      this.dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(this.boxW * this.dpr));
      const h = Math.max(1, Math.round(this.boxH * this.dpr));
      if (w === this.bufW && h === this.bufH) return;
      this.bufW = w;
      this.bufH = h;
      this.canvas.width = w;
      this.canvas.height = h;
    }

    rebuildAtlas() {
      if (!this.gl) return;
      const f = {
        family: this.opts.fontFamily,
        weight: this.opts.fontWeight,
        style: this.opts.fontStyle,
        size: this.opts.fontSize,
        letterSpacing: this.opts.letterSpacing,
      };
      const px = Math.max(8, this.drawFontPx());
      const atlas = buildAtlas(this.opts.text || ' ', f, px, this.dpr);
      if (!atlas) return;

      this.atlasRatioW = Math.max(1e-4, atlas.cssW / px);
      this.atlasRatioH = Math.max(1e-4, atlas.cssH / px);

      if (typeof document !== 'undefined' && document.fonts) {
        try {
          const probe = fontString(f, 64);
          if (!document.fonts.check(probe)) {
            const again = () => {
              if (this.alive) this.atlasKey = '';
            };
            document.fonts.load(probe, this.opts.text).then(again, again);
          }
        } catch (e) {}
      }

      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        atlas.canvas
      );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

      const cw = atlas.canvas.width;
      const ch = atlas.canvas.height;
      const pot = (cw & (cw - 1)) === 0 && (ch & (ch - 1)) === 0;
      if (this.isGL2 || pot) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
    }

    snap(x, y, cw, ch) {
      const cx = Math.floor(x / cw);
      const cy = Math.floor(y / ch);
      const found = [];
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const px = (cx + i + 0.5) * cw;
          const py = (cy + j + 0.5) * ch;
          found.push({ x: px, y: py, d: Math.hypot(px - x, py - y) });
        }
      }
      found.sort((a, b) => a.d - b.d);
      for (let i = 0; i < HANDLES; i++) {
        this.cells[i].x = found[i + 1].x;
        this.cells[i].y = found[i + 1].y;
      }
    }

    bindEvents() {
      this.onMove = (e) => {
        this.hasPointer = true;
        const r = this.host.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        this.target.x = (e.clientX - r.left) / r.width;
        this.target.y = 1 - (e.clientY - r.top) / r.height;

        if (this.pointerIdleTimer) clearTimeout(this.pointerIdleTimer);
        this.pointerIdleTimer = setTimeout(() => {
          this.hasPointer = false;
        }, 4000);
      };

      this.host.addEventListener('pointermove', this.onMove, { passive: true });
      this.host.addEventListener('pointerdown', this.onMove, { passive: true });

      this.ro = new ResizeObserver(() => {
        this.boxDirty = true;
      });
      this.ro.observe(this.host);

      this.onVis = () => {
        if (!document.hidden && this.inViewport) {
          if (!this.raf) {
            this.last = 0;
            this.raf = requestAnimationFrame(this.loop.bind(this));
          }
        } else if (this.raf) {
          cancelAnimationFrame(this.raf);
          this.raf = 0;
        }
      };
      document.addEventListener('visibilitychange', this.onVis);

      if ('IntersectionObserver' in window) {
        this.io = new IntersectionObserver((entries) => {
          this.inViewport = entries[0].isIntersecting;
          this.onVis();
        });
        this.io.observe(this.host);
      }
    }

    sync() {
      if (this.boxDirty) {
        this.boxDirty = false;
        this.resize();
      }
      const key = [
        this.opts.text,
        this.opts.fontFamily,
        this.opts.fontWeight,
        this.opts.fontStyle,
        this.opts.letterSpacing,
        this.dpr,
        Math.ceil(Math.max(8, this.drawFontPx()) / 64),
      ].join('|');
      if (key !== this.atlasKey) {
        this.atlasKey = key;
        this.rebuildAtlas();
      }
    }

    step(dt) {
      const rate = Math.max(0, this.opts.speed) / SPEED_REF;
      const cw = Math.max(0.01, this.opts.handleSpread / 100);
      const ch = cw * CELL_ASPECT;
      const aspect = this.boxW / this.boxH;

      if (!this.hasPointer) {
        const band = (this.atlasRatioH * Math.max(8, this.drawFontPx())) / this.boxH;
        this.target.x += dt * SWEEP_RATE * rate;
        this.target.y = (1 - band) / 2 + SWEEP_BAND * band;
        if (this.target.x > 1.5) {
          this.target.x = -0.5;
          this.eased.x = -0.5;
        }
        this.sweepClock += dt;
        if (this.sweepClock >= RESNAP) {
          this.sweepClock = 0;
          this.snap(this.target.x * aspect, this.target.y, cw, ch);
        }
      } else {
        this.snap(this.target.x * aspect, this.target.y, cw, ch);
      }

      const damp = clamp((this.opts.damping / 100) * DAMP_REF * dt, 0, 1);
      this.eased.x += (this.target.x - this.eased.x) * damp;
      this.eased.y += (this.target.y - this.eased.y) * damp;

      this.driftT += dt * rate;
      for (let i = 0; i < HANDLES; i++) {
        const c = this.cells[i];
        const sx = Math.round(c.x / cw - 0.5);
        const sy = Math.round(c.y / ch - 0.5);
        const h1 = fract(Math.sin(sx * 127.1 + sy * 311.7) * 43758.5453);
        const h2 = fract(Math.sin(sx * 269.5 + sy * 183.3) * 43758.5453);
        this.verts[i].x =
          c.x + DRIFT_X * cw * Math.sin(this.driftT * DRIFT_RATE + h1 * Math.PI * 2);
        this.verts[i].y =
          c.y + DRIFT_Y * ch * Math.sin(this.driftT * DRIFT_RATE_Y + h2 * Math.PI * 2);
      }
    }

    writeLabels() {
      if (!this.opts.showLabels || !this.labelEls.length) return;
      const aspect = this.boxW / this.boxH;
      const half = this.opts.handleSize / 2;
      for (let i = 0; i < HANDLES; i++) {
        const el = this.labelEls[i];
        if (!el) continue;
        const bx = this.verts[i].x / aspect;
        const by = this.verts[i].y;
        const gx = Math.round(clamp(bx * 100, 0, 100));
        const gy = Math.round(clamp(by * 100, 0, 100));
        el.style.transform = `translate(${bx * this.boxW - half}px, ${
          (1 - by) * this.boxH - half
        }px)`;
        el.textContent = `${gx}, ${gy}`;
      }
    }

    draw() {
      const gl = this.gl;
      if (!gl) return;

      const tc = parseColor(this.opts.textColor, [0.859, 0.918, 0.992, 1]);
      const sc = parseColor(this.opts.shade, [0.035, 0.063, 0.102, 1]);
      const ac = parseColor(this.opts.accent, [0.22, 0.74, 0.97, 0.75]);

      gl.viewport(0, 0, this.bufW, this.bufH);
      gl.useProgram(this.prog);
      gl.uniform1i(this.U.map, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.uniform2f(this.U.res, this.boxW, this.boxH);
      const px = Math.max(8, this.drawFontPx());
      gl.uniform2f(this.U.atlas, this.atlasRatioW * px, this.atlasRatioH * px);
      gl.uniform2f(this.U.ptr, this.eased.x, this.eased.y);
      gl.uniform1f(this.U.reach, Math.max(1, this.opts.reach) / this.boxW);
      gl.uniform3f(this.U.text, tc[0], tc[1], tc[2]);
      gl.uniform3f(this.U.shade, sc[0], sc[1], sc[2]);
      gl.uniform4f(this.U.accent, ac[0], ac[1], ac[2], ac[3]);
      gl.uniform2f(this.U.v0, this.verts[0].x, this.verts[0].y);
      gl.uniform2f(this.U.v1, this.verts[1].x, this.verts[1].y);
      gl.uniform2f(this.U.v2, this.verts[2].x, this.verts[2].y);
      gl.uniform1f(this.U.half, this.opts.handleSize / 2 / this.boxH);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    loop(now) {
      if (!this.running || !this.alive) return;
      const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
      this.last = now;
      this.sync();
      this.step(dt);
      this.writeLabels();
      this.draw();
      this.raf = requestAnimationFrame(this.loop.bind(this));
    }

    start() {
      if (!this.raf && this.inViewport && !document.hidden) {
        this.last = 0;
        this.raf = requestAnimationFrame(this.loop.bind(this));
      }
    }

    destroy() {
      this.alive = false;
      this.running = false;
      if (this.raf) cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
      if (this.io) this.io.disconnect();
      document.removeEventListener('visibilitychange', this.onVis);
      if (this.host && this.onMove) {
        this.host.removeEventListener('pointermove', this.onMove);
        this.host.removeEventListener('pointerdown', this.onMove);
      }
    }
  }

  const instances = [];

  function initAll() {
    const containers = document.querySelectorAll('[data-vector-wordmark]');
    containers.forEach((container) => {
      if (!container.dataset.vectorWordmarkInitialized) {
        container.dataset.vectorWordmarkInitialized = 'true';
        const engine = new VectorWordmarkEngine(container, {
          text: container.getAttribute('data-text') || 'SAKSHAM',
          textColor: container.getAttribute('data-text-color') || '#FFFFFF',
          shade: container.getAttribute('data-shade') || '#38BDF8',
          accent: container.getAttribute('data-accent') || 'rgba(56, 189, 248, 0.75)',
          background: container.getAttribute('data-background') || 'transparent',
        });
        instances.push(engine);
      }
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAll);
    } else {
      setTimeout(initAll, 50);
    }
  }

  return {
    Engine: VectorWordmarkEngine,
    init: initAll,
    instances,
    create: (host, options) => new VectorWordmarkEngine(host, options),
  };
});

