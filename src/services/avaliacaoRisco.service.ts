import { Transaction } from "neo4j-driver";
import type { TransactionEntity } from "../entities/transaction.entity.ts";
import type { AvaliacaoRiscoRepository } from "../repositories/avaliacaoRisco.repository.ts";

type Motivo = {
    nome: string,
    nivel: "Negativo" | "Médio" | "Alto"
}
interface AvaliacaoInterface {
    score: number,
    motivos: Motivo[]
}

interface RiscoInterface {
    valor: number,
    motivo: string,
}

interface DadosCompletos {
    cliente: any;
    conta: any;
    dispositivos: any;
    ips: any;

    dispositivoUtilizado: any,
    ipUtilizado: any,
    ultimoLogin: any,

    logins: any;
}

// Aqui fica toda a logica de calcular o risco
export class AvaliacaoRiscoService {
    private readonly MAX_SCORE_RISCO = 10

    constructor(private readonly repository: AvaliacaoRiscoRepository) {}

    async avaliarRisco(transaction: TransactionEntity): Promise<AvaliacaoInterface> {
        const dadosCompletosOrigem = await this.pegarDadosCompletosConta(transaction.contaOrigem)
        const dadosCompletosDestino = await this.pegarDadosCompletosConta(transaction.contaDestino)

        const riscoMediaGastoUsuario: RiscoInterface = await this.avaliarPadraoGastosUsuario(transaction, dadosCompletosOrigem) 
        const riscoHoraDaTransacao = await this.avaliarHoraDaTransacao(transaction)
        const riscosDispositivo = await this.avaliarDispositivo(transaction, dadosCompletosOrigem)
        const riscosIP = await this.avaliarIP(transaction, dadosCompletosOrigem)
        const riscoRelacionamento = await this.avaliarRelacionamentoContas(transaction)
        const riscoVelocidadeTransacoes = await this.avaliarVelocidadeTransacoes(transaction, dadosCompletosOrigem)
        const riscoContaNova = await this.avaliarContaNova(transaction)
        const riscosContaDestinoSuspeita = await this.avaliarContaDestinoSuspeita(transaction, dadosCompletosDestino)

        const listaRiscos: RiscoInterface[] = []
        const avaliacao: AvaliacaoInterface = {
            score: 0,
            motivos: []
        }

        listaRiscos.push(riscoMediaGastoUsuario)
        listaRiscos.push(riscoHoraDaTransacao)
        listaRiscos.push(...riscosDispositivo)
        listaRiscos.push(...riscosIP)
        listaRiscos.push(riscoRelacionamento)
        listaRiscos.push(riscoVelocidadeTransacoes)
        listaRiscos.push(riscoContaNova)
        listaRiscos.push(...riscosContaDestinoSuspeita)

        listaRiscos.forEach((risco) => {
            avaliacao.score += risco.valor

            if (risco.valor >= 2) {
                const motivo: Motivo = {
                    nome: risco.motivo,
                    nivel: risco.valor > 2 ? "Alto" : "Médio"
                }
                
                avaliacao.motivos.push(motivo)
            } else if (risco.valor < 0) {
                const motivo: Motivo = {
                    nome: risco.motivo,
                    nivel: "Negativo"
                }

                avaliacao.motivos.push(motivo)
            }


        })

        if(avaliacao.score >= this.MAX_SCORE_RISCO) {
            avaliacao.score = this.MAX_SCORE_RISCO
        }

        if(avaliacao.score < 0) {
            avaliacao.score = 0
        }

        return avaliacao
    }

