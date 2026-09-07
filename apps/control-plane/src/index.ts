import { InMemoryAgentStore } from './agent-store.js'
import { createControlPlaneServer } from './server.js'

const port = Number(process.env.M2OATH_CONTROL_PLANE_PORT ?? 4000)

const store = new InMemoryAgentStore()

const server = createControlPlaneServer({
  store
})

server.listen(port, () => {
  console.log(`M2Oath control plane listening on port ${port}`)
})
