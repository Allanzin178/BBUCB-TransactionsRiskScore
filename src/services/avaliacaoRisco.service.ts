import { Transaction } from "neo4j-driver";
import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type { AvaliacaoRiscoRepository } from "../repositories/avaliacaoRisco.repository.ts";

type Motivo = {
    nome: string,
    nivel: "Médio" | "Alto"
}
interface AvaliacaoInterface {
    score: number,
    motivos: Motivo[]
}

interface RiscoInterface {
    valor: number,
    motivo: string,
}

// Aqui fica toda a logica de calcular o risco
export class AvaliacaoRiscoService {
    private readonly MAX_SCORE_RISCO = 10

    constructor(private readonly repository: AvaliacaoRiscoRepository) {}

    async avaliarRisco(transaction: TransactionEntity): Promise<AvaliacaoInterface> {
        const riscoMediaGastoUsuario: RiscoInterface = await this.avaliarPadraoGastosUsuario(transaction) 
        const riscoHoraDaTransacao = await this.avaliarHoraDaTransacao(transaction)

        const listaRiscos: RiscoInterface[] = []
        const avaliacao: AvaliacaoInterface = {
            score: 0,
            motivos: []
        }

        listaRiscos.push(riscoMediaGastoUsuario)
        listaRiscos.push(riscoHoraDaTransacao)

        listaRiscos.forEach((risco) => {
            avaliacao.score += risco.valor

            if (risco.valor >= 2) {
                const motivo: Motivo = {
                    nome: risco.motivo,
                    nivel: risco.valor > 2 ? "Alto" : "Médio"
                }
                
                avaliacao.motivos.push(motivo)
            }
        })

        if(avaliacao.score >= this.MAX_SCORE_RISCO) {
            avaliacao.score = this.MAX_SCORE_RISCO
        }

        return avaliacao
    }

    async avaliarPadraoGastosUsuario(transaction: TransactionEntity): Promise<RiscoInterface> {
        let risco = 0;
        const { records: recordsGetClientePelaConta } = await this.repository.getClientePelaConta(transaction.contaOrigem)

        const clienteResultado = recordsGetClientePelaConta[0]?.get('cliente')

        const { records: recordsPadraoGastosUsuario } = await this.repository.padraoGastosUsuario(clienteResultado.properties.cpf_cnpj)

        const estatisticas = {
            mediaGasto: recordsPadraoGastosUsuario[0]?.get('mediaGasto'),
            transacoes: recordsPadraoGastosUsuario[0]?.get('transacoes'),
            totalTransacoes: recordsPadraoGastosUsuario[0]?.get('totalTransacoes')
        }
        
        const difMediaValor = transaction.valor - estatisticas.mediaGasto 
        console.log(estatisticas.mediaGasto, transaction.valor)
        console.log(difMediaValor)
        
        switch (true){
            case difMediaValor <= 0:
                risco = 0
                break
            case difMediaValor > 0 && difMediaValor <= estatisticas.mediaGasto * 2:
                risco = 2
                break
            case difMediaValor > estatisticas.mediaGasto * 2:
                risco = 3
                break
        }

        return {
            valor: risco,
            motivo: "Média de gastos irregular"
        }
        
    }

    async avaliarHoraDaTransacao(transacao: TransactionEntity): Promise<RiscoInterface>{
        let risco = 0
        const date = new Date(transacao.dataTransacao!); // converte a string para Date
        const hour = date.getHours();  
        if(hour >=22 || hour < 6){
            risco = 2
        }
        return {
            valor: risco,
            motivo: "Transação em horário suspeito"
        }
    }

    async getAllNodes() {
        const { records } = await this.repository.getAllNodes()

        if (records.length === 0) {
            return {
                message: "Nenhum nó no banco de dados"
            }
        }
        
        return records
    }
}