/**
 * EZ Logic Pro - Main Application Orchestrator & UI Handler
 */

import { CircuitEngine } from './logic/CircuitEngine.js';
import { CanvasRenderer } from './canvas/CanvasRenderer.js';
import { COMPONENT_CATEGORIES, COMPONENT_SPECS } from './logic/Components.js';
import { generateTruthTable } from './tools/TruthTableGenerator.js';
import { KMapSolver } from './tools/KMapSolver.js';
import { BooleanParser } from './tools/BooleanParser.js';
import { TimingDiagram } from './tools/TimingDiagram.js';
import { PRESETS } from './ui/Presets.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Core Engine & Canvas Renderer
  const canvasEl = document.getElementById('circuit-canvas');
  const engine = new CircuitEngine();
  const renderer = new CanvasRenderer(canvasEl, engine);

  // Setup HTML5 Drag and Drop on Canvas
  canvasEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  canvasEl.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (!type || !COMPONENT_SPECS[type]) return;

    const rect = canvasEl.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = renderer.screenToWorld(screenX, screenY);

    const spec = COMPONENT_SPECS[type];
    const dropX = renderer.snap(worldPos.x - (spec ? spec.width / 2 : 30));
    const dropY = renderer.snap(worldPos.y - (spec ? spec.height / 2 : 25));

    const newComp = engine.addComponent(type, dropX, dropY);
    renderer.selectedCompIds.clear();
    renderer.selectedCompIds.add(newComp.id);
    renderer.render();
  });

  // 2. Initialize Analytical Tools
  const kmapSolver = new KMapSolver(4);
  const timingCanvas = document.getElementById('timing-canvas');
  const timingDiagram = new TimingDiagram(timingCanvas, engine);

  // 3. Render Sidebar Component Cards
  renderSidebarPalette(engine, renderer);

  // 4. Load Preset Options into Dropdown
  renderPresetsDropdown(engine);

  // 5. Connect UI Toolbar Event Handlers
  setupToolbarEvents(engine, renderer);

  // 6. Connect Bottom Drawer & Analytical Tool Handlers
  setupDrawerAndTools(engine, renderer, kmapSolver, timingDiagram);

  // 7. Setup Keyboard Shortcuts
  setupKeyboardShortcuts(engine, renderer);

  // 8. Start Main Animation & Clock Loop
  function animationLoop(timestamp) {
    engine.updateClocks(timestamp);
    timingDiagram.recordSample();
    timingDiagram.render();
    requestAnimationFrame(animationLoop);
  }
  requestAnimationFrame(animationLoop);

  // Load default preset (Half Adder) to start with a working circuit
  PRESETS[0].load(engine);
  renderer.render();
});

function renderSidebarPalette(engine, renderer) {
  const container = document.getElementById('palette-categories');
  container.innerHTML = '';

  COMPONENT_CATEGORIES.forEach(cat => {
    const groupEl = document.createElement('div');
    groupEl.className = 'category-group';

    const titleEl = document.createElement('h4');
    titleEl.textContent = cat.name;
    groupEl.appendChild(titleEl);

    const gridEl = document.createElement('div');
    gridEl.className = 'palette-grid';

    cat.items.forEach(type => {
      const spec = COMPONENT_SPECS[type];
      if (!spec) return;

      const card = document.createElement('div');
      card.className = 'palette-card';
      card.dataset.type = type;
      card.innerHTML = `<span class="palette-card-title">${type}</span>`;
      card.setAttribute('draggable', 'true');

      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', type);
        e.dataTransfer.effectAllowed = 'copy';
      });

      card.addEventListener('click', () => {
        const center = renderer.screenToWorld(renderer.width / 2, renderer.height / 2);
        const spec = COMPONENT_SPECS[type];
        const compX = renderer.snap(center.x - (spec ? spec.width / 2 : 30));
        const compY = renderer.snap(center.y - (spec ? spec.height / 2 : 25));
        const newComp = engine.addComponent(type, compX, compY);
        renderer.selectedCompIds.clear();
        renderer.selectedCompIds.add(newComp.id);
        renderer.render();
      });

      gridEl.appendChild(card);
    });

    groupEl.appendChild(gridEl);
    container.appendChild(groupEl);
  });

  // Search filter
  const searchInput = document.getElementById('search-components');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.palette-card').forEach(card => {
      const match = card.dataset.type.toLowerCase().includes(query);
      card.style.display = match ? 'flex' : 'none';
    });
  });
}

