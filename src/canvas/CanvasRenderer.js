/**
 * EZ Logic Pro - High-DPI Interactive 2D Canvas Engine
 */

import { COMPONENT_SPECS } from '../logic/Components.js';

export class CanvasRenderer {
  constructor(canvasElement, engine) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.engine = engine;

    // Viewport transform (Pan & Zoom)
    this.zoom = 1.0;
    this.panX = 100;
    this.panY = 100;
    this.gridSize = 20;
    this.snapToGrid = true;

    // Interaction states
    this.selectedCompIds = new Set();
    this.hoveredCompId = null;
    this.hoveredPin = null; // { compId, pinId, isInput, x, y }
    this.connectingWire = null; // { fromCompId, fromPinId, startX, startY, currentX, currentY }

    this.isDragging = false;
    this.isPanning = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.selectionBox = null; // { x1, y1, x2, y2 }

    this.initEvents();
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  exportPNGDataURL() {
    const dpr = window.devicePixelRatio || 1;
    const offscreen = document.createElement('canvas');
    offscreen.width = this.canvas.width;
    offscreen.height = this.canvas.height;
    const offCtx = offscreen.getContext('2d');

    // Fill solid professional dark background
    offCtx.fillStyle = '#0b0f19';
    offCtx.fillRect(0, 0, offscreen.width, offscreen.height);

    // Draw active canvas on top
    offCtx.drawImage(this.canvas, 0, 0);
    return offscreen.toDataURL('image/png');
  }

  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.panX) / this.zoom,
      y: (screenY - this.panY) / this.zoom
    };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: worldX * this.zoom + this.panX,
      y: worldY * this.zoom + this.panY
    };
  }

  snap(val) {
    return this.snapToGrid ? Math.round(val / this.gridSize) * this.gridSize : val;
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    if (window.ResizeObserver && this.canvas.parentElement) {
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(this.canvas.parentElement);
    }

    // Mouse Wheel Zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const mouse = this.screenToWorld(e.clientX - this.canvas.getBoundingClientRect().left, e.clientY - this.canvas.getBoundingClientRect().top);

      const newZoom = Math.max(0.3, Math.min(3.0, this.zoom * zoomFactor));
      this.panX -= mouse.x * (newZoom - this.zoom);
      this.panY -= mouse.y * (newZoom - this.zoom);
      this.zoom = newZoom;
      this.render();
    }, { passive: false });

    // Pointer down
    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPos = this.screenToWorld(screenX, screenY);

      // Middle click or Spacebar => Pan mode
      if (e.button === 1 || e.spaceKey || e.shiftKey && e.button === 0 && !this.hoveredPin && !this.hoveredCompId) {
        this.isPanning = true;
        this.dragStartX = screenX - this.panX;
        this.dragStartY = screenY - this.panY;
        this.canvas.style.cursor = 'grabbing';
        return;
      }

      if (e.button !== 0) return; // Left click only for interaction

      // 1. Clicked on a Pin => Start wire connection
      if (this.hoveredPin) {
        const pinPos = this.engine.getPinAbsolutePos(this.hoveredPin.compId, this.hoveredPin.pinId);
        this.connectingWire = {
          fromCompId: this.hoveredPin.compId,
          fromPinId: this.hoveredPin.pinId,
          isInput: this.hoveredPin.isInput,
          startX: pinPos.x,
          startY: pinPos.y,
          currentX: worldPos.x,
          currentY: worldPos.y
        };
        return;
      }

      // 2. Clicked on a Component
      if (this.hoveredCompId) {
        const comp = this.engine.getComponent(this.hoveredCompId);
        
        // Check interactive inputs (Switch click / Button press)
        if (comp.type === 'SWITCH') {
          this.engine.toggleInputState(comp.id);
        } else if (comp.type === 'BUTTON') {
          this.engine.setButtonState(comp.id, true);
        }

        if (!this.selectedCompIds.has(this.hoveredCompId)) {
          if (!e.ctrlKey && !e.metaKey) {
            this.selectedCompIds.clear();
          }
          this.selectedCompIds.add(this.hoveredCompId);
        }

        this.isDragging = true;
        this.dragStartWorldX = worldPos.x;
        this.dragStartWorldY = worldPos.y;

        // Store initial positions of ALL selected components for smooth relative dragging
        this.dragStartPositions = new Map();
        for (const id of this.selectedCompIds) {
          const c = this.engine.getComponent(id);
          if (c) {
            this.dragStartPositions.set(id, { x: c.x, y: c.y });
          }
        }

        this.render();
        return;
      }

      // 3. Clicked empty background => Selection box
      if (!e.ctrlKey && !e.metaKey) {
        this.selectedCompIds.clear();
      }
      this.selectionBox = { x1: worldPos.x, y1: worldPos.y, x2: worldPos.x, y2: worldPos.y };
      this.isDragging = true;
      this.render();
    });

    // Pointer move
    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPos = this.screenToWorld(screenX, screenY);

      if (this.isPanning) {
        this.panX = screenX - this.dragStartX;
        this.panY = screenY - this.dragStartY;
        this.render();
        return;
      }

      // Update wire drag preview
      if (this.connectingWire) {
        this.connectingWire.currentX = worldPos.x;
        this.connectingWire.currentY = worldPos.y;
        this.render();
        return;
      }

      // Selection box drag
      if (this.selectionBox) {
        this.selectionBox.x2 = worldPos.x;
        this.selectionBox.y2 = worldPos.y;

        const left = Math.min(this.selectionBox.x1, this.selectionBox.x2);
        const right = Math.max(this.selectionBox.x1, this.selectionBox.x2);
        const top = Math.min(this.selectionBox.y1, this.selectionBox.y2);
        const bottom = Math.max(this.selectionBox.y1, this.selectionBox.y2);

        this.selectedCompIds.clear();
        for (const comp of this.engine.components) {
          // Bounding Box Intersection (intuitive multi-select)
          if (comp.x + comp.width >= left && comp.x <= right &&
              comp.y + comp.height >= top && comp.y <= bottom) {
            this.selectedCompIds.add(comp.id);
          }
        }
        this.render();
        return;
      }

      // Component dragging
      if (this.isDragging && this.selectedCompIds.size > 0 && this.dragStartPositions) {
        const totalDx = worldPos.x - this.dragStartWorldX;
        const totalDy = worldPos.y - this.dragStartWorldY;

        for (const id of this.selectedCompIds) {
          const comp = this.engine.getComponent(id);
          const startPos = this.dragStartPositions.get(id);
          if (comp && startPos) {
            comp.x = this.snap(startPos.x + totalDx);
            comp.y = this.snap(startPos.y + totalDy);
          }
        }

        this.engine.step();
        this.render();
        return;
      }

      // Hover detection
      this.updateHoverStates(worldPos.x, worldPos.y);
    });

    // Pointer up
    this.canvas.addEventListener('pointerup', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPos = this.screenToWorld(screenX, screenY);

      if (this.isPanning) {
        this.isPanning = false;
        this.canvas.style.cursor = 'default';
        return;
      }

      // Complete wire connection
      if (this.connectingWire) {
        if (this.hoveredPin) {
          const srcIsInput = this.connectingWire.isInput;
          const destIsInput = this.hoveredPin.isInput;

          // Wire must connect an Output to an Input
          if (srcIsInput !== destIsInput) {
            const outPin = srcIsInput ? this.hoveredPin : this.connectingWire;
            const inPin = srcIsInput ? this.connectingWire : this.hoveredPin;

            this.engine.addWire(
              outPin.compId || outPin.fromCompId,
              outPin.pinId || outPin.fromPinId,
              inPin.compId || inPin.fromCompId,
              inPin.pinId || inPin.fromPinId
            );
          }
        }
        this.connectingWire = null;
        this.render();
      }

      // Button release state
      for (const id of this.selectedCompIds) {
        const comp = this.engine.getComponent(id);
        if (comp && comp.type === 'BUTTON') {
          this.engine.setButtonState(comp.id, false);
        }
      }

      this.isDragging = false;
      this.selectionBox = null;
      this.dragStartPositions = null;
      this.render();
    });
  }

  updateHoverStates(worldX, worldY) {
    let newHoveredPin = null;
    let newHoveredCompId = null;

    const pinRadius = 12;

    // Check pin hover
    for (const comp of this.engine.components) {
      // Check inputs
      for (const pin of comp.inputs) {
        const px = comp.x + pin.relX;
        const py = comp.y + pin.relY;
        if (Math.hypot(worldX - px, worldY - py) <= pinRadius) {
          newHoveredPin = { compId: comp.id, pinId: pin.id, isInput: true, x: px, y: py };
          break;
        }
      }

      if (!newHoveredPin) {
        // Check outputs
        for (const pin of comp.outputs) {
          const px = comp.x + pin.relX;
          const py = comp.y + pin.relY;
          if (Math.hypot(worldX - px, worldY - py) <= pinRadius) {
            newHoveredPin = { compId: comp.id, pinId: pin.id, isInput: false, x: px, y: py };
            break;
          }
        }
      }

      if (newHoveredPin) break;

      // Check component bounds
      if (worldX >= comp.x && worldX <= comp.x + comp.width &&
          worldY >= comp.y && worldY <= comp.y + comp.height) {
        newHoveredCompId = comp.id;
      }
    }

    if (this.hoveredPin !== newHoveredPin || this.hoveredCompId !== newHoveredCompId) {
      this.hoveredPin = newHoveredPin;
      this.hoveredCompId = newHoveredCompId;
      this.canvas.style.cursor = newHoveredPin ? 'crosshair' : (newHoveredCompId ? 'pointer' : 'default');
      this.render();
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    // Apply Viewport Transform
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    // 1. Render Background Grid
    this.renderGrid();

    // 2. Render Wires
    for (const wire of this.engine.wires) {
      this.renderWire(wire);
    }

    // Render Active Wire Connection Drag Preview
    if (this.connectingWire) {
      this.renderWirePreview(this.connectingWire);
    }

    // 3. Render Components
    for (const comp of this.engine.components) {
      this.renderComponent(comp);
    }

    // 4. Render Selection Box
    if (this.selectionBox) {
      const left = Math.min(this.selectionBox.x1, this.selectionBox.x2);
      const top = Math.min(this.selectionBox.y1, this.selectionBox.y2);
      const width = Math.abs(this.selectionBox.x2 - this.selectionBox.x1);
      const height = Math.abs(this.selectionBox.y2 - this.selectionBox.y1);

      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.fillRect(left, top, width, height);
      ctx.strokeRect(left, top, width, height);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  renderGrid() {
    const ctx = this.ctx;
    const step = this.zoom < 0.45 ? this.gridSize * 2 : this.gridSize;

    const startX = Math.floor((-this.panX / this.zoom) / step) * step - step;
    const startY = Math.floor((-this.panY / this.zoom) / step) * step - step;
    const endX = startX + (this.width / this.zoom) + step * 2;
    const endY = startY + (this.height / this.zoom) + step * 2;

    ctx.fillStyle = '#2d3748';
    for (let x = startX; x < endX; x += step) {
      for (let y = startY; y < endY; y += step) {
        ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
      }
    }
  }

  renderWire(wire) {
    const p1 = this.engine.getPinAbsolutePos(wire.fromCompId, wire.fromPinId);
    const p2 = this.engine.getPinAbsolutePos(wire.toCompId, wire.toPinId);
    if (!p1 || !p2) return;

    this.drawBezierWire(p1.x, p1.y, p2.x, p2.y, wire.value);
  }

  renderWirePreview(preview) {
    this.drawBezierWire(preview.startX, preview.startY, preview.currentX, preview.currentY, 1, true);
  }

  drawBezierWire(x1, y1, x2, y2, value, isDraft = false) {
    const ctx = this.ctx;
    const dx = Math.abs(x2 - x1) * 0.5;
    const cp1x = x1 + Math.max(30, dx);
    const cp1y = y1;
    const cp2x = x2 - Math.max(30, dx);
    const cp2y = y2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);

    if (isDraft) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    const isHigh = value === 1;
    ctx.strokeStyle = isHigh ? '#10b981' : '#4a5568';
    ctx.lineWidth = isHigh ? 3.5 : 2.5;

    if (isHigh) {
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  renderComponent(comp) {
    const ctx = this.ctx;
    const isSelected = this.selectedCompIds.has(comp.id);
    const isHovered = this.hoveredCompId === comp.id;

    ctx.save();
    ctx.translate(comp.x, comp.y);

    // Component background & container border
    ctx.fillStyle = '#161e2e';
    ctx.strokeStyle = isSelected ? '#3b82f6' : (isHovered ? '#60a5fa' : '#374151');
    ctx.lineWidth = isSelected ? 2.5 : 1.5;

    ctx.beginPath();
    ctx.roundRect(0, 0, comp.width, comp.height, 8);
    ctx.fill();
    ctx.stroke();

    // Render Gate Symbol / Icon or Custom Output Visuals
    this.renderComponentSymbol(comp);

    // Render Pins
    for (const pin of comp.inputs) {
      this.renderPin(pin, true, comp.id);
    }
    for (const pin of comp.outputs) {
      this.renderPin(pin, false, comp.id);
    }

    ctx.restore();
  }

  renderComponentSymbol(comp) {
    const ctx = this.ctx;
    const w = comp.width;
    const h = comp.height;

    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (comp.type === 'SWITCH') {
      const isOn = comp.state.value === 1;

      // Draw Switch Track at top half
      ctx.fillStyle = isOn ? '#10b981' : '#334155';
      ctx.beginPath();
      ctx.roundRect(8, 8, w - 16, 16, 8);
      ctx.fill();

      // Toggle Knob
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(isOn ? w - 16 : 16, 16, 6, 0, Math.PI * 2);
      ctx.fill();

      // Label Text Below Switch Track (Never Overlaps!)
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillText('SWITCH', w / 2, h - 10);

    } else if (comp.type === 'BUTTON') {
      const isPressed = comp.state.value === 1;

      // Draw Push Button Outer Ring & Cap
      ctx.fillStyle = isPressed ? '#e60012' : '#334155';
      ctx.beginPath();
      ctx.arc(w / 2, 16, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isPressed ? '#ffffff' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(w / 2, 16, 5, 0, Math.PI * 2);
      ctx.fill();

      // Label Text Below Button
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillText('BUTTON', w / 2, h - 10);

    } else if (comp.type === 'LED') {
      const inVal = comp.inputs[0]?.value || 0;
      const isLit = inVal === 1;

      ctx.beginPath();
      ctx.arc(w / 2, 16, 10, 0, Math.PI * 2);
      ctx.fillStyle = isLit ? (comp.state.color || '#10b981') : '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (isLit) {
        ctx.shadowColor = comp.state.color || '#10b981';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillText('LED', w / 2, h - 10);

    } else if (comp.type === 'HEX_DISPLAY') {
      const d0 = comp.inputs[0]?.value || 0;
      const d1 = comp.inputs[1]?.value || 0;
      const d2 = comp.inputs[2]?.value || 0;
      const d3 = comp.inputs[3]?.value || 0;
      const hexVal = (d3 << 3) | (d2 << 2) | (d1 << 1) | d0;

      ctx.fillStyle = '#020617';
      ctx.fillRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText(hexVal.toString(16).toUpperCase(), w / 2, h / 2);
    } else {
      // Standard Logic Gates & Modules: Centered Label Header
      ctx.fillText(comp.type, w / 2, h / 2);
    }
  }

  renderPin(pin, isInput, compId) {
    const ctx = this.ctx;
    const isHovered = this.hoveredPin && this.hoveredPin.compId === compId && this.hoveredPin.pinId === pin.id;
    const isHigh = pin.value === 1;

    ctx.beginPath();
    ctx.arc(pin.relX, pin.relY, isHovered ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isHigh ? '#10b981' : '#475569';
    ctx.strokeStyle = isHovered ? '#3b82f6' : '#020617';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Pin Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = isInput ? 'left' : 'right';
    ctx.fillText(pin.name, isInput ? pin.relX + 8 : pin.relX - 8, pin.relY);
  }
}
