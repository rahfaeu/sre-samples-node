const express = require('express');

const app = express();
const port = 8080;

// Função para criar uma Promise com timeout
function timeoutPromise(ms, promiseFn) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Tempo limite excedido!'));
        }, ms);

        promiseFn()
            .then((result) => {
                clearTimeout(timeout);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeout);
                reject(error);
            });
    });
}

// Função simulando uma chamada externa
async function externalService() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('Resposta da chamada externa\n');
        }, 2000); // Ajustado para 2s
    });
}

// Rota inicial
app.get('/', (req, res) => {
    res.send('Bem-vindo ao servidor!');
});

// Rota de health check
app.get('/api/health', (req, res) => {
    res.send('OK');
});

// Rota com timeout
app.get('/api/timeout', async (req, res) => {
    try {
        const result = await timeoutPromise(3000, externalService); // Timeout de 3s
        res.send(result);
    } catch (error) {
        if (error.message.includes('Tempo limite excedido')) {
            res.status(408).send(`Erro: ${error.message}`); // Timeout
        } else {
            res.status(500).send(`Erro: ${error.message}`); // Outros erros
        }
    }
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
