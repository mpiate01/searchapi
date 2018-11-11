const express = require('express')
const path = require('path')
const logger = require('./logdna')
const elasticsearch = require('./elasticsearch')

/* Express port */
const APP_PORT = 3000

const index = require('./routes/index')
const suggest = require('./routes/suggest')
const search = require('./routes/stat')

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// static folder setup
app.use(express.static(path.join(__dirname, 'public')))

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
  
    // render the error page
    res.status(err.status || 500)
    res.render('error');
})



elasticsearch.indexExists().then(

    //delete index if it exist
    function(status){
        if(status){
            return elasticsearch.deleteIndex()
        }
    }
).then(
    () => {

        logger.logger.log('Index deleted')

        //create our index
        return elasticsearch.createIndex().then(
            () => {
                logger.logger.log('Index created')

                //Update our index with mappings
                elasticsearch.indexMapping().then(
                    () => {
                        logger.logger.log('Index mapping has been updated')

                        //bulk add our dummy data in ./data/players.json
                        elasticsearch.bulkAddDocument().then(
                            () => {
                                logger.logger.log('Documents have been bulk imported')
                            },
                            (err) => {
                                logger.logger.error('Could not import documents', err)
                            }
                        )
                    },
                    (err) => {
                        logger.logger.error('Could not create index', err)
                    }

                )
            },
            (err) => {

                logger.logger.error('Could not create index', err)
            }
        )
    }
)

// create our app endpoints
app.get('/', index)
app.get('/suggest/:text/:size', suggest)
app.get('/stat/:id/', search)

app.listen(APP_PORT, function(){
    logger.logger.log(`App is running on port ${APP_PORT}`)
})