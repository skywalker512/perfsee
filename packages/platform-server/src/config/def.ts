import { ApolloDriverConfig } from '@nestjs/apollo'
import { RedisOptions } from 'ioredis'
import { DataSourceOptions } from 'typeorm'

import { ExternalAccount } from '@perfsee/shared'

import { LeafPaths } from '../utils/types'

declare global {
  // eslint-disable-next-line no-var
  var perfsee: PerfseeConfig
}

type EnvConfigType = 'string' | 'int' | 'float' | 'boolean' | 'object'
type ConfigPaths = LeafPaths<
  Omit<PerfseeConfig, 'ENV_MAP' | 'version' | 'baseUrl' | 'origin' | 'prod' | 'dev' | 'test' | 'deploy'>,
  '',
  '....'
>
/**
 * parse number value from environment variables
 */
function int(value: string) {
  const n = parseInt(value)
  return Number.isNaN(n) ? undefined : n
}

function float(value: string) {
  const n = parseFloat(value)
  return Number.isNaN(n) ? undefined : n
}

function boolean(value: string) {
  return value === '1' || value.toLowerCase() === 'true'
}

export function parseEnvValue(value: string | undefined, type?: EnvConfigType) {
  if (typeof value === 'undefined') {
    return
  }

  return type === 'int'
    ? int(value)
    : type === 'float'
    ? float(value)
    : type === 'boolean'
    ? boolean(value)
    : type === 'object'
    ? JSON.parse(value)
    : value
}

/**
 * All Configurations that would control perfsee runtime behaviors
 *
 * `@env` means that the value is also read from environment variables and with higher priority then value
 * defined in configuration file `perfsee.ts`.
 */
export interface PerfseeConfig {
  ENV_MAP: Record<string, ConfigPaths | [ConfigPaths, EnvConfigType?]>
  /**
   * System version
   */
  readonly version: string
  /**
   * the secret key used to sign the any encrypted data including cookies, tokens.
   *
   * @env PERFSEE_SERVER_SECRET
   */
  secret: string
  /**
   * alias to `process.env.NODE_ENV`
   *
   * @default 'production'
   * @env NODE_ENV
   */
  readonly env: string
  /**
   * fast environment judge
   */
  get prod(): boolean
  get dev(): boolean
  get test(): boolean
  get deploy(): boolean

  /**
   * Whether the server is hosted on a ssl enabled domain
   */
  https: boolean
  /**
   * where the server get deployed.
   *
   * @default 'localhost'
   * @env PERFSEE_SERVER_HOST
   */
  host: string
  /**
   * which port the server will listen on
   *
   * @default 3000
   * @env PERFSEE_SERVER_PORT
   */
  port: number
  /**
   * subpath where the server get deployed if there is.
   *
   * @default '' // empty string
   * @env PERFSEE_SERVER_SUB_PATH
   */
  path: string

  /**
   * Readonly property `baseUrl` is the full url of the server consists of `https://HOST:PORT/PATH`.
   *
   * if `host` is not `localhost` then the port will be ignored
   */
  get baseUrl(): string

  /**
   * Readonly property `origin` is domain origin in the form of `https://HOST:PORT` without subpath.
   *
   * if `host` is not `localhost` then the port will be ignored
   */
  get origin(): string

