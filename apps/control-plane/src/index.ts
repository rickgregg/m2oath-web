import {
  InMemoryAgentDirectory
} from './agent-store.js'
import {
  createM2OathHostedComposition
} from './m2oath-composition.js'
import {
  M2OathAgentRegistrationGateway
} from './m2oath-agent-registration-gateway.js'
import {
  createControlPlaneServer
} from './server.js'

const port = Number(
  process.env.M2OATH_CONTROL_PLANE_PORT ?? 4000
)

const directory =
  new InMemoryAgentDirectory()

const m2oath =
  createM2OathHostedComposition()

const registrationGateway =
  new M2OathAgentRegistrationGateway({
    sdk: m2oath.sdk,
    directory,

    /*
     * Temporary Phase 5 seam.
     *
     * The development AuthenticationProvider currently supplies the
     * authenticated principal. A future HTTP Developer JWT layer will
     * populate this request with real authenticated credentials.
     */
    authentication: {}
  })

const server =
  createControlPlaneServer({
    registrationGateway,
    directory
  })

server.listen(port, () => {
  console.log(
    `M2Oath control plane listening on port ${port}`
  )
})
