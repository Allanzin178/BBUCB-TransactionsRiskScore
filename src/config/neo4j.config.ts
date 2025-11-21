import neo4j, { Driver, EagerResult } from 'neo4j-driver'
import dotenv from 'dotenv'
dotenv.config()

type DriverConfigs = {
    verbose?: boolean
}
export class DriverService {
    private driver: Driver
    private exitSignals: Array<string> = ['SIGTERM', 'SIGINT', 'SIGQUIT', 'SIGHUP'];

    constructor(config?: DriverConfigs) {
        if (!process.env.NEO4J_PASSWORD){
            throw new Error("NEO4J_PASSWORD não está definido no .env")
        }

        this.driver = neo4j.driver(
            'neo4j://localhost',
            neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD)
        )

        this.assureConnection().then(() => {
            config?.verbose && console.log('✅ Sucesso na conexão ao neo4j\n')
            this.setupSignalHandlers()
        })
        
    }

    async executeQuery(query: string, parameters?: any): Promise<EagerResult> {
        await this.assureConnection()
        const result = await this.driver.executeQuery(
            query,
            parameters,
            { database: process.env.NEO4J_DATABASE || 'neo4j' }
        )
        return result
    }

    async assureConnection() {
        try {
            await this.driver.getServerInfo()
        } catch (err) {
            throw new Error('Erro na conexão ao Neo4J (provavelmente instância está offline): ' + err)
        }
    }

    private setupSignalHandlers(){
        this.exitSignals.forEach(signal => { // Tratamento para quando algum sinal de fechamento for enviado o driver ser fechado
            process.on(signal, async () => {
                console.log('🚮 Exit handler')
                await this.closeDriver()

                process.exit(0) 
            })
        })

        if (process.env.NODE_ENV === 'development'){ // Tenta tratar de quando o nodemon reinicia, e fecha o driver (nao consegui fazer um log)
            process.on('SIGUSR2', async () => {
                await this.closeDriver();           
                process.kill(process.pid, 'SIGUSR2'); 
            });
        }
        
    }

    async closeDriver(){
        try{
            console.log('❌ Fechando driver')
            await this.driver.close()
        }catch(err){
            console.log("Erro ao fechar o driver: ", err)
        }
    }
}

