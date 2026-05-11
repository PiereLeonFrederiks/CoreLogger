const layers = [];

function translateSoil(desc) {
    let lowerDesc = desc.toLowerCase();
    let official = "";
    if (lowerDesc.includes("sandy clay")) official = "S(t)";
    else if (lowerDesc.includes("sandy silt")) official = "U(s)";
    else if (lowerDesc.includes("peat")) official = "H()";
    else if (lowerDesc.includes("sand")) official = "S()";
    else if (lowerDesc.includes("clay")) official = "T()";
    else if (lowerDesc.includes("silt")) official = "U()";
    else official = "-";
    return official.toUpperCase();
}

function addLayer() {
    const id = document.getElementById('coreId').value || "N/A";
    const from = parseFloat(document.getElementById('depthFrom').value);
    const to = parseFloat(document.getElementById('depthTo').value);
    const color = document.getElementById('soilColor').value;
    const desc = document.getElementById('soilDesc').value;

    if (isNaN(from) || isNaN(to) || !desc) {
        alert("Field data incomplete or depth is not a number.");
        return;
    }

    const officialDesc = translateSoil(desc);
    // Store numeric values for drawing
    const layer = { 
        id, 
        depthFrom: from, 
        depthTo: to, 
        displayDepth: `${from}-${to}`, 
        color, 
        officialDesc, 
        originalDesc: desc 
    };
    
    layers.push(layer);
    updateTable();
    drawGraph(); // Trigger the drawing
    
    document.getElementById('depthFrom').value = to; 
    document.getElementById('depthTo').value = "";
    document.getElementById('soilDesc').value = "";
    document.getElementById('depthTo').focus();
}

function updateTable() {
    const tbody = document.querySelector("#logTable tbody");
    tbody.innerHTML = "";
    layers.forEach(l => {
        const row = `<tr>
            <td>${l.id}</td>
            <td>${l.displayDepth}</td>
            <td>${l.color}</td>
            <td>${l.officialDesc}</td>
            <td>${l.originalDesc}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

const SCALE = 2000;

function drawGraph() {
    const canvas = document.getElementById('coreCanvas');
    const ctx = canvas.getContext('2d');
    
    if (layers.length === 0) return;

    const totalDepth = layers[layers.length - 1].depthTo;
    canvas.width = 500;
    canvas.height = (totalDepth * SCALE) + 100; // Add padding at bottom

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const coreWidth = 120;
    const startX = (canvas.width / 2) - (coreWidth / 2);

    layers.forEach(layer => {
        const yStart = layer.depthFrom * SCALE + 20; // 20px top offset
        const yEnd = layer.depthTo * SCALE + 20;
        const height = yEnd - yStart;

        // Draw Layer
        ctx.fillStyle = CSS.supports('color', layer.color) ? layer.color : '#a68a64'; 
        ctx.fillRect(startX, yStart, coreWidth, height);
        
        // Border
        ctx.strokeStyle = '#1a365d';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, yStart, coreWidth, height);

        // Text Labels
        ctx.fillStyle = '#2d3748';
        ctx.font = '11px monospace';
        
        // Only draw 'From' label if it's the first layer or significantly different
        ctx.textAlign = 'right';
        ctx.fillText(`${layer.depthFrom.toFixed(2)}m`, startX - 10, yStart + 10);
        ctx.fillText(`${layer.depthTo.toFixed(2)}m`, startX - 10, yEnd);

        // Class Label on the right
        ctx.textAlign = 'left';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(layer.officialDesc, startX + coreWidth + 10, yStart + (height / 2) + 5);
    });
}

// JPG Export
function exportImage(format) {
    const canvas = document.getElementById('coreCanvas');
    const link = document.createElement('a');
    link.download = `core-profile.${format}`;
    link.href = canvas.toDataURL(`image/${format}`, 1.0);
    link.click();
}

// SVG Export (Vector based)
function exportSVG() {
    const totalDepth = layers[layers.length - 1].depthTo;
    const w = 500;
    const h = (totalDepth * SCALE) + 100;
    const coreWidth = 120;
    const startX = (w / 2) - (coreWidth / 2);

    let svgEl = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
    svgEl += `<rect width="100%" height="100%" fill="white"/>`;

    layers.forEach(l => {
        const yS = l.depthFrom * SCALE + 20;
        const yE = l.depthTo * SCALE + 20;
        const height = yE - yS;
        const color = CSS.supports('color', l.color) ? l.color : '#a68a64';

        svgEl += `<rect x="${startX}" y="${yS}" width="${coreWidth}" height="${height}" fill="${color}" stroke="#1a365d" />`;
        svgEl += `<text x="${startX - 10}" y="${yS + 10}" font-family="monospace" font-size="11" text-anchor="end">${l.depthFrom.toFixed(2)}m</text>`;
        svgEl += `<text x="${startX - 10}" y="${yE}" font-family="monospace" font-size="11" text-anchor="end">${l.depthTo.toFixed(2)}m</text>`;
        svgEl += `<text x="${startX + coreWidth + 10}" y="${yS + (height/2) + 5}" font-family="sans-serif" font-size="12" font-weight="bold">${l.officialDesc}</text>`;
    });

    svgEl += `</svg>`;

    const blob = new Blob([svgEl], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'core-profile.svg';
    link.click();
}

function copyToClipboard() {
    let tsvContent = "Core ID\tDepth\tColor\tOfficial\tDescription\n";
    layers.forEach(l => {
        tsvContent += `${l.id}\t${l.displayDepth}\t${l.color}\t${l.officialDesc}\t${l.originalDesc}\n`;
    });
    navigator.clipboard.writeText(tsvContent).then(() => {
        alert("Scientific data copied to clipboard.");
    });
}
