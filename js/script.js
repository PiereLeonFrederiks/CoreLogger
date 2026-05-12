const layers = [];

// Soil lookup tables — populated at load time from data/soilData.json
let SOIL_MAINS     = {};
let SOIL_MODIFIERS = {};

window.onload = async function() {
    // ── Load external soil data ───────────────────────────────────────────────
    try {
      
        const res  = await fetch('../data/soilData.json'); 
        const data = await res.json();

        SOIL_MAINS     = data.soilMains;
        SOIL_MODIFIERS = data.soilModifiers;

        const colorSelect = document.getElementById('soilColor');
        data.colors.forEach(color => {
            const option = document.createElement('option');
            option.value = color.hex;
            option.text  = color.name;
            option.style.backgroundColor = color.hex;
            option.style.color = isDark(color.hex) ? 'white' : 'black';
            colorSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Fehler beim Laden von soilData.json:', err);
        alert('Bodendaten konnten nicht geladen werden.');
    }

    // ── Table delete handler ──────────────────────────────────────────────────
    document.querySelector("#logTable tbody").addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-delete');
        if (!btn) return;
        const index = parseInt(btn.dataset.index, 10);
        if (isNaN(index)) return;
        if (confirm("Möchten Sie diese Schicht wirklich entfernen?")) {
            layers.splice(index, 1);
            updateTable();
            drawGraph();
        }
    });
};


function translateSoil(desc) {
    const d = desc.toLowerCase();
    let main = "-";
    let mainPos = -1;
    let modifiers = [];

  
    for (const [key, val] of Object.entries(SOIL_MAINS)) {
        const lastIndex = d.lastIndexOf(key);
        if (lastIndex > mainPos) {
            mainPos = lastIndex;
            main = val;
        }
    }

  
    for (const [key, val] of Object.entries(SOIL_MODIFIERS)) {
        if (d.includes(key)) {
            modifiers.push(val);
        }
    }


    modifiers = [...new Set(modifiers)].sort();
    
    if (main === "-") return "-";
    return modifiers.length > 0 ? `${main}(${modifiers.join(',')})` : main;
}

function addLayer() {
    const id = document.getElementById('coreId').value || "N/A";
    const from = parseFloat(document.getElementById('depthFrom').value);
    const to = parseFloat(document.getElementById('depthTo').value);
    const hexColor = document.getElementById('soilColor').value;
    const desc = document.getElementById('soilDesc').value;
    
    const mDepth = parseFloat(document.getElementById('markerDepth').value);
    const mLabel = document.getElementById('markerLabel').value.trim();

    if (isNaN(from) || isNaN(to) || !desc) {
        alert("Bitte Tiefe und Beschreibung ausfüllen.");
        return;
    }

    const newMarker = (!isNaN(mDepth) && mLabel) ? { depth: mDepth, label: mLabel } : null;

    const layer = { 
        id, depthFrom: from, depthTo: to, 
        color: hexColor, 
        officialDesc: translateSoil(desc), 
        originalDesc: desc, 
        markers: newMarker ? [newMarker] : []
    };
    
    layers.push(layer);
    updateTable();
    drawGraph();
    
   
    document.getElementById('depthFrom').value = to; 
    document.getElementById('depthTo').value = "";
    document.getElementById('soilDesc').value = "";
    document.getElementById('markerDepth').value = "";
    document.getElementById('markerLabel').value = "";
    document.getElementById('depthTo').focus();
}

function updateTable() {
    const tbody = document.querySelector("#logTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    layers.forEach((l, index) => {
        const markersHtml = l.markers.map(m => 
            `<div class="marker-tag">● ${m.label} @ ${m.depth}m</div>`
        ).join("");
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${l.id}</td>
            <td>${l.depthFrom.toFixed(2)}-${l.depthTo.toFixed(2)}m</td>
            <td style="background-color:${l.color}; color:${isDark(l.color) ? 'white' : 'black'}; text-align:center; font-family:monospace;">
                ${l.color}
            </td>
            <td><strong>${l.officialDesc}</strong></td>
            <td>${l.originalDesc}${markersHtml}</td>
            <td>
                <button class="btn-delete" data-index="${index}" title="Löschen">✖</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Hilfsfunktion für Textkontrast
function isDark(color) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
}

// ... (Rest der drawGraph() und Export-Funktionen bleibt gleich wie in Ihrem Original)
// ─── Graph drawing ────────────────────────────────────────────────────────────

const SCALE = 2000;

// Minimum pixel gap between two labels on the same side before we stagger them
const MIN_LABEL_GAP = 14;

/**
 * Resolve vertical positions for a set of labels so none overlap.
 * @param {Array<{idealY: number, text: string}>} items
 * @param {number} lineHeight  – font size + padding
 * @returns {Array<number>}  – resolved Y positions (same order as items)
 */
function resolveLabels(items, lineHeight) {
    if (items.length === 0) return [];
    // Sort by idealY, keep original index so we can map back
    const sorted = items.map((item, i) => ({ ...item, origIndex: i }))
                        .sort((a, b) => a.idealY - b.idealY);

    // Forward pass: push down
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const cur  = sorted[i];
        if (cur.idealY < prev.idealY + lineHeight) {
            cur.idealY = prev.idealY + lineHeight;
        }
    }

    // Restore original order
    const result = new Array(items.length);
    sorted.forEach(item => { result[item.origIndex] = item.idealY; });
    return result;
}

