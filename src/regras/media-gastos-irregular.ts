import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type RegraAvaliacaoRisco from "../interfaces/regra-avaliacao-risco.interface.ts";
import type RiscoInterface from "../interfaces/risco.interface.ts";
import type { AvaliacaoRiscoRepository } from "../repositories/avaliacao-risco.repository.ts";

export default class RegraMediaGastosIrregular implements RegraAvaliacaoRisco {
    readonly peso = 3;
    private readonly repository: AvaliacaoRiscoRepository;
    
    constructor(repository: AvaliacaoRiscoRepository){
        this.repository = repository;
    }

    async avaliarRisco(transacao: TransactionEntity): Promise<RiscoInterface> {
        const risco: RiscoInterface = {
            valor: 0,
            motivo: "Média de gastos irregular"
        }
        
        const { records: recordsCliente } = await this.repository.getClientePelaConta(transacao.contaOrigem);
        const cliente = recordsCliente[0]?.get('cliente');
        
        if (!cliente) {
            return risco;
        }

        const { records: recordsPadraoGastos } = await this.repository.padraoGastosUsuario(cliente.properties.cpf_cnpj);

        const estatisticas = {
            mediaGasto: recordsPadraoGastos[0]?.get('mediaGasto'),
            transacoes: recordsPadraoGastos[0]?.get('transacoes'),
            totalTransacoes: recordsPadraoGastos[0]?.get('totalTransacoes')
        };
        
        const difMediaValor = transacao.valor - estatisticas.mediaGasto;
        
        
        switch (true){
            case difMediaValor <= 0:
                risco.valor = 0;
                break;
            case difMediaValor > 0 && difMediaValor <= estatisticas.mediaGasto * 1.5:
                risco.valor = 5;
                break;
            case difMediaValor > estatisticas.mediaGasto * 1.5:
                risco.valor = 10;
                break;
        }

        return risco;
    }
}