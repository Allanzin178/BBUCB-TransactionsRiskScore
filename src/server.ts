import express from 'express'
import { AvaliacaoRiscoController } from './controllers/avaliacaoRisco.controller.ts'
import { AvaliacaoRiscoService } from './services/avaliacaoRisco.service.ts'
import { AvaliacaoRiscoRepository } from './repositories/avaliacaoRisco.repository.ts'
import { DriverService } from './config/neo4j.config.ts'

const app = express()

// Injeção de Dependências
const neo4jDriver = new DriverService()
const avaliacaoRiscoRepository = new AvaliacaoRiscoRepository(neo4jDriver)
const avaliacaoRiscoService = new AvaliacaoRiscoService(avaliacaoRiscoRepository)
const avaliacaoRiscoController = new AvaliacaoRiscoController(avaliacaoRiscoService)

// Middlewares
app.use(express.json())

// Rotas
app.post('/avaliarRisco', (req, res) => avaliacaoRiscoController.avaliarRisco(req, res)) // Usamos wrapper para manter o contexto da classe

app.listen(3000, () => {
  console.log('Porta 3000 sendo ouvida')
})

