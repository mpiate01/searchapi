'use strict';

const env = require('node-env-file')
const fs = require('fs')
const elasticsearch = require('elasticsearch')

/* Environmental variables */
env('.env')

/* Elasticsearch Connection */
const es = elasticsearch.Client({
    host: process.env.BONSAI_URL,
    log: 'trace'
})

/* NAME -> index name; TYPE -> index type; DATA_FOLDER_NAME -> path to data to be indexed   */
const INDEX_NAME = 'feeds'
const INDEX_TYPE = 'products'
const DATA_FOLDER_NAME = './data/feeds.json'


/* TEST CONNECTION ELASTICSEARCH */
    es.ping({ requestTimeout: 30000 }, (error) => {
        console.error('Elasticsearch health check...');

        if (error) {
            console.error('elasticsearch cluster is down!');
        } else {
            console.log('Everything is ok');
        }
    })
/* end TEST CONNECTION ELASTICSEARCH */

/* TEST INDICES ELASTICSEARCH */
    const indices = () => {
        return es.cat.indices({v: true})  
            //cat object provides information about the current running instance
            //indices method lists all the indices, their health status, number of their documents, and their size on disk
        .then(console.log)
        .catch(err => console.error(`Error connecting to the es client: ${err}`));
    }

    // only for testing purposes
    // all calls should be initiated through the module
    const test = () => {
        console.log(`elasticsearch indices information:`);
        indices();
    }

    /* Uncomment following line to test */
    //test()  

/* end TEST INDICES ELASTICSEARCH */


const indexExists = () => {
    return es.indices.exists({
        index: INDEX_NAME
    })
}

const createIndex = () => {
    return es.indices.create({
        index: INDEX_NAME
    })
}

const deleteIndex = () => {
    return es.indices.delete({
        index: INDEX_NAME
    })
}
/*
const putSettings = () => {
    return es.indices.putSettings({
        index: INDEX_NAME,
        type: INDEX_TYPE,
        body: {
            "analysis": {
                "analyzer": {
                    "my_english_analyzer": {
                        "type": "standard", // no stop word
                        "min_token_length": 2,
                        "stopwords": "_english_"
                    },
                    "product_categories_cleaner" : {
                        "type": "standard",
                        "tokenizer": "letter"
                    },
                    "size_analyzer": {
                      "type":      "pattern",
                      "pattern":   "(\d)+", 
                      "lowercase": true
                    }
                    
                },
                "tokenizer": {
                    "wcm_path_tokenizer": {
                        "type": "pattern",
                        "pattern": "/",
                        "replacement": ","
                    }
                }
            }
        }             
    })
}*/

const indexMapping = () => {
    return es.indices.putMapping({
        index: INDEX_NAME,
        type: INDEX_TYPE,
        body: {
            properties: {
            	id: {
            		type: "long"
            	},
                description: {
                    type: "completion",
                    analyzer: "simple",
                    search_analyzer: "standard"
                },
                product_type: {
                    type: "completion",
                    analyzer: "simple",
                    search_analyzer: "standard"
                },
                title: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword",
                            ignore_above: 256
                        }
                    }
                },
                brand: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword",
                            ignore_above: 256
                        }
                    }
                },
                availability: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword",
                            ignore_above: 256
                        }
                    }
                },
                colour: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword",
                            ignore_above: 256
                        }
                    }
                },
                size: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword",
                            ignore_above: 256
                        }
                    }
                },
                size_type: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword",
                            ignore_above: 256
                        }
                    }
                },
                pattern_: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword",
                            ignore_above: 256
                        }
                    }
                },
                dress_style: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword",
                            ignore_above: 256
                        }
                    }
                },
                trouser_style: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword",
                            ignore_above: 256
                        }
                    }
                },
                top_style: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword",
                            ignore_above: 256
                        }
                    }
                },
                shoe_style: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword",
                            ignore_above: 256
                        }
                    }
                },
                accessory_type: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword",
                            ignore_above: 256
                        }
                    }
                },
                priority_group: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword",
                            ignore_above: 256
                        }
                    }
                },
                uk_price: {
                    type: "float"
                },
                uk_saleprice: {
                    type: "float"
                }
            }
        }
    })
}

/*
 * Since our dummy data is not a valid json file, we can't simply require() it.
 * This function tricks require() to read and export the content of the file, instead of parsing it
 */

const readDataFile = () => {

    const productsRaw = fs.readFileSync(DATA_FOLDER_NAME);
    const products = JSON.parse(productsRaw);

    return products
}
/*
const addDocument = (document) => {
    return es.index({
        index: INDEX_NAME,
        type: INDEX_TYPE,
        body: {
            id : document.id,
            description : document.description,
            title : document.title,
            brand : document.brand,
            product_type : document.product_type,
            availability : document.availability,
            colour : document.colour,
            size : document.size,
            size_type : document.size_type,
            pattern_ : document.pattern_,
            dress_style : document.dress_style,
            trouser_style : document.trouser_style,
            top_style : document.top_style,
            shoe_style : document.shoe_style,
            accessory_type : document.accessory_type,
            priority_group : document.priority_group,
            uk_price : document.uk_price,
            uk_saleprice : document.uk_saleprice
        },
        refresh: "true"
    })
}*/

/*
const bulkAddDocument = () => {
    return  es.bulk({
        index: INDEX_NAME,
        type: INDEX_TYPE,
        body: [
            readDataFile()
        ],
        refresh: "true"
    })
}*/
const bulkAddDocument = () => {
    let bulkBody = [];
    const data = readDataFile()
  
    data.forEach(item => {
        bulkBody.push({
          index: {
            _index: INDEX_NAME,
            _type: INDEX_TYPE
          }
        })
        bulkBody.push(item);
    })
  
    es.bulk({body: bulkBody})
        .then(response => {
            let errorCount = 0;
            response.items.forEach(item => {
            if (item.index && item.index.error) {
                console.log(++errorCount, item.index.error)
            }
            })
            console.log(
            `Successfully indexed ${data.length - errorCount}
            out of ${data.length} items`
            )
        })
        .catch(console.err)
}




const getSuggestions = (text, size) => {
    return es.search({
        index: INDEX_NAME,
        type: INDEX_TYPE,
        body: {
            suggest: {
                descriptionSuggester: {
                    prefix: text,
                    completion: {
                        field: "description",
                        size: size,
                        fuzzy: {
                            fuzziness: "auto"
                        }
                    }
                },
                product_typeSuggester: {
                    prefix: text,
                    completion: {
                        field: "product_type",
                        size: size,
                        fuzzy: {
                            fuzziness: "auto"
                        }
                    }
                }
            }

        }
    })
}

const getStat = (id) => {
    return es.search({
        index: INDEX_NAME,
        type: INDEX_TYPE,
        body: {
            query: {
                term: {
                    "_id": id
                }
            }
        }
    })
}

module.exports = {deleteIndex, createIndex, indexExists, indexMapping,  /*addDocument,*/ bulkAddDocument, getSuggestions, getStat}