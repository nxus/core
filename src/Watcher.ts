import {performance} from 'node:perf_hooks'
import chokidar, {type FSWatcher} from 'chokidar'

/**
 * @private
 * The Watcher class monitors the project directory and restarts the application whenever
 * there is a change in files detected. Useful for development.
 */
export default class Watcher {
  watch: FSWatcher

  constructor(app: any, watchPath: any, watchEvent: string, ignore: any[] | undefined) {
    const watchOptions = {
      ignored: ignore
        ? ignore.concat([new RegExp('^(.*node_modules/(?!(@nxus|nxus-)).*)')])
        : new RegExp('^(.*node_modules/(?!(@nxus|nxus-)).*)'),
      ignoreInitial: true,
      persistent: true,
    }

    const watch = watchPath || process.cwd() + '/.'

    this.watch = chokidar.watch(watch, watchOptions as any)
    this.watch.on('all', (event: string, path: string) => {
      app.log.info(watchEvent, path)
      app.emit(watchEvent || 'change.detected', path)
    })

    app.on('change', (path: string) => {
      const start = performance.now()
      if (app._currentStage != app._bootEvents[app._bootEvents.length - 1]) return
      app.restart().then(() => {
        const end = performance.now()
        const seconds = Math.round((end - start) / 1000)
        app.log.info(`Restart took ${seconds} seconds`)
        app.emit('app.run.tests', path)
      })
    })
  }

  close() {
    this.watch.close()
  }
}