function drawGraph() {
    const canvas = document.getElementById('coreCanvas');
    const ctx = canvas.getContext('2d');
    if (layers.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    const totalDepth = Math.max(...layers.map(l => l.depthTo));

    // ── Layout constants ──────────────────────────────────────────────────────
    // Left zone layout (left → right):
    //   [depth label 60px] [gap 8px] [tick 6px] [core]
    // Right zone:
    //   [core] [gap 10px] [soil label + markers 180px]
    const PAD_TOP     = 30;
    const PAD_BOTTOM  = 50;
    const DEPTH_LABEL_W = 60;   // fixed column for "0.00 m" text
    const TICK_W        = 6;
    const GAP_L         = 8;
    const PAD_LEFT      = DEPTH_LABEL_W + GAP_L + TICK_W;  // = 74
    const PAD_RIGHT     = 200;
    const CORE_W        = 80;

    canvas.width  = PAD_LEFT + CORE_W + PAD_RIGHT;   // 354 – always enough
    canvas.height = totalDepth * SCALE + PAD_TOP + PAD_BOTTOM;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const coreX = PAD_LEFT;  // left edge of the core column

    // ── Draw layers ───────────────────────────────────────────────────────────
    layers.forEach(layer => {
        const yTop   = layer.depthFrom * SCALE + PAD_TOP;
        const height = (layer.depthTo - layer.depthFrom) * SCALE;
        ctx.fillStyle   = layer.color;
        ctx.fillRect(coreX, yTop, CORE_W, height);
        ctx.strokeStyle = "#2c3e50";
        ctx.lineWidth   = 1;
        ctx.strokeRect(coreX, yTop, CORE_W, height);
    });

    // ── Left axis: depth labels, ticks, and thickness per layer ──────────────
    //
    // Each layer gets:
    //   • a depth label at yTop  (e.g. "0.00 m")
    //   • a depth label at yBot  (only drawn for the last layer; others share
    //     their yBot with the next layer's yTop)
    //   • a thickness label centred in the layer zone, left of the depth column
    //
    // We collect ALL boundary labels first, resolve overlaps, then draw.

    const boundarySet = new Map();
    layers.forEach(layer => {
        boundarySet.set(layer.depthFrom, layer.depthFrom * SCALE + PAD_TOP);
        boundarySet.set(layer.depthTo,   layer.depthTo   * SCALE + PAD_TOP);
    });
    const boundaries = Array.from(boundarySet.entries()).sort((a, b) => a[0] - b[0]);

    // Resolve overlap — minimum 14px between labels
    const labelItems = boundaries.map(([depth, y]) => ({ idealY: y, text: `${depth.toFixed(2)} m` }));
    const resolvedY  = resolveLabels(labelItems, 14);

    // Draw ticks + depth labels
    boundaries.forEach(([depth, tickY], i) => {
        const labelY = resolvedY[i];

        // Tick on core left edge
        ctx.strokeStyle = "#2c3e50";
        ctx.lineWidth   = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(coreX - TICK_W, tickY);
        ctx.lineTo(coreX,          tickY);
        ctx.stroke();

        // Thin leader line when label has been pushed from its tick
        if (Math.abs(labelY - tickY) > 3) {
            ctx.strokeStyle = "#b0b8c8";
            ctx.lineWidth   = 0.6;
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            ctx.moveTo(coreX - TICK_W - 1, tickY);
            ctx.lineTo(coreX - TICK_W - 3, labelY - 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Depth label — right-aligned inside the fixed DEPTH_LABEL_W column
        ctx.fillStyle = "#2d3748";
        ctx.font      = "11px 'Courier New', monospace";
        ctx.textAlign = "right";
        ctx.fillText(`${depth.toFixed(2)} m`, DEPTH_LABEL_W, labelY + 1);
    });

    // Thickness label — centred vertically in each layer, placed in the
    // gap between the depth-label column and the tick (small but readable).
    // We draw it as plain horizontal text; no rotation, no squishing.
    layers.forEach(layer => {
        const yTop   = layer.depthFrom * SCALE + PAD_TOP;
        const yBot   = layer.depthTo   * SCALE + PAD_TOP;
        const height = yBot - yTop;
        const midY   = yTop + height / 2;
        const thick  = (layer.depthTo - layer.depthFrom).toFixed(2);

        if (height < 10) return; // too thin to annotate

        // Small "Δ X.XX m" label right-aligned just before the tick gap
        ctx.fillStyle = "#94a3b8";
        ctx.font      = "bold 9px 'Courier New', monospace";
        ctx.textAlign = "right";
        ctx.fillText(`Δ${thick}m`, DEPTH_LABEL_W - 2, midY + 4);
    });

    // ── Right side: soil class + description labels ───────────────────────────
    // Collect right-side label positions and resolve overlaps
    const rightLabelItems = layers.map(layer => {
        const yTop   = layer.depthFrom * SCALE + PAD_TOP;
        const height = (layer.depthTo - layer.depthFrom) * SCALE;
        return {
            idealY: yTop + height / 2,
            text: layer.officialDesc
        };
    });
    const resolvedRight = resolveLabels(rightLabelItems, 16);

    layers.forEach((layer, i) => {
        const yTop   = layer.depthFrom * SCALE + PAD_TOP;
        const height = (layer.depthTo - layer.depthFrom) * SCALE;
        const midY   = yTop + height / 2;
        const labelY = resolvedRight[i];
        const labelX = coreX + CORE_W + 12;

        // Leader line from core edge to label if shifted
        if (Math.abs(labelY - midY) > 4) {
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth   = 0.5;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(coreX + CORE_W + 2, midY);
            ctx.lineTo(labelX - 2, labelY);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Soil class badge
        ctx.font      = "bold 12px sans-serif";
        ctx.fillStyle = "#0f172a";
        ctx.textAlign = "left";
        ctx.fillText(layer.officialDesc, labelX, labelY + 4);
    });

    // ── Markers ────────────────────────────────────────────────────────────────
    layers.forEach(layer => {
        layer.markers.forEach(marker => {
            const yMarker = marker.depth * SCALE + PAD_TOP;

            // Horizontal dashed line across core
            ctx.strokeStyle = "rgba(200,0,0,0.45)";
            ctx.lineWidth   = 0.8;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(coreX, yMarker);
            ctx.lineTo(coreX + CORE_W, yMarker);
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrow triangle
            ctx.fillStyle = "#cc0000";
            ctx.beginPath();
            ctx.moveTo(coreX + CORE_W,      yMarker);
            ctx.lineTo(coreX + CORE_W + 14, yMarker - 5);
            ctx.lineTo(coreX + CORE_W + 14, yMarker + 5);
            ctx.fill();

            // Label
            ctx.fillStyle   = "#cc0000";
            ctx.font        = "italic 10px sans-serif";
            ctx.textAlign   = "left";
            ctx.fillText(marker.label, coreX + CORE_W + 18, yMarker + 4);
        });
    });

    // ── Bottom depth label ─────────────────────────────────────────────────────
    const yBottom = totalDepth * SCALE + PAD_TOP;
    ctx.fillStyle = "#2d3748";
    ctx.font      = "bold 11px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`↕ ${totalDepth.toFixed(2)} m Gesamt`, coreX + CORE_W / 2, yBottom + 22);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function isDark(color) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
}

function copyToClipboard() {
    let tsv = "ID\tVon\tBis\tColor\tClass\tDesc\tMarker\n";
    layers.forEach(l => {
        const m = l.markers.length > 0
            ? l.markers.map(m => `${m.label}(${m.depth})`).join("; ")
            : "-";
        tsv += `${l.id}\t${l.depthFrom}\t${l.depthTo}\t${l.color}\t${l.officialDesc}\t${l.originalDesc}\t${m}\n`;
    });
    navigator.clipboard.writeText(tsv).then(() => alert("TSV kopiert!"));
}

function exportImage(format) {
    const canvas = document.getElementById('coreCanvas');
    const link = document.createElement('a');
    link.download = `core-log.${format}`;
    link.href = canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png');
    link.click();
}

function exportSVG() {
    alert("SVG-Export ist noch nicht implementiert.");
}
