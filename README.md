# Guia BBUCB-TransactionsRiskScore

## Sumário

1. [Variáveis de Ambiente](#variaveis-aceitaveis-no-env)
2. [Instalação e Docker](#instalação-e-passo-a-passo-pelo-docker)
3. [Popular Banco de Dados](#populate)
4. [Como Rodar](#passo-a-passo-para-rodar)
5. [Exemplos de Uso](#exemplos)
6. [Regras de Avaliação](#regras)
7. [Explicação das Regras](#explicação-das-regras)
8. [Cálculo de Risco](#calculo)
9. [Autores](#autores)

## Variaveis aceitaveis no .env

- **NEO4J_DATABASE** - Indica qual nome configurado no seu neo4j
- **NEO4J_PASSWORD** - Indica qual senha do neo4j (OBRIGATORIO - Mínimo de 8 dígitos) 

## Instalação e passo a passo pelo docker

> **Prerequisitos:**
> Ter o docker instalado em sua maquina <br>
> Ter node instalado em sua maquina <br>

1. Rode ``npm install`` para instalar as bibliotecas necessárias
2. (Opcional) Rode ``docker-compose up -d`` para iniciar o container docker, responsavél pelo banco de dados
3. (Opcional) Siga a aba [Populate](#populate) para popular o banco de dados caso não tenha informações nele ou seja a primeira vez rodando pelo docker
4. Rode ``npm run dev`` para rodar a aplicação em ambiente de desenvolvimento
5. Caso de algum erro, tenha certeza que o neo4j esteja com o servidor online

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

> Exemplos de corpo de requisição para analise de risco
1. Transação exemplo 01:
```
{
    "tipoTransacao": "PIX",
    "contaOrigem": "033-444555-9",
    "contaDestino": "104-987654-0", 
    "valor": 100
}
```
- Esperado: score 6 (caso feito de madrugada o score deve aumentar)
- Motivos: 
    - Transação entre contas relacionadas (seguro)
    - Dispositivo da conta destino marcado como suspeito (risco alto)

2. Transação exemplo 02:
```
{
    "tipoTransacao": "PIX",
    "contaOrigem": "033-444555-9",
    "contaDestino": "104-987654-0", 
    "valor": 1000
}
```
- Esperado: score 7 (caso feito de madrugada o score deve aumentar)
- Motivos: 
    - Transação entre contas relacionadas (seguro)
    - Média de gastos irregular (risco médio)
    - Dispositivo da conta destino marcado como suspeito (risco alto)

> Obs: Crie seus proprios exemplos seguindo os dados creation01 dentro da pasta artefatos para testar mais

## Regras

+ Transação entre contas relacionadas
+ Média de gastos irregular
+ Dispositivo IoT
+ Velocidade de transações acima do normal
+ Uso de VPN
+ IP estrangeiro
+ Conta nova
+ Transação em horário suspeito
+ Dispositivo novo
+ IP da conta destino marcado como suspeito
+ Conta destino marcada como suspeita
+ Dispositivo da conta destino marcado como suspeito
+ Cliente destino marcado como suspeito

## Explicação das regras

### 1. Transação entre contas relacionadas (Peso: 1)
- Possíveis valores: -2 | 0  
- Cálculo: Verifica se existe um relacionamento entre os clientes das contas de origem e destino no grafo. Se encontrado, aplica um bônus negativo de -2, reduzindo o score de risco.

### 2. Média de gastos irregular (Peso: 3)
- Possíveis valores: 0 | 5 | 10  
- Cálculo: Compara o valor da transação com a média histórica de gastos do cliente. Retorna 0 se o valor for menor ou igual à média, 5 se for até 2x a média, e 10 se exceder 2x a média.

### 3. Dispositivo IoT (Peso: 3)
- Possíveis valores: 0 | 10  
- Cálculo: Verifica se o dispositivo utilizado na transação é do tipo IoT (Internet of Things). Dispositivos IoT são considerados menos seguros para transações financeiras.

### 4. Velocidade de transações acima do normal (Peso: 4)
- Possíveis valores: 0 | 6 | 8  
- Cálculo: Conta quantas transações o cliente realizou nos últimos 60 minutos. Retorna 6 se houver 3-4 transações, e 8 se houver 5 ou mais transações no período.

### 5. Uso de VPN (Peso: 4)
- Possíveis valores: 0 | 10  
- Cálculo: Detecta se o IP utilizado na transação é proveniente de uma VPN. O uso de VPN pode indicar tentativa de mascarar a localização real.

### 6. IP estrangeiro (Peso: 4)
- Possíveis valores: 0 | 10  
- Cálculo: Verifica se o país do IP utilizado é diferente de 'BR' (Brasil). Transações de IPs estrangeiros têm maior probabilidade de fraude.

### 7. Conta nova (Peso: 5)
- Possíveis valores: 0 | 7 | 10  
- Cálculo: Calcula a idade da conta desde sua criação. Retorna 10 se a conta tem menos de 30 dias, 7 se tem entre 30 e 90 dias, e 0 se for mais antiga.

### 8. Transação em horário suspeito (Peso: 5)
- Possíveis valores: 0 | 7  
- Cálculo: Verifica se a transação ocorre entre 22h e 6h (horário de madrugada). Transações nesse período têm maior probabilidade de serem fraudulentas.

### 9. Dispositivo novo (Peso: 6)
- Possíveis valores: 0 | 7 | 10  
- Cálculo: Verifica se o dispositivo foi utilizado pela primeira vez há menos de 7 dias. Dispositivos recém-cadastrados apresentam maior risco.

### 10. IP da conta destino marcado como suspeito (Peso: 7)
- Possíveis valores: 0 | 10  
- Cálculo: Verifica se o IP utilizado pelo cliente da conta destino possui flag ***suspeito: true*** no banco de dados.

### 11. Conta destino marcada como suspeita (Peso: 8)
- Possíveis valores: 0 | 10  
- Cálculo: Verifica se a conta de destino possui flag ***suspeito: true*** no banco de dados, indicando histórico de atividades fraudulentas.

### 12. Dispositivo da conta destino marcado como suspeito (Peso: 8)
- Possíveis valores: 0 | 10  
- Cálculo: Verifica se o dispositivo utilizado pelo cliente da conta destino possui flag ***suspeito: true*** no banco de dados.

### 13. Cliente destino marcado como suspeito (Peso: 9)
- Possíveis valores: 0 | 10  
- Cálculo: Verifica se o cliente da conta destino possui flag *suspeito: true* no banco de dados, representando o maior peso de risco individual.

## Calculo

Para calcularmos o risco de uma determinada regra, pegamos o valor dela e multiplicamos pelo respectivo peso. Após isso, somamos todos os riscos de todas as regras e dividimos pela quantidade de regras
Como exemplo, digamos que temos duas regras, com valor e peso de 2 - 4 e 5 - 2
Agora fazemos o calculo: ((2 * 4) + (5 * 2)) / 2 
É uma média ponderada alterada, onde não dividimos pela soma dos pesos, e sim pela quantidade de regras
Para testar valores e regras, além de visualizar uma planilha com as formulas dos calculos e alguns exemplos, visite [esse link](https://docs.google.com/spreadsheets/d/1qGmT2o2lihzX0sdq1a9Tdr1SSHA4EYhVITWa2UeCA60/edit?usp=sharing)

## Autores

Sistema desenvolvido por: 

- **Allan Barros de Medeiros Miron** - Desenvolvedor líder - [Allanzin178](https://github.com/Allanzin178/)
- **Kalleby Rodrigues Frutuoso** - Auxilio no desenvolvimento de regras - [DevKalleby](https://github.com/DevKalleby/)

