import { Transaction } from "neo4j-driver";
import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type { AvaliacaoRiscoRepository } from "../repositories/avaliacao-risco.repository.ts";
import type RiscoInterface from "../interfaces/risco.interface.ts";
import type RegraAvaliacaoRisco from "../interfaces/regra-avaliacao-risco.interface.ts";
import { RegrasFactory } from "../factories/regras.factory.ts";

type Motivo = {
    nome: string,
    nivel: "Seguro" | "Médio" | "Alto"
}
interface AvaliacaoInterface {
    score: number,
    motivos: Motivo[]
}

// Aqui fica toda a logica de calcular o risco
export class AvaliacaoRiscoService {
    private readonly MAX_SCORE_RISCO = 10
    private readonly regras: RegraAvaliacaoRisco[]

    constructor(private readonly repository: AvaliacaoRiscoRepository) {
        this.regras = RegrasFactory.criarRegras(this.repository)
    }

    async avaliarRisco(transaction: TransactionEntity): Promise<AvaliacaoInterface> {
        const listaRiscos: RiscoInterface[] = []
        const avaliacao: AvaliacaoInterface = {
            score: 0,
            motivos: []
        }

        let somaPesos = 0;

        for (const regra of this.regras) {
            somaPesos += regra.peso
            const riscoRegra = await regra.avaliarRisco(transaction)

            avaliacao.score += riscoRegra.valor * regra.peso

            this.inserirMotivo(avaliacao.motivos, riscoRegra)

            // Debug
            // console.log(`${riscoRegra.motivo} (Peso: ${regra.peso}) = ${riscoRegra.valor}`)
            // console.log(`${riscoRegra.valor} * ${regra.peso} = ${riscoRegra.valor * regra.peso}`)
        }

        // Finalizar media ponderada
        avaliacao.score = Math.round(avaliacao.score / this.regras.length)


        avaliacao.score = Math.max(0, Math.min(10, avaliacao.score))

        return avaliacao
    }

    private inserirMotivo(listaMotivos: Motivo[], risco: RiscoInterface){
        if (risco.valor >= 4) {
            const motivo: Motivo = {
                nome: risco.motivo,
                nivel: risco.valor > 7 ? "Alto" : "Médio"
            }
            
            listaMotivos.push(motivo)
        } else if (risco.valor < 0) {
            const motivo: Motivo = {
                nome: risco.motivo,
                nivel: "Seguro"
            }

            listaMotivos.push(motivo)
        }
    }
}