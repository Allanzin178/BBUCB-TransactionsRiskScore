import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type RegraAvaliacaoRisco from "../interfaces/regra-avaliacao-risco.interface.ts";
import type RiscoInterface from "../interfaces/risco.interface.ts";
import type { AvaliacaoRiscoRepository } from "../repositories/avaliacao-risco.repository.ts";

export default class RegraContaSuspeita implements RegraAvaliacaoRisco {
    readonly peso = 8;
    private readonly repository: AvaliacaoRiscoRepository;
    
    constructor(repository: AvaliacaoRiscoRepository){
        this.repository = repository;
    }

    async avaliarRisco(transacao: TransactionEntity): Promise<RiscoInterface> {
        const risco: RiscoInterface = {
            valor: 0,
            motivo: "Conta destino marcada como suspeita"
        }
        
        const { records } = await this.repository.getDadosCompletos(transacao.contaDestino);
        const conta = records[0]?.get('conta');

        if (conta && conta.properties.suspeito === true) {
            risco.valor = 10;
        }

        return risco;
    }
}