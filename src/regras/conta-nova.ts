import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type RegraAvaliacaoRisco from "../interfaces/regra-avaliacao-risco.interface.ts";
import type RiscoInterface from "../interfaces/risco.interface.ts";
import type { AvaliacaoRiscoRepository } from "../repositories/avaliacao-risco.repository.ts";

export default class RegraContaNova implements RegraAvaliacaoRisco {
    readonly peso = 5;
    private readonly repository: AvaliacaoRiscoRepository;
    
    constructor(repository: AvaliacaoRiscoRepository){
        this.repository = repository;
    }

    async avaliarRisco(transacao: TransactionEntity): Promise<RiscoInterface> {
        const risco: RiscoInterface = {
            valor: 0,
            motivo: "Conta nova"
        }
        
        const { records } = await this.repository.getDadosConta(transacao.contaOrigem);
        const conta = records[0]?.get('conta');
        const idadeConta = records[0]?.get('idadeConta');

        if (conta && idadeConta) {
            const dias = idadeConta.days?.toNumber() || 0;
            const meses = idadeConta.months?.toNumber() || 0;

            if (dias < 30 && meses === 0) {
                risco.valor = 10;
                risco.motivo = "Conta muito nova (menos de 30 dias)";
            } else if (dias < 90 && meses < 3) {
                risco.valor = 7;
                risco.motivo = "Conta nova (menos de 90 dias)";
            }
        }

        return risco;
    }
}