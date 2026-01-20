import fs from 'fs';
import path from 'path';

async function upload() {
    try {
        const filePath = path.resolve('attached_assets/Controle_de_Materiais_1765917185358.xlsx');
        if (!fs.existsSync(filePath)) {
            console.error('File found path:', filePath);
            throw new Error('File not found');
        }

        // Node.js 22 has global fetch, FormData, Blob.
        const fileBuffer = fs.readFileSync(filePath);
        const blob = new Blob([fileBuffer]);

        const formData = new FormData();
        formData.append('file', blob, 'Controle_de_Materiais.xlsx');

        const response = await fetch('http://localhost:3002/api/import', {
            method: 'POST',
            body: formData
        });

        const text = await response.text();
        try {
            const json = JSON.parse(text);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log("Response text:", text);
        }
    } catch (err) {
        console.error('Upload failed:', err);
    }
}
upload();
