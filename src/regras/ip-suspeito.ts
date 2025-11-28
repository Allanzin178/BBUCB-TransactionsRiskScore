import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type RegraAvaliacaoRisco from "../interfaces/regra-avaliacao-risco.interface.ts";
import type RiscoInterface from "../interfaces/risco.interface.ts";
import type { AvaliacaoRiscoRepository } from "../repositories/avaliacao-risco.repository.ts";

export default class RegraIPSuspeito implements RegraAvaliacaoRisco {
    readonly peso = 7;
    private readonly repository: AvaliacaoRiscoRepository;
    
    constructor(repository: AvaliacaoRiscoRepository){
        this.repository = repository;
    }

    async avaliarRisco(transacao: TransactionEntity): Promise<RiscoInterface> {
        const risco: RiscoInterface = {
            valor: 0,
            motivo: "IP da conta destino marcado como suspeito"
        }
        
        const { records } = await this.repository.getDadosCompletos(transacao.contaDestino);
        const cliente = records[0]?.get('cliente');
        
        if (!cliente) {
            return risco;
        }

        const { records: recordsIP } = await this.repository.getDispositivoUtilizado(cliente.properties.cpf_cnpj);
        const ip = recordsIP[0]?.get('ip');

        if (ip && ip.properties.suspeito === true) {
            risco.valor = 10;
        }

        return risco;
    }
}