import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type RegraAvaliacaoRisco from "../interfaces/regra-avaliacao-risco.interface.ts";

class RegraContaNova implements RegraAvaliacaoRisco {
    readonly peso = 5;

    avaliarRisco(transacao: TransactionEntity): number {
        
        return 0 * this.peso;
    }
}