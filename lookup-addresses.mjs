import fs from 'fs'
import { LotusRPC } from '@filecoin-shipyard/lotus-client-rpc'
import { NodejsProvider } from '@filecoin-shipyard/lotus-client-provider-nodejs'
import { mainnet } from '@filecoin-shipyard/lotus-client-schema'

const url = 'wss://lotus.jimpick.com/spacerace_api/0/node/rpc/v0'
const provider = new NodejsProvider(url)
const client = new LotusRPC(provider, { schema: mainnet.fullNode })

async function run () {
  try {
    const version = await client.version()
    console.log('Version', version)

    const clientsToTeams = {}

    const teamsContent = fs.readFileSync('./slingshot-teams.json', 'utf8')
    const teams = JSON.parse(teamsContent)

    const lookupCacheContent = fs.readFileSync('./lookup-cache.json', 'utf8')
    const lookupCache = JSON.parse(lookupCacheContent)

    // teams.length = 3
    for (const team of teams) {
      const { name, rank, url, addresses } = team
      console.log(`${rank}: ${name}`)
      for (const address of addresses) {
        let addressId = lookupCache[address]
        if (!addressId) {
          addressId = await client.StateLookupID(address, [])
          lookupCache[address] = addressId
        }
        console.log(`  ${addressId} ${address}`)
        clientsToTeams[addressId] = {
          name,
          rank,
          url,
          address
        }
      }
    }

    fs.writeFileSync('./lookup-cache.json', JSON.stringify(lookupCache, null, 2))
    fs.writeFileSync('./client-id-to-teams.json', JSON.stringify(clientsToTeams, null, 2))
  } catch (e) {
    console.error('error', e)
  }
  await client.destroy()
}
run()
