const express = require('express');
const { bulkhead } = require('cockatiel');
const app = express();
const port = 8080;

// Configurando bulkhead com cockatiel (Máximo de 5 requisições simultâneas)
const bulkheadPolicy = bulkhead(5);

// Função simulando chamada externa
async function externalService(id) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`Resposta da chamada externa ${id}`);
        }, 2000);  // Simula uma chamada que demora 2 segundos
    });
}

// Função para fazer várias chamadas simultâneas
async function makeConcurrentRequests(numRequests) {
    const requests = [];
    
    for (let i = 0; i < numRequests; i++) {
        requests.push(bulkheadPolicy.execute(() => externalService(i + 1)));  // Passando o id da requisição
    }
    
    const results = await Promise.all(requests);  // Espera todas as promessas serem resolvidas
    results.forEach(result => {
        console.log(result);  // Logando os resultados das chamadas
    });
    return results;
}

// Rota que faz a chamada simulada
app.get('/api/bulkhead', async (req, res) => {
    try {
        console.log('Iniciando chamadas simultâneas...');
        const result = await makeConcurrentRequests(10);  // Inicia 10 chamadas simultâneas
        res.send(result);
    } catch (error) {
        res.status(500).send(`Erro: ${error.message}`);
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
