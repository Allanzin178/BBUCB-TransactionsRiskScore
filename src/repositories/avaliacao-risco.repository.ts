import type { DriverService } from "../config/neo4j.config.ts";


// Aqui fica toda as queries de busca ao neo4j
export class AvaliacaoRiscoRepository {
    constructor(private readonly driver: DriverService) {}

    async getDadosCompletos(conta: string) {
        const result = await this.driver.executeQuery(
            `
                MATCH (conta:CONTA {numero_conta_banco: $conta})
                MATCH (cliente:CLIENTE)-[:POSSUI]->(conta)
                 
                OPTIONAL MATCH (cliente)-[log:LOGA]->(dispositivo:DISPOSITIVO)
                OPTIONAL MATCH (dispositivo)-[:CONECTA]->(ip:IP)

                RETURN conta, cliente, ip, log, dispositivo;
            `, {conta}
        )

        return result
    }
    async padraoGastosUsuario(cpfCnpj: string) {
        const result = await this.driver.executeQuery(
            `
                MATCH (cliente:CLIENTE {cpf_cnpj: $cpfCnpj}) -[:POSSUI]-> (conta:CONTA)
                MATCH (conta) -[transacao:TRANSACIONA]-> (contaDestino:CONTA)

                WITH collect(transacao) as transacoes,
                     count(transacao) as totalTransacoes,
                     avg(transacao.valor) as mediaGasto

                return transacoes, totalTransacoes, mediaGasto
            `,
            { cpfCnpj }
        )

        return result
    }

    async getClientePelaConta(conta: string) {
        const result = await this.driver.executeQuery(
            `
                MATCH (conta:CONTA {numero_conta_banco: $conta}) <-[:POSSUI]- (cliente:CLIENTE)
                return cliente
            `,
            { conta: conta }
        )

        return result
    }

    async getDispositivoUtilizado(cpfCnpj: string) {
        const result = await this.driver.executeQuery(
            `
                MATCH (cliente:CLIENTE {cpf_cnpj: $cpfCnpj}) -[log:LOGA]-> (dispositivo:DISPOSITIVO)
                WITH dispositivo, log
                ORDER BY log.data DESC
                LIMIT 1

                OPTIONAL MATCH (dispositivo) -[conexao:CONECTA]-> (ip:IP)
                WITH dispositivo, log, ip
                ORDER BY conexao.data DESC
                LIMIT 1

                RETURN dispositivo, log, ip
            `,
            { cpfCnpj }
        )

        return result
    }


    async verificarRelacionamentoContas(contaOrigem: string, contaDestino: string) {
        const result = await this.driver.executeQuery(
            `
                MATCH (contaOrigem:CONTA {numero_conta_banco: $contaOrigem}) <-[:POSSUI]- (clienteOrigem:CLIENTE)
                MATCH (contaDestino:CONTA {numero_conta_banco: $contaDestino}) <-[:POSSUI]- (clienteDestino:CLIENTE)
                OPTIONAL MATCH path = (clienteOrigem) -[:RELACIONA_COM*1..2]- (clienteDestino)
                RETURN path, clienteOrigem, clienteDestino
            `,
            { contaOrigem, contaDestino }
        )

        return result
    }

    async contarTransacoesRecentes(cpfCnpj: string, minutos: number = 60) {
        const result = await this.driver.executeQuery(
            `
                MATCH (cliente:CLIENTE {cpf_cnpj: $cpfCnpj}) -[:POSSUI]-> (conta:CONTA)
                MATCH (conta) -[transacao:TRANSACIONA]-> (contaDestino:CONTA)
                WHERE transacao.data > datetime() - duration({minutes: $minutos})
                RETURN count(transacao) as totalTransacoesRecentes, collect(transacao) as transacoes
            `,
            { cpfCnpj, minutos }
        )

        return result
    }

    async getDadosConta(numeroConta: string) {
        const result = await this.driver.executeQuery(
            `
                MATCH (conta:CONTA {numero_conta_banco: $numeroConta})
                RETURN conta, duration.between(conta.data_criacao, datetime()) as idadeConta
            `,
            { numeroConta }
        )

        return result
    }

}