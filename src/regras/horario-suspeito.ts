import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type RegraAvaliacaoRisco from "../interfaces/regra-avaliacao-risco.interface.ts";
import type RiscoInterface from "../interfaces/risco.interface.ts";

export default class RegraHorarioSuspeito implements RegraAvaliacaoRisco {
    readonly peso = 5;
    
    async avaliarRisco(transacao: TransactionEntity): Promise<RiscoInterface> {
        const risco: RiscoInterface = {
            valor: 0,
            motivo: "Transação em horário suspeito"
        }
        
        const date = new Date(transacao.dataTransacao!);
        const hour = date.getHours();  
        if(hour >=22 || hour < 6){
            risco.valor = 7
        }
        
        return risco
    }
}