    private async pegarDadosCompletosConta(conta: string): Promise<DadosCompletos>{
        const { records } = await this.repository.getDadosCompletos(conta)
        const record = records[0]!;

        const cliente = record.get('cliente')
        const { records: recordsUltimoDispositivo } = await this.repository.getDispositivoUtilizado(cliente.properties.cpf_cnpj)
        const recordUltimoDispositivo = recordsUltimoDispositivo[0]!


        const dadosCompletos: DadosCompletos = {
            cliente: cliente,
            conta: record.get('conta'),
            dispositivos: record.get('dispositivo'),
            ips: record.get('ip'),

            dispositivoUtilizado: recordUltimoDispositivo.get('dispositivo'),
            ipUtilizado: recordUltimoDispositivo.get('ip'),
            ultimoLogin: recordUltimoDispositivo.get('log'),

            logins: record.get('log')
        }

        return dadosCompletos
    }

    async avaliarPadraoGastosUsuario(transaction: TransactionEntity, dadosCompletos: DadosCompletos): Promise<RiscoInterface> {
        let risco = 0;
        const { cliente } = dadosCompletos

        const { records: recordsPadraoGastosUsuario } = await this.repository.padraoGastosUsuario(cliente.properties.cpf_cnpj)

        const estatisticas = {
            mediaGasto: recordsPadraoGastosUsuario[0]?.get('mediaGasto'),
            transacoes: recordsPadraoGastosUsuario[0]?.get('transacoes'),
            totalTransacoes: recordsPadraoGastosUsuario[0]?.get('totalTransacoes')
        }
        
        const difMediaValor = transaction.valor - estatisticas.mediaGasto 
        
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

    async avaliarDispositivo(transaction: TransactionEntity, dadosCompletosOrigem: DadosCompletos): Promise<RiscoInterface[]> {
        const { dispositivoUtilizado, ultimoLogin } = dadosCompletosOrigem

        const riscos: RiscoInterface[] = []

        riscos.push(await this.avaliarDispositivoIoT(dispositivoUtilizado))
        riscos.push(await this.avaliarDispositivoNovo(ultimoLogin, transaction.dataTransacao))

        return riscos
    }

    async avaliarDispositivoIoT(dispositivo: any): Promise<RiscoInterface> {
        if (dispositivo && dispositivo.properties.tipo === 'iot') {
            return {
                valor: 3,
                motivo: "Dispositivo IoT"
            }
        }
        return { valor: 0, motivo: "" }
    }

    async avaliarDispositivoNovo(logData: any, dataTransacao: string | undefined): Promise<RiscoInterface> {
        if (logData && dataTransacao) {
            const dataLog = new Date(logData.properties.data)
            const dataTransacaoDate = new Date(dataTransacao)
            const diffDias = (dataTransacaoDate.getTime() - dataLog.getTime()) / (1000 * 60 * 60 * 24)
            
            if (diffDias < 7) {
                return {
                    valor: 2,
                    motivo: "Dispositivo novo"
                }
            }
        }
        return { valor: 0, motivo: "" }
    }


    async avaliarIP(transaction: TransactionEntity, dadosCompletosOrigem: DadosCompletos): Promise<RiscoInterface[]> {
        const { cliente, ipUtilizado } = dadosCompletosOrigem

        const riscos: RiscoInterface[] = []

        riscos.push(await this.avaliarVPN(ipUtilizado))
        riscos.push(await this.avaliarIPEstrangeiro(ipUtilizado))

        return riscos
    }

    async avaliarVPN(ip: any): Promise<RiscoInterface> {
        if (ip && ip.properties.tipo === 'vpn') {
            return {
                valor: 2,
                motivo: "Uso de VPN"
            }
        }
        return { valor: 0, motivo: "" }
    }

    async avaliarIPEstrangeiro(ip: any): Promise<RiscoInterface> {
        if (ip && ip.properties.pais !== 'BR') {
            return {
                valor: 2,
                motivo: "IP estrangeiro"
            }
        }
        return { valor: 0, motivo: "" }
    }

    async avaliarRelacionamentoContas(transaction: TransactionEntity): Promise<RiscoInterface> {
        const { records } = await this.repository.verificarRelacionamentoContas(
            transaction.contaOrigem,
            transaction.contaDestino
        )

        const path = records[0]?.get('path')

        if (path) {
            return {
                valor: -1,
                motivo: "Transação entre contas relacionadas"
            }
        }

        return { valor: 0, motivo: "" }
    }

    async avaliarVelocidadeTransacoes(transaction: TransactionEntity, dadosCompletosOrigem: DadosCompletos): Promise<RiscoInterface> {
        const { cliente } = dadosCompletosOrigem

        const { records: recordsRecentes } = await this.repository.contarTransacoesRecentes(
            cliente.properties.cpf_cnpj,
            60
        )

        const totalTransacoesRecentes = recordsRecentes[0]?.get('totalTransacoesRecentes')?.toNumber() || 0

        if (totalTransacoesRecentes >= 5) {
            return {
                valor: 3,
                motivo: "Muitas transações em curto período"
            }
        } else if (totalTransacoesRecentes >= 3) {
            return {
                valor: 2,
                motivo: "Velocidade de transações acima do normal"
            }
        }

        return { valor: 0, motivo: "" }
    }

    async avaliarContaNova(transaction: TransactionEntity): Promise<RiscoInterface> {
        const { records } = await this.repository.getDadosConta(transaction.contaOrigem)
        const conta = records[0]?.get('conta')
        const idadeConta = records[0]?.get('idadeConta')

        if (conta && idadeConta) {
            const dias = idadeConta.days?.toNumber() || 0
            const meses = idadeConta.months?.toNumber() || 0

            if (dias < 30 && meses === 0) {
                return {
                    valor: 3,
                    motivo: "Conta muito nova (menos de 30 dias)"
                }
            } else if (dias < 90 && meses < 3) {
                return {
                    valor: 2,
                    motivo: "Conta nova (menos de 90 dias)"
                }
            }
        }

        return { valor: 0, motivo: "" }
    }

    async avaliarContaDestinoSuspeita(transaction: TransactionEntity, dadosCompletosDestino: DadosCompletos): Promise<RiscoInterface[]> {
        const riscos: RiscoInterface[] = []

        riscos.push(await this.avaliarContaSuspeita(dadosCompletosDestino.conta))
        riscos.push(await this.avaliarClienteDestinoSuspeito(dadosCompletosDestino.cliente))
        riscos.push(await this.avaliarDispositivoDestinoSuspeito(dadosCompletosDestino.dispositivoUtilizado))
        riscos.push(await this.avaliarIPDestinoSuspeito(dadosCompletosDestino.ipUtilizado))

        return riscos
    }

    async avaliarContaSuspeita(contaDestino: any): Promise<RiscoInterface> {
        const conta = contaDestino

        if (conta && conta.properties.suspeito === true) {
            return {
                valor: 3,
                motivo: "Conta destino marcada como suspeita"
            }
        }

        return { valor: 0, motivo: "" }
    }

    async avaliarClienteDestinoSuspeito(clienteDestino: any): Promise<RiscoInterface> {
        const cliente = clienteDestino

        if (cliente && cliente.properties.suspeito === true) {
            return {
                valor: 3,
                motivo: "Cliente destino marcado como suspeito"
            }
        }

        return { valor: 0, motivo: "" }
    }

    async avaliarDispositivoDestinoSuspeito(dispositivoDestino: any): Promise<RiscoInterface> {
        const dispositivo = dispositivoDestino

        if (dispositivo && dispositivo.properties.suspeito === true) {
            return {
                valor: 3,
                motivo: "Dispositivo da conta destino marcado como suspeito"
            }
        }

        return { valor: 0, motivo: "" }
    }

    async avaliarIPDestinoSuspeito(ipDestino: any): Promise<RiscoInterface> {
        const ip = ipDestino

        if (ip && ip.properties.suspeito === true) {
            return {
                valor: 3,
                motivo: "IP da conta destino marcado como suspeito"
            }
        }

        return { valor: 0, motivo: "" }
    }

}