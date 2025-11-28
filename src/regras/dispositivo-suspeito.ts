import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type RegraAvaliacaoRisco from "../interfaces/regra-avaliacao-risco.interface.ts";
import type RiscoInterface from "../interfaces/risco.interface.ts";
import type { AvaliacaoRiscoRepository } from "../repositories/avaliacao-risco.repository.ts";

export default class RegraDispositivoSuspeito implements RegraAvaliacaoRisco {
    readonly peso = 8;
    private readonly repository: AvaliacaoRiscoRepository;
    
    constructor(repository: AvaliacaoRiscoRepository){
        this.repository = repository;
    }

    async avaliarRisco(transacao: TransactionEntity): Promise<RiscoInterface> {
        const risco: RiscoInterface = {
            valor: 0,
            motivo: "Dispositivo da conta destino marcado como suspeito"
        }
        
        const { records } = await this.repository.getDadosCompletos(transacao.contaDestino);
        const cliente = records[0]?.get('cliente');
        
        if (!cliente) {
            return risco;
        }

        const { records: recordsDispositivo } = await this.repository.getDispositivoUtilizado(cliente.properties.cpf_cnpj);
        const dispositivo = recordsDispositivo[0]?.get('dispositivo');

        if (dispositivo && dispositivo.properties.suspeito === true) {
            risco.valor = 10;
        }

        return risco;
    }
}