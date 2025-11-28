import type { TransactionEntity } from "../entities/transaction.entity.ts";

export default interface RegraAvaliacaoRisco {
    peso: number;
    avaliarRisco(transacao: TransactionEntity): number;
}