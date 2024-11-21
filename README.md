# MBA Engenharia de Dados - Mackenzie

**Aluno**: Rafael dos Santos

**Metéria**: Cloud Computing e SRE - Uma Visão Prática [Turma 202412093.000.01A] - 2024/2

# Exemplos Práticos de Resiliência em Aplicações Node.js
Este material contempla exemplos práticos de uso de técnicas essenciais em aplicações, afim de garantir a confiabilidade, resiliência, escalabilidade e alta disponibilidade.

Dentre os temas tratados, são apresentados os seguintes itens chave:
- **Timeout**
- **Rate Limit**
- **Bulkhead**
- **Circuit Breaker**
- **Health Check**

Para demonstração foram utilizadas as Bibliotecas e Frameworks:

- `express`: Framework web para Node.js que facilita a criação de servidores e APIs. Usado para criar o servidor HTTP e rotas. Link: https://expressjs.com/

- `cockatiel`: Biblioteca que implementa padrões de resiliência, como timeout e bulkhead, para chamadas assíncronas. Link: https://www.npmjs.com/package/cockatiel
      
- `express-rate-limit`: Middleware para Express que limita o número de requisições de um IP específico em um determinado período. Usado para implementar rate limiting. Link: https://www.npmjs.com/package/express-rate-limit

- `opossum`: Biblioteca que implementa o padrão de Circuit Breaker, que ajuda a evitar chamadas a serviços que estão falhando. Permite definir limites de tempo, porcentagens de falhas e intervalos de reset. Link: https://github.com/nodeshift/opossum

## 1. Criar o Projeto Node.js

**1.1 Criar um diretório para o projeto e inicializar um novo projeto Node.js:**

 ```sh
 mkdir sre-samples-node
 cd sre-samples-node
 npm init -y
```
**1.2 Instalar as dependências necessárias:**

```
npm install express cockatiel express-rate-limit opossum
```

## 2. Exemplos de Código

### 2.1 Timeout
O papel principal das configurações de Timeout são definir um limite de tempo para a execução de operações, evitando erros inesperados e um tratamento adequado de serviços que tendem a demorar por conta de eventos não esperados. Este tipo de tratamento evita erros indesejados impactando a experiência do cliente.

Crie um arquivo chamado **`server-timeout.js`**:

```javascript
const express = require('express');

const app = express();
const port = 8080;

// Função para criar uma Promise que simula um timeout
function timeoutPromise(ms, promise) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Tempo limite excedido!'));
        }, ms);

        promise
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

// Função simulando chamada externa
async function externalService() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('Resposta da chamada externa');
        }, 5000); 
    });
}

// Rota de health check
app.get('/api/health', (req, res) => {
    res.send('OK');
});

// Rota que faz a chamada simulada com timeout
app.get('/api/timeout', async (req, res) => {
    try {
        const result = await timeoutPromise(3000, externalService());
        res.send(result);
    } catch (error) {
        res.status(500).send(`Erro: ${error.message}`);
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
```

**Utilize o comando para executar a aplicação**
```javascript
node server-timeout.js
```
 
**Utilize o comando pra realizar a chamada do endpoint**
```javascript
curl localhost:8080/api/timeout
```

#### 2.1.2 Desafio - Timeout
Ajustar configurações de timeout e corrigir erro de timeout execedido ao invocar o serviço

