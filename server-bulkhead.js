const express = require('express');
const { bulkhead, retry } = require('cockatiel');

const app = express();
const port = 8080;

// Configurando bulkhead com cockatiel (Máximo de 2 requisições simultâneas) e definindo uma política de retry
const bulkheadPolicy = bulkhead(2);
const retryPolicy = retry({ maxAttempts: 3, delay: 1000 }); // Tentativas até 3 vezes com delay de 1 segundo

// Função simulando chamada externa
async function externalService() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulando um erro de rede com 20% de chance
            const shouldFail = Math.random() < 0.2; 
            if (shouldFail) {
                reject(new Error('Erro de rede simulado'));
            } else {
                resolve('Resposta da chamada externa');
            }
        }, 2000); // Simula uma chamada que demora 2 segundos
    });
}

// Rota que faz a chamada simulada
app.get('/api/bulkhead', async (req, res) => {
    try {
        // Aplicando as políticas de bulkhead e retry
        const result = await retryPolicy.execute(() => 
            bulkheadPolicy.execute(() => externalService())
        );
        res.send(result);
    } catch (error) {
        // Melhorando o tratamento de erros
        if (error.message.includes('Erro de rede')) {
            res.status(503).send('Serviço temporariamente indisponível, por favor tente novamente.');
        } else {
            res.status(500).send(`Erro inesperado: ${error.message}`);
        }
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
