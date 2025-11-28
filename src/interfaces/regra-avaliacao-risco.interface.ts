import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type RiscoInterface from "./risco.interface.ts";

export default interface RegraAvaliacaoRisco {
    peso: number;
    avaliarRisco(transacao: TransactionEntity): Promise<RiscoInterface>;
}