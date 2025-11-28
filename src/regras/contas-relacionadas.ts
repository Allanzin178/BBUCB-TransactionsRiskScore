import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type RegraAvaliacaoRisco from "../interfaces/regra-avaliacao-risco.interface.ts";
import type RiscoInterface from "../interfaces/risco.interface.ts";
import type { AvaliacaoRiscoRepository } from "../repositories/avaliacao-risco.repository.ts";

export default class RegraContasRelacionadas implements RegraAvaliacaoRisco {
    readonly peso = 1;
    private readonly repository: AvaliacaoRiscoRepository;
    
    constructor(repository: AvaliacaoRiscoRepository){
        this.repository = repository;
    }

    async avaliarRisco(transacao: TransactionEntity): Promise<RiscoInterface> {
        const { records } = await this.repository.verificarRelacionamentoContas(
            transacao.contaOrigem,
            transacao.contaDestino
        )

        const risco: RiscoInterface = {
            valor: 0,
            motivo: "Transação entre contas não relacionadas"
        }

        const path = records[0]?.get('path')

        if (path) {
            risco.valor = -2
            risco.motivo = "Transação entre contas relacionadas"
        }

        return risco

    }
}