# Guia Neo4jTSTest

## Variaveis aceitaveis no .env

- **NEO4J_DATABASE** - Indica qual nome configurado no seu neo4j
- **NEO4J_PASSWORD** - Indica qual senha do neo4j

## Instalação e passo a passo pelo docker

> **Prerequisitos:**
> Ter o docker instalado em sua maquina <br>
> Ter node instalado em sua maquina <br>

1. Rode ``npm install`` para instalar as bibliotecas necessárias
2. Rode ``docker-compose up -d`` para iniciar o container docker, responsavél pelo banco de dados
2. Rode ``npm run dev`` para rodar a aplicação em ambiente de desenvolvimento
3. Caso de algum erro, tenha certeza que o neo4j esteja com o servidor online

> Obs: Caso após a montagem do docker, você tentar iniciar um script e der erro no banco de dados, verifique seu arquivo .env ou espere alguns minutos (o neo4j demora algum tempo para inicializar por completo)

## Populate

1. Use ``npm run populate-db`` para popular seu banco de dados com informações ficticias
2. Aviso: Se caso você esteja utilizando o neo4j pela sua maquina ao invés de pelo docker, lembre-se de trocar a instância conectada para a certa

## Passo a passo para rodar

1. Rode ``npm run populate-db`` para popular o banco de dados com informações ficticias (caso não tenha)
2. Rode ``npm run dev`` para rodar o servidor no [http://localhost:3000](http://localhost:3000)
3. Após isso, basta mandar uma requisição **POST** para a rota **/avaliarRisco**
4. A requisição deve ser feita no formato:
```
    {
        "tipoTransacao": "PIX" | "TED" | "DOC" | "TRANSFERENCIA",
        "contaOrigem": "033-444555-9",
        "contaDestino": "104-987654-0",
        "valor": 10,
        "dataTransacao": "2025-10-07T09:30:00"
    }
```
Sendo que "dataTransacao" é um campo opcional, se não passado irá pegar a data atual

## Exemplos

1. ``
    {
        "tipoTransacao": "PIX",
        "contaOrigem": "033-444555-9",
        "contaDestino": "104-987654-0", 
        "valor": 100
    }
`` Esperado: score 2

2. ``
    {
        "tipoTransacao": "PIX",
        "contaOrigem": "033-444555-9",
        "contaDestino": "104-987654-0", 
        "valor": 1000
    }
`` Esperado: score 4

> Obs: Crie seus proprios exemplos seguindo os dados creation01 dentro da pasta artefatos para testar mais

## Riscos

Motivo (score)
1. Média de gastos irregular (2 - 3)
2. Transação em horário suspeito (2)
3. Dispositivo novo (2)
4. Velocidade de transações acima do normal (2 - 3)
5. Conta nova (2 - 3) (30 dias / 90 dias)
6. Uso de VPN (2)
7. IP estrangeiro (2)
8. Dispositivo IoT (3)
9. Conta destino marcada como suspeita (3)
10. Cliente destino marcado como suspeito (3)
11. Dispositivo da conta destino marcado como suspeito (3)
12. IP da conta destino marcado como suspeito (3)
13. Transação entre contas relacionadas (-1)

## Calculo

Para fazermos o calculo, nós somamos todos os riscos e devolvemos um score, que vai de 0 até 10