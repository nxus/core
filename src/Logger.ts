import pino from 'pino'

/**
 * Factory method for Nxus logger instances.
 *
 * v5 uses `pino` for modern structured logging, with pretty console output by default.
 *
 * @param name display name used to identify output from the logger
 * @returns logger instance with debug/info/warn/error/log methods
 */
export default function Logger(name: string = 'application') {
  const isTest = process.env.NODE_ENV === 'test'

  // By default, keep unit test output clean unless explicitly enabled.
  // Override with NXUS_LOG_LEVEL (or set NXUS_LOG_SILENT=0 to opt-out).
  const shouldSilence =
    process.env.NXUS_LOG_SILENT === '1' ||
    (isTest && process.env.NXUS_LOG_SILENT !== '0' && !process.env.NXUS_LOG_LEVEL)

  const level = shouldSilence
    ? 'silent'
    : process.env.NXUS_LOG_LEVEL ||
      (process.env.NODE_ENV && process.env.NODE_ENV !== 'development' ? 'info' : 'debug')

  const base = {name: `nxus:${name}`}

  // Pretty output by default (per project preference).
  // If a consumer wants JSON, they can set NXUS_LOG_PRETTY=0.
  const pretty = process.env.NXUS_LOG_PRETTY !== '0'

  const transport = !shouldSilence && pretty
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true,
          levelFirst: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      })
    : undefined

  const log = transport ? pino({level, base}, transport) : pino({level, base})

  // Backwards-compat: some callers expect `.log(...)` to exist.
  ;(log as any).log = log.info.bind(log)

  return log as any
}

export const logger = Logger()


