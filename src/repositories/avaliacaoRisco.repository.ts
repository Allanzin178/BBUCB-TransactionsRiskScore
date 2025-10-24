import type { DriverService } from "../config/neo4j.config.ts";

// Aqui fica toda as queries de busca ao neo4j
export class AvaliacaoRiscoRepository {
    constructor(private readonly driver: DriverService) {}

    async getAllNodes(){
        const result = await this.driver.executeQuery(
            `
                MATCH (n)
                RETURN n
                `,
            {}
        );

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
}