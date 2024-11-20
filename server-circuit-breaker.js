const express = require('express');
const CircuitBreaker = require('opossum');

const app = express();
const port = 8080;

// Função simulando chamada externa com 50% de falhas
async function externalService() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const shouldFail = Math.random() > 0.8;  // Simula o percentual de falhas (20% de sucesso)
            if (shouldFail) {
                reject(new Error('Falha na chamada externa'));  // Simulando falha
            } else {
                resolve('Resposta da chamada externa');  // Simulando sucesso
            }
        }, 2000);  // Simula uma chamada que demora 2 segundos
    });
}

// Configuração do Circuit Breaker
const breaker = new CircuitBreaker(externalService, {
    timeout: 3000,  // Tempo limite de 3 segundos para a chamada
    errorThresholdPercentage: 50,  // Abre o circuito se 50% das requisições falharem
    resetTimeout: 10000  // Tenta fechar o circuito após 10 segundos
});

// Lidando com sucesso e falhas do Circuit Breaker
breaker.fallback(() => {
    return 'O sistema está temporariamente fora do ar. Tente novamente mais tarde.';
});

// Monitorando os eventos do Circuit Breaker
breaker.on('open', () => console.log('Circuito aberto! - O serviço está inacessível.'));
breaker.on('halfOpen', () => console.log('Circuito meio aberto - Tentando restabelecer o serviço.'));
breaker.on('close', () => console.log('Circuito fechado novamente - Serviço restaurado.'));
breaker.on('reject', () => console.log('Requisição rejeitada pelo Circuit Breaker - O circuito está aberto.'));
breaker.on('failure', () => console.log('Falha registrada pelo Circuit Breaker - Excesso de falhas.'));
breaker.on('success', () => console.log('Sucesso registrado pelo Circuit Breaker - O serviço está estável.'));

// Rota que faz a chamada simulada com o Circuit Breaker
app.get('/api/circuitbreaker', async (req, res) => {
    try {
        // Acionando o Circuit Breaker
        const result = await breaker.fire();
        res.send(result);  // Resposta normal ou do fallback
    } catch (error) {
        // Tratamento de erro aprimorado
        console.error('Erro ao tentar processar a requisição:', error.message);
        res.status(500).send(`Erro inesperado ao processar a requisição: ${error.message}`);
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
