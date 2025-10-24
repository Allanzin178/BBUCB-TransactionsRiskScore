export type EnumTipoTransacao = "PIX" | "TED"

export class TransactionEntity {
    tipoTransacao!: EnumTipoTransacao
    contaOrigem!: string
    contaDestino!: string 
    valor!: number
    dataTransacao: string | undefined

    constructor(transacao?: TransactionEntity) {
        if (transacao) {
            this.tipoTransacao = transacao.tipoTransacao
            this.contaOrigem = transacao.contaOrigem
            this.contaDestino = transacao.contaDestino
            this.valor = transacao.valor
            this.dataTransacao = transacao?.dataTransacao || (new Date).toISOString()
        }
    }
}