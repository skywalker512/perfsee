import { getDefaultPerfseeConfig } from './default'

process.env.NODE_ENV ||= 'production'
globalThis.perfsee = getDefaultPerfseeConfig()