  /**
   * how long the application settings cache will expire in seconds
   */
  applicationSettingCacheSec?: number
  /**
   * the apollo driver config
   */
  graphql: ApolloDriverConfig
  /**
   * the database connection options
   *
   * @see https://typeorm.io/data-source
   * @env MYSQL_HOST
   * @env MYSQL_PORT
   * @env MYSQL_USERNAME
   * @env MYSQL_PASSWORD
   * @env MYSQL_DB
   *
   * or
   *
   * @env MYSQL_URL
   */
  mysql: Omit<Extract<DataSourceOptions, { type: 'mysql' | 'mariadb' }>, 'type'>
  /**
   * the redis connection options
   *
   * @env REDIS_HOST
   * @env REDIS_PORT
   * @env REDIS_PASSWORD
   * @env REDIS_DB
   */
  redis: RedisOptions
  /**
   * object storage Config
   *
   * all artifacts and logs will be stored on instance disk,
   * and can not shared between instances if not configured
   */
  objectStorage: {
    /**
     * whether use remote object storage
     */
    enable: boolean
    /**
     * used to store all uploaded builds and analysis reports
     *
     * the concrate type definition is not given here because different storage providers introduce
     * significant differences in configuration
     *
     * @example
     * {
     *   provider: 'aws',
     *   region: 'eu-west-1',
     *   aws_access_key_id: '',
     *   aws_secret_access_key: '',
     *   // other aws storage config...
     * }
     */
    artifact: Record<string, string>
    /**
     * used to store job logs
     *
     * if omitted then all job logs will be stored in artifact storage
     */
    jobLog?: Record<string, string>
  }

  /**
   * authentication config
   */
  auth: {
    /**
     * whether allow user to signup with email directly
     */
    enableSignup: boolean
    /**
     * whether allow user to signup by oauth providers
     */
    enableOauth: boolean
    /**
     * all available oauth providers
     */
    oauthProviders: Partial<
      Record<
        ExternalAccount,
        {
          clientId: string
          clientSecret: string
          /**
           * uri to start oauth flow
           */
          authorizationUri?: string
          /**
           * uri to authenticate `access_token` when user is redirected back from oauth provider with `code`
           */
          accessTokenUri?: string
          /**
           * uri to get user info with authenticated `access_token`
           */
          userInfoUri?: string
          args?: Record<string, any>
        }
      >
    >
    /**
     * config the default admin user login credential
     */
    admin: {
      email: string
      password: string
    }
  }

  /**
   * project config
   */
  project: {
    /**
     * whether allow user to create project directly
     */
    enableCreate: boolean
    /**
     * whether allow user to delete project
     */
    enableDelete: boolean
    /**
     * whether allow user to import projects from git hosts like github or gitlab
     */
    enableImport: boolean
    /**
     * all available git hosts for project importing
     *
     */
    externalProviders: Array<'github'>
  }

  /**
   * job system config
   */
  job: {
    /**
     * maximum job pulling requests per instance can handle concurrently
     */
    pollingLimit: number
    /**
     * maximum job pulling requests in queue per instance, if reach polling limit
     */
    pollingQueueLimit: number
    /**
     * timeout for job pulling requests
     */
    pollingTimeoutSec: number
    /**
     * timeout for job execution
     */
    executionTimeoutSec: number
    /**
     * default job zone
     */
    defaultZone: string
    /**
     * available job zones
     */
    zones: string[]
  }

  /**
   * Runner system config
   */
  runner: {
    /**
     * whether validate runner registration token while registering new runners
     *
     * might be useful when you want to prevent unauthorized runner registration
     *
     * @default true
     */
    validateRegistrationToken: boolean
  }

  /**
   * Email server settings
   */
  email: {
    enable: boolean
    /**
     * basic smtp config
     */
    smtp: {
      host: string
      port: number
      secure: boolean
      auth: {
        user: string
        password: string
      }
    }
    /**
     * email sender name and address information
     */
    from: {
      name: string
      address: string
    }
  }
  /**
   * external services integration config
   */
  integration: {
    /**
     * Github service
     *
     * @required if `project.externalProviders` includes `github`
     */
    github?: {
      /**
       * whether enable github service
       */
      enable: boolean
      /**
       * github application name
       */
      appName?: string
      /**
       * github application client id
       */
      appId?: string
      /**
       * file used to put github application private key
       * @see https://docs.github.com/en/developers/apps/building-github-apps/authenticating-with-github-apps#generating-a-private-key
       */
      privateKeyFile?: string
    }
  }
  s3: {
    enable: boolean
    accessKeyId: string
    secretAccessKey: string
    region: string
    bucket: string
    endpoint: string
  }
}