function renderPresetsDropdown(engine) {
  const select = document.getElementById('preset-select');
  PRESETS.forEach(preset => {
    const opt = document.createElement('option');
    opt.value = preset.id;
    opt.textContent = `⚡ ${preset.title}`;
    select.appendChild(opt);
  });

  select.addEventListener('change', (e) => {
    const found = PRESETS.find(p => p.id === e.target.value);
    if (found) {
      found.load(engine);
    }
  });
}

function setupToolbarEvents(engine, renderer) {
  document.getElementById('btn-undo').addEventListener('click', () => {
    engine.undo();
    renderer.render();
  });

  document.getElementById('btn-redo').addEventListener('click', () => {
    engine.redo();
    renderer.render();
  });

  document.getElementById('btn-clear').addEventListener('click', () => {
    engine.clear();
    renderer.render();
  });

  // Snap grid
  const snapBtn = document.getElementById('btn-snap');
  snapBtn.addEventListener('click', () => {
    renderer.snapToGrid = !renderer.snapToGrid;
    snapBtn.classList.toggle('active', renderer.snapToGrid);
  });

  // Zoom controls
  const updateZoomLabel = () => {
    document.getElementById('zoom-level').textContent = `${Math.round(renderer.zoom * 100)}%`;
  };

  document.getElementById('btn-zoom-in').addEventListener('click', () => {
    renderer.zoom = Math.min(3.0, renderer.zoom * 1.2);
    updateZoomLabel();
    renderer.render();
  });

  document.getElementById('btn-zoom-out').addEventListener('click', () => {
    renderer.zoom = Math.max(0.3, renderer.zoom / 1.2);
    updateZoomLabel();
    renderer.render();
  });

  document.getElementById('btn-zoom-reset').addEventListener('click', () => {
    renderer.zoom = 1.0;
    renderer.panX = 100;
    renderer.panY = 100;
    updateZoomLabel();
    renderer.render();
  });

  // Play / Pause Simulation
  const simBtn = document.getElementById('btn-play-pause');
  const simText = document.getElementById('sim-status-text');
  simBtn.addEventListener('click', () => {
    engine.isPaused = !engine.isPaused;
    simText.textContent = engine.isPaused ? 'Paused' : 'Simulating';
    simBtn.classList.toggle('btn-primary', !engine.isPaused);
    simBtn.classList.toggle('btn-secondary', engine.isPaused);
  });

  // Export JSON
  document.getElementById('btn-export-json').addEventListener('click', () => {
    const jsonStr = engine.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mario_logic_circuit.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Import JSON
  const fileInput = document.getElementById('file-import-input');
  document.getElementById('btn-import-json').addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        engine.importJSON(evt.target.result);
        renderer.render();
      };
      reader.readAsText(file);
    }
  });

  // Screenshot PNG
  document.getElementById('btn-screenshot').addEventListener('click', () => {
    renderer.render();
    const dataUrl = renderer.exportPNGDataURL();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'mario_logic_circuit.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // Export PDF / Print Circuit Sheet
  const pdfBtn = document.getElementById('btn-export-pdf');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      renderer.render();
      const imgData = renderer.exportPNGDataURL();
      const ttResult = generateTruthTable(engine);

      let ttHtml = '';
      if (ttResult.rows && ttResult.rows.length > 0) {
        ttHtml += '<h3 style="margin-top:24px; font-family:sans-serif; color:#0f172a;">Circuit Truth Table</h3>';
        ttHtml += '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; font-family:sans-serif; width:100%; text-align:center;">';
        ttHtml += '<tr style="background:#f1f5f9;">';
        ttResult.headers.inputs.forEach(h => ttHtml += `<th>${h}</th>`);
        ttResult.headers.outputs.forEach(h => ttHtml += `<th>${h}</th>`);
        ttHtml += '</tr>';
        ttResult.rows.forEach(r => {
          ttHtml += '<tr>';
          r.inputs.forEach(v => ttHtml += `<td>${v}</td>`);
          r.outputs.forEach(v => ttHtml += `<td>${v}</td>`);
          ttHtml += '</tr>';
        });
        ttHtml += '</table>';
      }

      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Mario Logic & Algo - Circuit Export</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #0f172a; }
              h1 { font-size: 24px; margin-bottom: 4px; color: #ef4444; }
              .subtitle { color: #64748b; font-size: 14px; margin-bottom: 20px; }
              .circuit-img { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 20px; background: #0b0f19; }
            </style>
          </head>
          <body>
            <h1>MARIO LOGIC & ALGO</h1>
            <div class="subtitle">Interactive Logic Circuit & Truth Table Export Sheet — ${new Date().toLocaleDateString()}</div>
            <img src="${imgData}" class="circuit-img" />
            ${ttHtml}
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
          </html>
        `);
        printWin.document.close();
      }
    });
  }

  // Modal Help
  const modal = document.getElementById('help-modal');
  document.getElementById('btn-help').addEventListener('click', () => modal.showModal());
  document.getElementById('btn-close-modal').addEventListener('click', () => modal.close());

  // Engine state listener updates UI
  engine.onChange(() => {
    renderer.render();
    updateSelectedDeleteButton(renderer);
  });
}

function updateSelectedDeleteButton(renderer) {
  const deleteBtn = document.getElementById('btn-delete-selected');
  const selectedCount = document.getElementById('selected-count');
  const count = renderer.selectedCompIds.size;
  selectedCount.textContent = count;
  deleteBtn.classList.toggle('hidden', count === 0);
}

function setupDrawerAndTools(engine, renderer, kmapSolver, timingDiagram) {
  const sidebar = document.querySelector('.sidebar');
  const toggleSidebarBtn = document.getElementById('btn-toggle-sidebar');
  if (toggleSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      setTimeout(() => renderer.resize(), 270);
    });
  }

  const drawer = document.getElementById('bottom-drawer');
  const toggleBtn = document.getElementById('btn-toggle-drawer');
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  toggleBtn.addEventListener('click', () => {
    drawer.classList.toggle('collapsed');
    setTimeout(() => renderer.resize(), 320);
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `tab-${tab.dataset.tab}`;
      document.getElementById(targetId).classList.add('active');
      drawer.classList.remove('collapsed');
      setTimeout(() => renderer.resize(), 320);

      if (tab.dataset.tab === 'truth-table') {
        document.getElementById('btn-generate-table').click();
      } else if (tab.dataset.tab === 'kmap') {
        renderKMapGrid(kmapSolver, engine);
      }
    });
  });

  // 1. Truth Table Generation
  document.getElementById('btn-generate-table').addEventListener('click', () => {
    const result = generateTruthTable(engine);
    const container = document.getElementById('truth-table-container');

    if (result.message) {
      container.innerHTML = `<p class="placeholder-text">${result.message}</p>`;
      return;
    }

    let html = '<table class="truth-table"><thead><tr>';
    result.headers.inputs.forEach(h => html += `<th style="color:#38bdf8;">${h}</th>`);
    result.headers.outputs.forEach(h => html += `<th style="color:#10b981;">${h}</th>`);
    html += '</tr></thead><tbody>';

    result.rows.forEach(row => {
      html += '<tr>';
      row.inputs.forEach(val => html += `<td class="${val ? 'val-high' : 'val-low'}">${val}</td>`);
      row.outputs.forEach(val => html += `<td class="${val ? 'val-high' : 'val-low'}">${val}</td>`);
      html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  });

  // CSV Export
  document.getElementById('btn-export-csv').addEventListener('click', () => {
    const result = generateTruthTable(engine);
    if (!result.rows || result.rows.length === 0) return;

    let csv = [...result.headers.inputs, ...result.headers.outputs].join(',') + '\n';
    result.rows.forEach(r => {
      csv += [...r.inputs, ...r.outputs].join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mario_logic_truth_table.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // 2. K-Map Solver UI
  const kmapVarsSelect = document.getElementById('kmap-vars-select');
  kmapVarsSelect.addEventListener('change', (e) => {
    kmapSolver.setNumVars(parseInt(e.target.value, 10));
    renderKMapGrid(kmapSolver, engine);
  });

  document.getElementById('btn-kmap-build').addEventListener('click', () => {
    kmapSolver.generateCircuitOnCanvas(engine);
    renderer.render();
  });

  // 3. Boolean Parser
  document.getElementById('btn-parse-boolean').addEventListener('click', () => {
    const inputStr = document.getElementById('boolean-input').value;
    const statusEl = document.getElementById('boolean-status');
    try {
      const tokens = BooleanParser.tokenize(inputStr);
      const ast = BooleanParser.parse(tokens);
      BooleanParser.buildCircuitFromAST(ast, engine);
      renderer.render();
      statusEl.textContent = '✅ Circuit built successfully on canvas!';
      statusEl.style.color = '#10b981';
    } catch (err) {
      statusEl.textContent = `❌ Error: ${err.message}`;
      statusEl.style.color = '#ef4444';
    }
  });

  renderKMapGrid(kmapSolver, engine);
}

function renderKMapGrid(kmapSolver, engine) {
  const container = document.getElementById('kmap-grid-wrapper');
  const sopOutput = document.getElementById('kmap-sop-output');
  const mapping = kmapSolver.getGridMapping();

  let html = '<table class="kmap-grid"><thead><tr><th>' + mapping.rowVars.join('') + ' \\ ' + mapping.colVars.join('') + '</th>';
  mapping.colLabels.forEach(col => html += `<th>${col}</th>`);
  html += '</tr></thead><tbody>';

  mapping.map.forEach((rowIndices, rIdx) => {
    html += `<tr><th>${mapping.rowLabels[rIdx]}</th>`;
    rowIndices.forEach(mintermIdx => {
      const val = kmapSolver.minterms[mintermIdx];
      const displayVal = val === 'X' ? 'X' : val;
      html += `<td class="kmap-cell" data-index="${mintermIdx}">${displayVal}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  container.innerHTML = html;

  // Add cell toggle handlers
  container.querySelectorAll('.kmap-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const idx = parseInt(cell.dataset.index, 10);
      kmapSolver.toggleMinterm(idx);
      renderKMapGrid(kmapSolver, engine);
    });
  });

  // Compute SOP
  const res = kmapSolver.solveSOP();
  sopOutput.textContent = `F(${kmapSolver.varNames.join(', ')}) = ${res.sop}`;
}

function setupKeyboardShortcuts(engine, renderer) {
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (renderer.selectedCompIds.size > 0) {
        engine.saveHistory();
        for (const id of renderer.selectedCompIds) {
          engine.components = engine.components.filter(c => c.id !== id);
          engine.wires = engine.wires.filter(w => w.fromCompId !== id && w.toCompId !== id);
        }
        renderer.selectedCompIds.clear();
        engine.step();
        renderer.render();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      engine.undo();
      renderer.render();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      engine.redo();
      renderer.render();
    }
  });

  document.getElementById('btn-delete-selected').addEventListener('click', () => {
    if (renderer.selectedCompIds.size > 0) {
      engine.saveHistory();
      for (const id of renderer.selectedCompIds) {
        engine.components = engine.components.filter(c => c.id !== id);
        engine.wires = engine.wires.filter(w => w.fromCompId !== id && w.toCompId !== id);
      }
      renderer.selectedCompIds.clear();
      engine.step();
      renderer.render();
    }
  });
}
