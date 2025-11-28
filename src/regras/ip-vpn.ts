import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type RegraAvaliacaoRisco from "../interfaces/regra-avaliacao-risco.interface.ts";
import type RiscoInterface from "../interfaces/risco.interface.ts";
import type { AvaliacaoRiscoRepository } from "../repositories/avaliacao-risco.repository.ts";

export default class RegraIPVPN implements RegraAvaliacaoRisco {
    readonly peso = 4;
    private readonly repository: AvaliacaoRiscoRepository;
    
    constructor(repository: AvaliacaoRiscoRepository){
        this.repository = repository;
    }

    async avaliarRisco(transacao: TransactionEntity): Promise<RiscoInterface> {
        const risco: RiscoInterface = {
            valor: 0,
            motivo: "Uso de VPN"
        }
        
        const { records: recordsCliente } = await this.repository.getClientePelaConta(transacao.contaOrigem);
        const cliente = recordsCliente[0]?.get('cliente');
        
        if (!cliente) {
            return risco;
        }

        const { records } = await this.repository.getDispositivoUtilizado(cliente.properties.cpf_cnpj);
        const ip = records[0]?.get('ip');
        
        if (ip && ip.properties.tipo === 'vpn') {
            risco.valor = 10;
        }
        
        return risco;
    }
}