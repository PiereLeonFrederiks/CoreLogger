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

    // Event delegation: one listener on tbody handles all delete buttons,
    // even after innerHTML re-renders wipe out old onclick handlers.
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

// Single definition of updateTable — uses l.markers (array)
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

const SCALE = 2000; 

function drawGraph() {
    const canvas = document.getElementById('coreCanvas');
    const ctx = canvas.getContext('2d');
    if (layers.length === 0) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }

    const totalDepth = Math.max(...layers.map(l => l.depthTo));
    canvas.width = 500;
    canvas.height = (totalDepth * SCALE) + 100;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const coreWidth = 100;
    const startX = 120;

    layers.forEach(layer => {
        const yStart = layer.depthFrom * SCALE + 20;
        const height = (layer.depthTo - layer.depthFrom) * SCALE;

        // Draw layer
        ctx.fillStyle = layer.color;
        ctx.fillRect(startX, yStart, coreWidth, height);
        ctx.strokeStyle = "#2c3e50";
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, yStart, coreWidth, height);

        // Depth label
        ctx.fillStyle = "#2d3748";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`${layer.depthFrom.toFixed(2)}m`, startX - 10, yStart + 10);
        
        // Soil class label
        ctx.textAlign = "left";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(layer.officialDesc, startX + coreWidth + 10, yStart + (height / 2) + 5);

        // Draw all markers — iterate over the markers array
        layer.markers.forEach(marker => {
            const yMarker = marker.depth * SCALE + 20;
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.moveTo(startX + coreWidth, yMarker);
            ctx.lineTo(startX + coreWidth + 15, yMarker - 6);
            ctx.lineTo(startX + coreWidth + 15, yMarker + 6);
            ctx.fill();
            
            ctx.fillStyle = "red";
            ctx.font = "italic 11px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(marker.label, startX + coreWidth + 20, yMarker + 4);
        });
    });
}

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