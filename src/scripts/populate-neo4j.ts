import path from "path";
import { DriverService } from "../config/neo4j.config.ts";
import fs from 'fs/promises'
import { fileURLToPath } from "url";
import readline from "readline/promises";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pastaArtefatos = path.join(__dirname, '..', '..', 'artefatos')

async function executeBigQueryString(bigQueryStr: string, neo4jDriver: DriverService) {
    const arrQueries = bigQueryStr
        .split(';') // Separa por ponto e vírgula
        .map((query) => query.trim()) // Tira os espaços no inicio e final das strings das queries
        .filter((query) => query.length > 0) // Filtra pra tirar todas queries que forem vazias

    let todasBemSucedidas = true

    for(const query of arrQueries) {
        try {
            await neo4jDriver.executeQuery(query)
        } catch (error) {
            todasBemSucedidas = false
            console.log("Erro ao executar: " + query)
           console.log(error)
        } 
    }

    todasBemSucedidas && console.log("Todas foram bem sucedidas")
    return todasBemSucedidas
}

async function executeQueryString(queryStr: string, neo4jDriver: DriverService) {
    try {
        await neo4jDriver.executeQuery(queryStr)
    } catch (error: any) {
        if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
            console.log('Erro de constraint: Tentativa de inserir registros com campos unicos iguais');
            console.log('Detalhes:', error.message);
            return
        } 

        console.log(error)
    }
}

async function main() {
    const constraintsFile = path.join(pastaArtefatos, 'constraints01.txt')
    const creationFile = path.join(pastaArtefatos, 'creation01.txt')

    const constraintsStr = await fs.readFile(constraintsFile, 'utf-8')
    const creationStr = await fs.readFile(creationFile, 'utf-8')

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    await rl.question("[AVISO] Se você tiver um banco importante conectado, lembre de trocar para o que será utilizado. Se estiver usando o docker ignore esse aviso (enter para continuar)")

    const neo4jDriver = new DriverService({
        verbose: false
    })

    executeBigQueryString(constraintsStr, neo4jDriver)
    executeQueryString(creationStr, neo4jDriver)
}

main()
