/**
 * EZ Logic Pro - Timing Diagram / Oscilloscope Visualizer
 */

export class TimingDiagram {
  constructor(canvasElement, engine) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.engine = engine;
    this.history = {}; // { compId: [ { time, value } ] }
    this.maxSamples = 100;
    this.startTime = performance.now();
  }

  recordSample() {
    const now = (performance.now() - this.startTime) / 1000;

    for (const comp of this.engine.components) {
      if (['CLOCK', 'SWITCH', 'BUTTON', 'LED', 'PROBE'].includes(comp.type)) {
        if (!this.history[comp.id]) {
          this.history[comp.id] = [];
        }

        const val = comp.type === 'LED' || comp.type === 'PROBE' ? (comp.inputs[0]?.value || 0) : (comp.state.value || 0);

        const list = this.history[comp.id];
        // Append sample if value changed or periodic
        if (list.length === 0 || list[list.length - 1].value !== val || list.length < this.maxSamples) {
          list.push({ time: now, value: val });
          if (list.length > this.maxSamples) list.shift();
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    const trackedComps = this.engine.components.filter(c => ['CLOCK', 'SWITCH', 'BUTTON', 'LED', 'PROBE'].includes(c.type));
    if (trackedComps.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No signals to monitor. Add a Clock, Switch, or LED component.', w / 2, h / 2);
      return;
    }

    const rowHeight = Math.max(35, Math.floor(h / trackedComps.length));

    trackedComps.forEach((comp, idx) => {
      const topY = idx * rowHeight;
      const midY = topY + rowHeight / 2;
      const lowY = topY + rowHeight - 8;
      const highY = topY + 8;

      // Row separator
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, topY + rowHeight);
      ctx.lineTo(w, topY + rowHeight);
      ctx.stroke();

      // Signal Label
      ctx.fillStyle = '#38bdf8';
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(comp.label || comp.type, 10, midY);

      // Waveform line
      const samples = this.history[comp.id] || [];
      if (samples.length < 2) return;

      const graphLeft = 120;
      const graphWidth = w - graphLeft - 20;

      ctx.beginPath();
      ctx.strokeStyle = comp.type === 'LED' ? '#10b981' : '#a855f7';
      ctx.lineWidth = 2;

      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        const nextSample = samples[i + 1];

        const x = graphLeft + (i / this.maxSamples) * graphWidth;
        const y = sample.value === 1 ? highY : lowY;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        if (nextSample) {
          const nextX = graphLeft + ((i + 1) / this.maxSamples) * graphWidth;
          const nextY = nextSample.value === 1 ? highY : lowY;
          ctx.lineTo(nextX, y);
          ctx.lineTo(nextX, nextY);
        }
      }

      ctx.stroke();
    });
  }
}
