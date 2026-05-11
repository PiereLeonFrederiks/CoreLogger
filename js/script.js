const layers = [];

function translateSoil(desc) {
    let lowerDesc = desc.toLowerCase();
    let official = "";

    // Example logic - easily expandable
    if (lowerDesc.includes("sandy clay")) official = "S(t)";
    else if (lowerDesc.includes("sand")) official = "S()";
    else if (lowerDesc.includes("clay")) official = "T()";
    else if (lowerDesc.includes("silt")) official = "U()";
    else official = "-";

    return official.toUpperCase();
}

function addLayer() {
    const id = document.getElementById('coreId').value || "N/A";
    const from = document.getElementById('depthFrom').value;
    const to = document.getElementById('depthTo').value;
    const color = document.getElementById('soilColor').value;
    const desc = document.getElementById('soilDesc').value;

    if (!from || !to || !desc) {
        alert("Field data incomplete.");
        return;
    }

    const officialDesc = translateSoil(desc);
    const layer = { id, depth: `${from}-${to}`, color, officialDesc, originalDesc: desc };
    
    layers.push(layer);
    updateTable();
    
    // Preparation for next layer
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
            <td>${l.depth}</td>
            <td>${l.color}</td>
            <td>${l.officialDesc}</td>
            <td>${l.originalDesc}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

function copyToClipboard() {
    let tsvContent = "Core ID\tDepth\tColor\tOfficial\tDescription\n";
    layers.forEach(l => {
        tsvContent += `${l.id}\t${l.depth}\t${l.color}\t${l.officialDesc}\t${l.originalDesc}\n`;
    });

    navigator.clipboard.writeText(tsvContent).then(() => {
        alert("Scientific data copied to clipboard.");
    });
}