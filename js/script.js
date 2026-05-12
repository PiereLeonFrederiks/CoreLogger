const layers = [];

// Vollständige Farbliste basierend auf Munsell
const SOIL_COLOR_LIST = [
    { name: "Schwarz", hex: "#211f1e" },
    { name: "Sehr dunkles Braun", hex: "#2c2621" },
    { name: "Sehr dunkles Grau", hex: "#433f3c" },
    { name: "Sehr dunkles Graubraun", hex: "#4b443b" },
    { name: "Dunkelbraun", hex: "#4e4131" },
    { name: "Dunkles Graubraun", hex: "#645b50" },
    { name: "Dunkelbraun (alt)", hex: "#675949" },
    { name: "Dunkelgelblichbraun", hex: "#69563c" },
    { name: "Braun", hex: "#857766" },
    { name: "Gelblichbraun", hex: "#877353" },
    { name: "Hellgelblichbraun", hex: "#a79273" },
    { name: "Hellgrau", hex: "#bcb6ad" },
    { name: "Weiß", hex: "#d6d1c9" },
    { name: "Schwarz (organisch)", hex: "#231f20" },
    { name: "Dunkelbraun (lehmig)", hex: "#4d3f33" },
    { name: "Kräftiges Braun", hex: "#7a593e" },
    { name: "Dunkelrötlichbraun", hex: "#503932" },
    { name: "Rötlichbraun", hex: "#7e5241" },
    { name: "Gelblichrot", hex: "#a15b35" },
    { name: "Dunkelrot", hex: "#662a22" },
    { name: "Hellolivbraun", hex: "#8d7f57" },
    { name: "Olivgrau", hex: "#8b8773" },
    { name: "Dunkelgrau", hex: "#616363" },
    { name: "Grüngrau", hex: "#7a8279" },
    { name: "Blaugrau", hex: "#778385" }
];

