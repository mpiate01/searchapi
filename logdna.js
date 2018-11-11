const logdna = require('logdna')
const env = require('node-env-file')

/* Environmental variables */
env('.env')

const logArgs = {
    app: 'Search Engine'
}
logArgs.index_meta = true

const logger = logdna.setupDefaultLogger(process.env.LOGDNA_KEY, logArgs)

exports.logger = logger