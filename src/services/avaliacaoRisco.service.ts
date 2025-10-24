import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type { AvaliacaoRiscoRepository } from "../repositories/avaliacaoRisco.repository.ts";

// Aqui fica toda a logica de calcular o risco
export class AvaliacaoRiscoService {
    private readonly MAX_SCORE_RISCO = 10

    constructor(private readonly repository: AvaliacaoRiscoRepository) {}

    async avaliarRisco(transaction: TransactionEntity) {
        const riscoMediaGastoUsuario = await this.avaliarPadraoGastosUsuario(transaction)
        const listaRiscos = []

        let scoreRisco = 0
        let risco = "Baixo"

        listaRiscos.push(riscoMediaGastoUsuario)

        listaRiscos.forEach(risco => {
            scoreRisco += risco
        })

        if(scoreRisco >= this.MAX_SCORE_RISCO) {
            scoreRisco = this.MAX_SCORE_RISCO
        }

        switch(true) {
            case scoreRisco <= 2:
                risco = "Baixo"
                break
            case scoreRisco > 2 && scoreRisco < 6:
                risco = "Medio"
                break
            case scoreRisco >= 6:
                risco = "Alto"
                break
        }
        
        return {
            risco: risco,
            scoreRisco: scoreRisco
        }
    }

    async avaliarPadraoGastosUsuario(transaction: TransactionEntity) {
        const { records: recordsGetClientePelaConta } = await this.repository.getClientePelaConta(transaction.contaOrigem)

        const clienteResultado = recordsGetClientePelaConta[0]?.get('cliente')

        const { records: recordsPadraoGastosUsuario } = await this.repository.padraoGastosUsuario(clienteResultado.properties.cpf_cnpj)

        const estatisticas = {
            mediaGasto: recordsPadraoGastosUsuario[0]?.get('mediaGasto'),
            transacoes: recordsPadraoGastosUsuario[0]?.get('transacoes'),
            totalTransacoes: recordsPadraoGastosUsuario[0]?.get('totalTransacoes')
        }
        
        const difMediaValor = transaction.valor - estatisticas.mediaGasto 
        console.log(estatisticas.mediaGasto, transaction.valor)
        console.log(difMediaValor)
        
        // TODO: Adicionar motivo no retorno
        switch (true){
            case difMediaValor <= 0:
                return 0
            case difMediaValor > 0 && difMediaValor <= estatisticas.mediaGasto * 2:
                return 2
            case difMediaValor > estatisticas.mediaGasto * 2:
                return 3
        }

        return 0
        
    }

    async getAllNodes() {
        const { records } = await this.repository.getAllNodes()

        if (records.length === 0) {
            return {
                message: "Nenhum nó no banco de dados"
            }
        }
        
        return records
    }
}