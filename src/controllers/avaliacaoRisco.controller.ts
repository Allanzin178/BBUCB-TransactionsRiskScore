import type { Request, Response } from "express";
import type { AvaliacaoRiscoService } from "../services/avaliacaoRisco.service.ts";
import { TransactionEntity } from "../entities/transaction.entity.ts";

export class AvaliacaoRiscoController {
    constructor(private readonly service: AvaliacaoRiscoService) {}

    async avaliarRisco(req: Request, res: Response){
        try {
            const { contaOrigem, contaDestino, valor, tipoTransacao, dataTransacao } = req.body;

            if (!contaOrigem) {
                return res.status(400).json({ 
                    error: "Conta de origem é obrigatória",
                    field: "contaOrigem"
                });
            }

            if (!contaDestino) {
                return res.status(400).json({ 
                    error: "Conta de destino é obrigatória",
                    field: "contaDestino"
                });
            }

            if (valor === undefined || valor === null) {
                return res.status(400).json({ 
                    error: "Valor da transação é obrigatório",
                    field: "valor"
                });
            }

            if (typeof valor !== 'number' || valor <= 0) {
                return res.status(400).json({ 
                    error: "Valor da transação deve ser um número positivo",
                    field: "valor",
                });
            }

            if (!tipoTransacao) {
                return res.status(400).json({ 
                    error: "Tipo de transação é obrigatório",
                    field: "tipoTransacao"
                });
            }

            const tiposPermitidos = ['PIX', 'TED', 'DOC', 'TRANSFERENCIA'];
            if (!tiposPermitidos.includes(tipoTransacao.toUpperCase())) {
                return res.status(400).json({ 
                    error: "Tipo de transação inválido",
                    field: "tipoTransacao",
                    allowedTypes: tiposPermitidos,
                    receivedType: tipoTransacao
                });
            }

            if (contaOrigem === contaDestino) {
                return res.status(400).json({ 
                    error: "Conta de origem e destino não podem ser iguais",
                    fields: ["contaOrigem", "contaDestino"]
                });
            }

            if (dataTransacao) {
                const dataValida = new Date(dataTransacao);
                if (isNaN(dataValida.getTime())) {
                    return res.status(400).json({ 
                        error: "Data da transação inválida",
                        field: "dataTransacao",
                        receivedValue: dataTransacao,
                        expectedFormat: "ISO 8601 (ex: 2025-11-21T10:30:00)"
                    });
                }
            }

            const transacao = new TransactionEntity(req.body);
            const result = await this.service.avaliarRisco(transacao);

            return res.status(200).json({ 
                message: "Cálculo feito com sucesso!", 
                result: result 
            });

        } catch (error) {
            console.error("Erro ao avaliar risco:", error);
            
            return res.status(500).json({ 
                error: "Erro interno ao processar a avaliação de risco",
                message: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }
    }
}