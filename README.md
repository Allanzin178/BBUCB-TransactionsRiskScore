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