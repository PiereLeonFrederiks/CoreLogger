const layers = [];

function translateSoil(desc) {
    let lowerDesc = desc.toLowerCase();
    let official = "";

    // Basic Translation Logic (Example)
    if (lowerDesc.includes("sandy clay")) official = "S(t)";
    else if (lowerDesc.includes("sand")) official = "S()";
    else if (lowerDesc.includes("clay")) official = "T()";
    else if (lowerDesc.includes("silt")) official = "U()";
    else official = desc; // Default to original if no match

    return official.toUpperCase();
}

function addLayer() {
    const id = document.getElementById('coreId').value;
    const from = document.getElementById('depthFrom').value;
    const to = document.getElementById('depthTo').value;
    const color = document.getElementById('soilColor').value;
    const desc = document.getElementById('soilDesc').value;

    if (!from || !to || !desc) {
        alert("Please fill in depth and description.");
        return;
    }

    const officialDesc = translateSoil(desc);
    const layer = { id, depth: `${from}-${to}`, color, officialDesc };
    
    layers.push(layer);
    updateTable();
    
    // Clear inputs for next layer
    document.getElementById('depthFrom').value = to; // Start next layer where this ended
    document.getElementById('depthTo').value = "";
    document.getElementById('soilDesc').value = "";
}

function updateTable() {
    const tbody = document.querySelector("#logTable tbody");
    tbody.innerHTML = "";
    
    layers.forEach(l => {
        const row = `<tr>
            <td>${l.id}</td>
            <td>${l.depth}</td>
            <td>${l.color}</td>
            <td>${l.officialDesc}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

function copyToClipboard() {
    // Format data as Tab-Separated Values (TSV) for Excel/Google Sheets
    let tsvContent = "Core ID\tDepth (m)\tColor\tOfficial Description\n";
    
    layers.forEach(l => {
        tsvContent += `${l.id}\t${l.depth}\t${l.color}\t${l.officialDesc}\n`;
    });

    navigator.clipboard.writeText(tsvContent).then(() => {
        alert("Data copied! You can now paste it into Google Sheets.");
    });
}