![Screen Shot 2024-09-13 at 21 42 04](https://github.com/user-attachments/assets/a451d1a1-ef3f-4116-8ab0-246d6548b7a3)

```
Melhorias

Execução antecipada da Promise
A Promise está sendo executada antes da implementação da lógica de timeout. Quando chamamos timeoutPromise(3000, externalService()), a função externalService() é executada imediatamente, mesmo antes de aplicar a lógica do timeout. Isso acontece porque a função externalService() é avaliada logo no momento em que é passada para a função timeoutPromise, o que não é o comportamento esperado.

Descompasso de tempo
O tempo de timeout configurado (3000ms) é menor que o tempo que a função externalService() leva para executar (5000ms), fazendo com que o erro de timeout ocorra sempre. O tempo de execução da chamada simulada é maior do que o tempo disponível para resposta, o que resulta consistentemente em um erro de timeout.

Tratamento genérico de erros
Atualmente, todos os erros são tratados de forma genérica, retornando um código 500, sem diferenciação entre um erro de timeout e outros tipos de falha. Isso pode gerar confusão para o cliente, pois ele não sabe exatamente o que causou o erro. Melhor seria distinguir os erros, para que o cliente receba uma mensagem mais clara e específica sobre o que aconteceu.



```
A seguir imagem após aplicação das melhorias:

![Texto Alternativo](./img/desafio1-timeout.png)

---
### 2.2 Rate Limit
O Rate Limiting possibilita controlar a quantidade de requisições permitidas dentro de um período de tempo, evitando cargas massivas de requisições mal intensionadas, por exemplo.

Crie um arquivo chamado **`server-ratelimit.js`**:

```javascript
const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
const port = 8080;

// Middleware de rate limiting (Limite de 5 requisições por minuto)
const limiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minuto
    max: 5,  // Limite de 5 requisições
    message: 'Você excedeu o limite de requisições, tente novamente mais tarde.',
});

// Aplica o rate limiter para todas as rotas
app.use(limiter);

// Função simulando chamada externa
async function externalService() {
    return 'Resposta da chamada externa';
}

// Rota que faz a chamada simulada
app.get('/api/ratelimit', async (req, res) => {
    try {
        const result = await externalService();
        res.send(result);
    } catch (error) {
        res.status(500).send(`Erro: ${error.message}`);
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

```

**Utilize o comando para executar a aplicação**
```javascript
node server-ratelimit.js
```
 
**Utilize o comando pra realizar a chamada do endpoint**
```javascript
curl localhost:8080/api/ratelimit
```
#### 2.1.2 Desafio - Rate Limit
Alterar limite de requisições permitidas para 100 num intervalo de 1 minuto e escrever uma função para simular o erro de Rate Limit.
![Screen Shot 2024-09-13 at 22 51 23](https://github.com/user-attachments/assets/6407456d-9bb5-41bb-ba17-9cc4a5272d29)

```
Melhorias

Rate Limiter Configurado para Todas as Rotas

O middleware de rate limiting (app.use(limiter)) está aplicado globalmente, afetando todas as rotas, incluindo aquelas que poderiam precisar de uma configuração diferente (por exemplo, /api/health).
Mensagem de Erro Genérica no Rate Limiter

A mensagem do rate limiter é genérica e pode não fornecer detalhes suficientes sobre a rota ou o contexto em que a limitação ocorreu.
Falta de Logs para Monitoramento

Não há logs para acompanhar o comportamento das requisições bloqueadas pelo rate limiter, dificultando a análise de possíveis abusos.
Erro 500 Genérico na Rota /api/ratelimit

O código trata qualquer erro no processamento da rota como 500, sem diferenciar erros internos de limites excedidos.

```


---
### 2.3 Bulkhead
As configurações de Bulkhead permitem limitar o número de chamadas simultâneas a um serviço, de modo que a aplicação sempre esteja preparada para cenários adversos.

Crie um arquivo chamado **`server-bulkhead.js`**:

```javascript
const express = require('express');
const { bulkhead } = require('cockatiel');

const app = express();
const port = 8080;

// Configurando bulkhead com cockatiel (Máximo de 2 requisições simultâneas)
const bulkheadPolicy = bulkhead(2);

// Função simulando chamada externa
async function externalService() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('Resposta da chamada externa');
        }, 2000);  // Simula uma chamada que demora 2 segundos
    });
}

// Rota que faz a chamada simulada
app.get('/api/bulkhead', async (req, res) => {
    try {
        const result = await bulkheadPolicy.execute(() => externalService());
        res.send(result);
    } catch (error) {
        res.status(500).send(`Erro: ${error.message}`);
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

```

**Utilize o comando para executar a aplicação**
```javascript
node server-bulkhead.js
```
 
**Utilize o comando pra realizar a chamada do endpoint**
```javascript
curl localhost:8080/api/bulkhead
```

#### 2.3.2 Desafio - Bulkhead
Aumentar quantidade de chamadas simultâneas e avaliar o comportamento.
![Screen Shot 2024-09-13 at 22 36 17](https://github.com/user-attachments/assets/e379b022-fe78-41bf-9e4b-e4eb21781294)

**BÔNUS**: implementar método que utilizando threads para realizar as chamadas e logar na tela 


```
Melhorias

Configuração do Timeout no Bulkhead: Seria melhor definir um tempo máximo para a execução das requisições com o uso de um timeout, para evitar que a aplicação fique esperando indefinidamente.

Tratamento de Erros Mais Robusto: O catch que você está usando poderia capturar erros mais específicos, para poder fornecer mensagens de erro mais detalhadas para diferentes tipos de falha (por exemplo, se exceder o limite de requisições).

Definir um número de tentativas (retry): Quando usamos cockatiel, podemos configurar um número de tentativas em caso de falha. Isso poderia ser útil se a chamada à função externa falhar por algum motivo

```


---
### 2.4 Circuit Breaker
O Circuit Breaker ajuda a proteger a aplicação contra falhas em cascata, evitando chamadas excessivas para serviços que estão falhando.

Crie um arquivo chamado **`server-circuit-breaker.js`**:

```javascript
const express = require('express');
const CircuitBreaker = require('opossum');

const app = express();
const port = 8080;

// Função simulando chamada externa com 50% de falhas
async function externalService() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const shouldFail = Math.random() > 0.8;  // Simula o percentual de falhas
            if (shouldFail) {
                reject(new Error('Falha na chamada externa'));
            } else {
                resolve('Resposta da chamada externa');
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
breaker.fallback(() => 'Resposta do fallback...');
breaker.on('open', () => console.log('Circuito aberto!'));
breaker.on('halfOpen', () => console.log('Circuito meio aberto, testando...'));
breaker.on('close', () => console.log('Circuito fechado novamente'));
breaker.on('reject', () => console.log('Requisição rejeitada pelo Circuit Breaker'));
breaker.on('failure', () => console.log('Falha registrada pelo Circuit Breaker'));
breaker.on('success', () => console.log('Sucesso registrado pelo Circuit Breaker'));

// Rota que faz a chamada simulada com o Circuit Breaker
app.get('/api/circuitbreaker', async (req, res) => {
    try {
        const result = await breaker.fire();
        res.send(result);
    } catch (error) {
        res.status(500).send(`Erro: ${error.message}`);
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
```

**Utilize o comando para executar a aplicação**
```javascript
node server-circuit-breaker.js
```
 
**Utilize o comando pra realizar a chamada do endpoint**
```javascript
curl localhost:8080/api/circuitbreaker
```

#### 2.4.1 Desafio - Circuit Breaker
Ajustar o o percentual de falhas para que o circuit breaker obtenha sucesso ao receber as requisições após sua abertura.
Observar comportamento do circuito no console.

```
Melhorias
Melhorar a Resposta de Fallback: A resposta de fallback pode ser mais informativa, explicando que o sistema está em modo de emergência devido a falhas no serviço externo.

Considerar a Persistência de Estados (opcional): Se a aplicação for escalada em múltiplas instâncias, pode ser interessante considerar a persistência do estado do Circuit Breaker em um banco de dados ou serviço de cache.
```

---
### 2.5 Health Check
Health check é uma prática comum para monitorar o status de uma aplicação e garantir que esteja funcionando corretamente.

- **Liveness Probe**: Verifica se a aplicação está rodando. Geralmente usado para verificar se a aplicação está ativa e não travada.
- **Readiness Probe**: Verifica se a aplicação está pronta para aceitar requisições. Isso é útil para garantir que o serviço está pronto para receber tráfego.

Crie um arquivo chamado **`server-health-check.js`**:

```javascript
const express = require('express');
const app = express();
const port = 8080;

// Simulando o estado da aplicação para o Readiness Check
let isReady = false;

// Endpoint Liveness Check - verifica se o servidor está rodando
app.get('/health/liveness', (req, res) => {
    res.status(200).send('Liveness check passed');
});

// Endpoint Readiness Check - verifica se a aplicação está pronta para receber requisições
app.get('/health/readiness', (req, res) => {
    if (isReady) {
        res.status(200).send('Readiness check passed');
    } else {
        res.status(503).send('Service is not ready yet');
    }
});

// Endpoint para simular a aplicação ficando pronta
app.get('/make-ready', (req, res) => {
    isReady = true;
    res.send('Application is now ready to accept requests');
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

```

**Utilize o comando para executar a aplicação**
```javascript
node server-health-check.js
```

**Definição endpoints criados**
- Liveness (`/health/liveness`): Este endpoint sempre retorna um status HTTP 200 para indicar que o serviço está vivo e em execução.
- Readiness (`/health/readiness`): Este endpoint retorna um status HTTP 200 apenas se a variável isReady estiver definida como true. Caso contrário, retorna um status HTTP 503 para indicar que o serviço não está pronto para receber tráfego.
- Simulação de Readiness (`/make-ready`): Esse endpoint permite que a aplicação altere seu estado para "pronta", configurando o isReady como true.
 
Em seguida, para entendimento detalhado, execute os comandos abaixo em ordem:

**1. Liveness**
```sh
curl http://localhost:8080/health/liveness
```


**2. Liveness output**
```sh
Liveness check passed
```
### Execução
![liveness](./img/desafio5-liveness.png)

**3. Readiness**
```sh
curl http://localhost:8080/health/readiness
```

**4. Readiness output**
```sh
Service is not ready yet
```

### Execução
![liveness](./img/desafio5-readiness.png)

**5. Simulação de Readiness**
```sh
curl http://localhost:8080/make-ready
```

### Execução
![liveness](./img/desafio5-make-ready.png)

**6. Readiness**
```sh
curl http://localhost:8080/health/readiness
```
**7. Readiness output**
```sh
Readiness check passed
```

### Execução
![liveness](./img/desafio5-health-readiness.png)
```
#### 2.5.1 Exemplo de configuração de Probes no Kubernetes (Opcional)
Para utilizar esses endpoints como probes no Kubernetes, você pode configurar o `deployment.yaml` da seguinte maneira:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: node-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: node-app
  template:
    metadata:
      labels:
        app: node-app
    spec:
      containers:
      - name: node-app
        image: your-node-app-image
        ports:
        - containerPort: 8080
        livenessProbe:
          httpGet:
            path: /health/liveness
            port: 8080
          initialDelaySeconds: 3
          periodSeconds: 5
        readinessProbe:
          httpGet:
            path: /health/readiness
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10

```
**Probes no Kubernetes:**
- **livenessProbe**: O Kubernetes faz uma requisição GET para o endpoint `/health/liveness`. Se retornar um código de status 200, o container é considerado vivo. Se falhar repetidamente, o container será reiniciado.
- **readinessProbe**: O Kubernetes faz uma requisição GET para o endpoint `/health/readiness`. O container é considerado pronto se retornar 200. Se falhar, o container será removido das rotas de serviço até que esteja pronto novamente.

**Propriedades das Probes**
- `httpGet`: Realiza uma requisição HTTP.
- `path`: O caminho do endpoint HTTP que será verificado (por exemplo, /health/liveness).
- `port`: A porta do container onde a requisição será feita.
- `initialDelaySeconds`: O tempo de espera antes do primeiro check ser executado.
- `periodSeconds`: A frequência de execução do check.
- `failureThreshold`: Quantas falhas consecutivas são necessárias para reiniciar o container.
- `successThreshold`: Número de sucessos consecutivos necessários para marcar o container como pronto.
- `timeoutSeconds`: Tempo máximo de espera antes de considerar o check como falha.

Para saber mais, acesse:
- https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
- https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/