window.onload = function() {
    const colorSelect = document.getElementById('soilColor');
    SOIL_COLOR_LIST.forEach(color => {
        let option = document.createElement('option');
        option.value = color.hex;
        option.text = color.name;
        option.style.backgroundColor = color.hex;
        option.style.color = isDark(color.hex) ? 'white' : 'black';
        colorSelect.appendChild(option);
    });

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
    let modifiers = [];
    const mains = { 'ton': 'T', 'schluff': 'U', 'lehm': 'L', 'sand': 'S', 'kies': 'G', 'torf': 'H' };
    for (let key in mains) { if (d.split(' ').pop().includes(key)) { main = mains[key]; break; } }
    const mods = { 'tonig': 't', 'schluffig': 'u', 'sandig': 's', 'kiesig': 'g', 'humos': 'h', 'kalk': 'ca' };
    for (let key in mods) { if (d.includes(key)) modifiers.push(mods[key]); }
    modifiers = [...new Set(modifiers)].sort();
    return main === "-" ? "-" : (modifiers.length > 0 ? `${main}(${modifiers.join(',')})` : main);
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

function addExtraMarker() {
    if (layers.length === 0) {
        alert("Bitte zuerst eine Schicht erstellen.");
        return;
    }
    const mDepth = parseFloat(document.getElementById('markerDepth').value);
    const mLabel = document.getElementById('markerLabel').value.trim();

    if (isNaN(mDepth) || !mLabel) {
        alert("Bitte Tiefe und Label für den zusätzlichen Marker angeben.");
        return;
    }

    layers[layers.length - 1].markers.push({ depth: mDepth, label: mLabel });
    
    updateTable();
    drawGraph();
    
    document.getElementById('markerDepth').value = "";
    document.getElementById('markerLabel').value = "";
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
            <td style="background-color:${l.color}; color:${isDark(l.color) ? 'white' : 'black'}; text-align:center;">
                ${l.color}
            </td>
            <td><strong>${l.officialDesc}</strong></td>
            <td>${l.originalDesc}${markersHtml}</td>
            <td>
                <button class="btn-delete" data-index="${index}" title="Löschen">
                    ✖
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

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

    // Layout constants
    const PAD_TOP    = 30;
    const PAD_BOTTOM = 40;
    const PAD_LEFT   = 90;   // room for left-side depth labels
    const PAD_RIGHT  = 200;  // room for right-side soil labels + markers
    const CORE_W     = 80;

    canvas.width  = PAD_LEFT + CORE_W + PAD_RIGHT;
    canvas.height = totalDepth * SCALE + PAD_TOP + PAD_BOTTOM;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const coreX = PAD_LEFT;

    // ── Collect label data for left axis ─────────────────────────────────────
    // We show: depthFrom at top of each layer, depthTo at bottom of the LAST layer
    // For thickness we render it centred on the layer with a bracket.

    // Build list of unique boundary labels (from/to depths)
    const boundarySet = new Map(); // depth -> pixel Y
    layers.forEach(layer => {
        const yTop = layer.depthFrom * SCALE + PAD_TOP;
        const yBot = layer.depthTo   * SCALE + PAD_TOP;
        boundarySet.set(layer.depthFrom, yTop);
        boundarySet.set(layer.depthTo,   yBot);
    });

    // Sort boundaries
    const boundaries = Array.from(boundarySet.entries())
        .sort((a, b) => a[0] - b[0]);

    // Resolve overlapping labels (font ~11px, give 13px per label)
    const labelItems = boundaries.map(([depth, y]) => ({
        idealY: y,
        text: `${depth.toFixed(2)} m`
    }));
    const resolvedY = resolveLabels(labelItems, 13);

    // ── Draw layers ───────────────────────────────────────────────────────────
    layers.forEach(layer => {
        const yTop   = layer.depthFrom * SCALE + PAD_TOP;
        const height = (layer.depthTo - layer.depthFrom) * SCALE;

        ctx.fillStyle = layer.color;
        ctx.fillRect(coreX, yTop, CORE_W, height);
        ctx.strokeStyle = "#2c3e50";
        ctx.lineWidth   = 1;
        ctx.strokeRect(coreX, yTop, CORE_W, height);
    });

    // ── Left axis: depth labels + tick marks ──────────────────────────────────
    ctx.font      = "11px 'Courier New', monospace";
    ctx.fillStyle = "#2d3748";

    boundaries.forEach(([depth, idealY], i) => {
        const resolvedLabelY = resolvedY[i];

        // Tick mark on the core left edge
        ctx.strokeStyle = "#2c3e50";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(coreX - 4, idealY);
        ctx.lineTo(coreX,     idealY);
        ctx.stroke();

        // Leader line if label was pushed away from tick
        if (Math.abs(resolvedLabelY - idealY) > 2) {
            ctx.strokeStyle = "#aab";
            ctx.lineWidth   = 0.5;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(coreX - 5, idealY);
            ctx.lineTo(coreX - 10, resolvedLabelY - 1);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Label (right-aligned to coreX - 14)
        ctx.fillStyle = "#2d3748";
        ctx.textAlign = "right";
        ctx.fillText(`${depth.toFixed(2)} m`, coreX - 14, resolvedLabelY);
    });

    // ── Left axis: thickness bracket per layer ────────────────────────────────
    layers.forEach(layer => {
        const yTop     = layer.depthFrom * SCALE + PAD_TOP;
        const yBot     = layer.depthTo   * SCALE + PAD_TOP;
        const height   = yBot - yTop;
        const thick    = (layer.depthTo - layer.depthFrom).toFixed(2);
        const bracketX = 12;  // x position of bracket (from left edge)
        const midY     = yTop + height / 2;

        // Only draw bracket if layer is tall enough (> 18 px)
        if (height > 18) {
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth   = 1;
            ctx.setLineDash([]);

            // Vertical bracket line
            ctx.beginPath();
            ctx.moveTo(bracketX, yTop + 2);
            ctx.lineTo(bracketX, yBot - 2);
            ctx.stroke();

            // Top & bottom serifs
            ctx.beginPath();
            ctx.moveTo(bracketX, yTop + 2);
            ctx.lineTo(bracketX + 4, yTop + 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(bracketX, yBot - 2);
            ctx.lineTo(bracketX + 4, yBot - 2);
            ctx.stroke();

            // Thickness label — rotated 90° if layer tall enough, else horizontal
            ctx.save();
            if (height > 40) {
                ctx.translate(bracketX - 4, midY);
                ctx.rotate(-Math.PI / 2);
                ctx.font      = "bold 9px 'Courier New', monospace";
                ctx.fillStyle = "#64748b";
                ctx.textAlign = "center";
                ctx.fillText(`Δ ${thick} m`, 0, 0);
            } else {
                ctx.font      = "bold 8px 'Courier New', monospace";
                ctx.fillStyle = "#64748b";
                ctx.textAlign = "left";
                ctx.fillText(`${thick}m`, 2, midY + 3);
            }
            ctx.restore();
        }
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
