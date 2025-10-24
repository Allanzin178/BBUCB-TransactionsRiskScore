import type { Request, Response } from "express";
import type { AvaliacaoRiscoService } from "../services/avaliacaoRisco.service.ts";
import { TransactionEntity } from "../entities/transaction.entity.ts";

export class AvaliacaoRiscoController {
    constructor(private readonly service: AvaliacaoRiscoService) {}

    async avaliarRisco(req: Request, res: Response){
        const transacao = new TransactionEntity(req.body)

        const result = await this.service.avaliarRisco(transacao)
        console.log(result)

        return res.status(200).json({ message: "Calculo feito com sucesso!", result: result })
    }
}