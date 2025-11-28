import type { AvaliacaoRiscoRepository } from "../repositories/avaliacao-risco.repository.ts";
import RegraContasRelacionadas from "../regras/contas-relacionadas.ts";
import RegraMediaGastosIrregular from "../regras/media-gastos-irregular.ts";
import RegraDispositivoIoT from "../regras/dispositivo-iot.ts";
import RegraIntervaloTransacoesIrregular from "../regras/intervalo-transacoes-irregular.ts";
import RegraIPVPN from "../regras/ip-vpn.ts";
import RegraIPEstrangeiro from "../regras/ip-estrangeiro.ts";
import RegraContaNova from "../regras/conta-nova.ts";
import RegraHorarioSuspeito from "../regras/horario-suspeito.ts";
import RegraDispositivoNovo from "../regras/dispositivo-novo.ts";
import RegraIPSuspeito from "../regras/ip-suspeito.ts";
import RegraContaSuspeita from "../regras/conta-suspeita.ts";
import RegraDispositivoSuspeito from "../regras/dispositivo-suspeito.ts";
import RegraClienteSuspeito from "../regras/cliente-suspeito.ts";

export class RegrasFactory {
    static criarRegras(repository: AvaliacaoRiscoRepository){
        return [
            new RegraContasRelacionadas(repository),          
            new RegraMediaGastosIrregular(repository),        
            new RegraDispositivoIoT(repository),              
            new RegraIntervaloTransacoesIrregular(repository),
            new RegraIPVPN(repository),                       
            new RegraIPEstrangeiro(repository),               
            new RegraContaNova(repository),                   
            new RegraHorarioSuspeito(),                       
            new RegraDispositivoNovo(repository),             
            new RegraIPSuspeito(repository),                  
            new RegraContaSuspeita(repository),               
            new RegraDispositivoSuspeito(repository),         
            new RegraClienteSuspeito(repository),             
        ]
    }
}