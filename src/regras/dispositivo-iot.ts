import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type RegraAvaliacaoRisco from "../interfaces/regra-avaliacao-risco.interface.ts";
import type RiscoInterface from "../interfaces/risco.interface.ts";
import type { AvaliacaoRiscoRepository } from "../repositories/avaliacao-risco.repository.ts";

export default class RegraDispositivoIoT implements RegraAvaliacaoRisco {
    readonly peso = 3;
    private readonly repository: AvaliacaoRiscoRepository;
    
    constructor(repository: AvaliacaoRiscoRepository){
        this.repository = repository;
    }

    async avaliarRisco(transacao: TransactionEntity): Promise<RiscoInterface> {
        const risco: RiscoInterface = {
            valor: 0,
            motivo: "Dispositivo IoT"
        }
        
        const { records: recordsCliente } = await this.repository.getClientePelaConta(transacao.contaOrigem);
        const cliente = recordsCliente[0]?.get('cliente');
        
        if (!cliente) {
            return risco;
        }

        const { records } = await this.repository.getDispositivoUtilizado(cliente.properties.cpf_cnpj);
        const dispositivo = records[0]?.get('dispositivo');
        
        if (dispositivo && dispositivo.properties.tipo === 'iot') {
            risco.valor = 10;
        }
        
        return risco;
    }
}