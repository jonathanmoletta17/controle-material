
const http = require('http');

function request(method, path, data) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3002,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: body }));
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function run() {
    try {
        console.log("1. Creating Zero Stock Item...");
        const itemRes = await request('POST', '/items', {
            codigoGce: "TEST-ZERO-" + Date.now(),
            itemNome: "Item Teste Zero",
            unidade: "UN",
            estoqueAtual: 0,
            estoqueMinimo: 10,
            ativo: true,
            setor: "ELETRICA"
        });

        if (itemRes.status !== 200 && itemRes.status !== 201) {
            throw new Error(`Failed to create item: ${itemRes.status} ${itemRes.body}`);
        }

        const item = JSON.parse(itemRes.body);
        console.log("Item Created:", item.id);

        console.log("2. Attempting Withdrawal (Should Fail)...");
        const moveRes = await request('POST', '/movements', {
            itemId: item.id,
            tipo: "RETIRADA_MANUTENCAO",
            quantidade: 1,
            setor: "ELETRICA",
            responsavel: "Tester"
        });

        console.log("Response Status:", moveRes.status);
        console.log("Response Body:", moveRes.body);

        if (moveRes.status === 500 || moveRes.status === 400) {
            console.log("SUCCESS: Withdrawal blocked as expected.");
        } else {
            console.error("FAILURE: Withdrawal was allowed! Status:", moveRes.status);
        }

        // Cleanup
        console.log("3. Deleting Test Item...");
        await request('DELETE', `/items/${item.id}`);
        console.log("Cleanup done.");

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
