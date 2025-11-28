import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type RegraAvaliacaoRisco from "../interfaces/regra-avaliacao-risco.interface.ts";
import type RiscoInterface from "../interfaces/risco.interface.ts";
import type { AvaliacaoRiscoRepository } from "../repositories/avaliacao-risco.repository.ts";

export default class RegraIntervaloTransacoesIrregular implements RegraAvaliacaoRisco {
    readonly peso = 4;
    private readonly repository: AvaliacaoRiscoRepository;
    
    constructor(repository: AvaliacaoRiscoRepository){
        this.repository = repository;
    }

    async avaliarRisco(transacao: TransactionEntity): Promise<RiscoInterface> {
        const risco: RiscoInterface = {
            valor: 0,
            motivo: "Velocidade de transações normal"
        }
        
        const { records: recordsCliente } = await this.repository.getClientePelaConta(transacao.contaOrigem);
        const cliente = recordsCliente[0]?.get('cliente');
        
        if (!cliente) {
            return risco;
        }

        const { records: recordsRecentes } = await this.repository.contarTransacoesRecentes(
            cliente.properties.cpf_cnpj,
            60
        );

        const totalTransacoesRecentes = recordsRecentes[0]?.get('totalTransacoesRecentes')?.toNumber() || 0;

        if (totalTransacoesRecentes >= 5) {
            risco.valor = 8;
            risco.motivo = "Muitas transações em curto período";
        } else if (totalTransacoesRecentes >= 3) {
            risco.valor = 6;
            risco.motivo = "Velocidade de transações acima do normal";
        }

        return risco;
    }
}