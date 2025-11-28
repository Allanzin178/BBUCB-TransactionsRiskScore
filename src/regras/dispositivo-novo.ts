import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type RegraAvaliacaoRisco from "../interfaces/regra-avaliacao-risco.interface.ts";
import type RiscoInterface from "../interfaces/risco.interface.ts";
import type { AvaliacaoRiscoRepository } from "../repositories/avaliacao-risco.repository.ts";

export default class RegraDispositivoNovo implements RegraAvaliacaoRisco {
    readonly peso = 6;
    private readonly repository: AvaliacaoRiscoRepository;
    
    constructor(repository: AvaliacaoRiscoRepository){
        this.repository = repository;
    }

    async avaliarRisco(transacao: TransactionEntity): Promise<RiscoInterface> {
        const risco: RiscoInterface = {
            valor: 0,
            motivo: "Dispositivo novo"
        }
        
        const { records: recordsCliente } = await this.repository.getClientePelaConta(transacao.contaOrigem);
        const cliente = recordsCliente[0]?.get('cliente');
        
        if (!cliente) {
            return risco;
        }

        const { records } = await this.repository.getDispositivoUtilizado(cliente.properties.cpf_cnpj);
        const logData = records[0]?.get('log');
        
        if (logData && transacao.dataTransacao) {
            const dataLog = new Date(logData.properties.data);
            const dataTransacaoDate = new Date(transacao.dataTransacao);
            const diffDias = (dataTransacaoDate.getTime() - dataLog.getTime()) / (1000 * 60 * 60 * 24);
            
            if (diffDias < 3) {
                risco.valor = 10;
            } else if (diffDias >= 3 && diffDias <= 7){
                risco.valor = 7;
            }
        }
        
        return risco;
    }
}