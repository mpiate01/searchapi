Leveraging the Power of Elasticsearch: Autocomplete and Fuzzy Search

I’m going to show you how to build a simple search with autocomplete and fuzziness using [Manifold](https://www.manifold.co/), Express and deploying to Zeit. We will be building a simple web page that allows users to search for football players and display their details.

This tutorial will showcase some of the awesome features of Elasticsearch, but before we continue, we need to understand what autocomplete, fuzziness and Elasticsearch is.
 
Introduction

Autocomplete means giving users the option of completing words or forms by a shorthand method on the basis of what has been typed before. Pretty straightforward!

Fuzziness in the context of this article, means finding words that are resembling or similar by editing a character or more. There are four ways of finding fuzzily similar words: substitution, insertion, transposition and deletion. For example:

- Substitute r for n: clea_r_ → clea_n_
- Insert k after c: tic → tic_k_
- Transpose a and e: b_ae_ver → b_ea_ver
- Delete r: po_r_t → pot

Elasticsearch is an open-source, broadly-distributable, readily-scalable, really fast RESTful search and analytics engine. Accessible through an extensive and elaborate API, Elasticsearch can power extremely fast searches that support your data discovery applications.

If you don’t have any idea about Elasticsearch or Express, you should be able to follow the tutorial, however, I will recommend catching up:

- [Express.js documentation](https://expressjs.com/en/starter/installing.html)
- [Elasticsearch documentation](https://www.elastic.co/guide/index.html)

We are good to go!

Set up

We will use Manifold to create our elasticsearch instance and logging. If you don’t have a Manifold account, [head over and create one](https://dashboard.manifold.co/register), it is very easy to set up.

Once you’ve logged in, you will be able to create resources by clicking on `Create Resource` button.

![insert image]()

For this tutorial, we will using Bonsai Elasticsearch and LogDNA, so go ahead and provision both services. This will create a new Bonsai Elasticsearch and LogDNA accounts straight from your Manifold account. Awesome!

To get your credentials, click on `Export all credentials` button

![insert image]()

This will reveal a modal box with your credentials, copy them by clicking on `Copy to clipboard`

![insert image]()

For Bonsai Elasticsearch URL, you can get that from your Bonsai dashboard. To get to the dashboard, Click on the name of the Bonsai Elasticsearch resource created.

![insert image]()

![insert image]()

Create a `.env` file in your project root folder and paste our credentials for both Elasticsearch and LogDNA

```
BONSAI_URL=URL FROM BONSAI DASHBOARD
LOGDNA_KEY=LOGDNA KEY GENERATED

```

Installing Node modules

Before we proceed, ensure you have node and npm installed. Open your terminal and run `npm init`, this will create a `package.json` file in your project root folder . Next, run this:

```bash
npm install --save elasticsearch express logdna node-env-file pug nodemon
```
We are installing the packages for Express framework, Elasticsearch and LogDNA. Pug will be used for our view template engine, node-env-file to for our .env file and nodemon to auto restart our server after making changes.

Setting up LogDNA

Logging makes it easy to find where and when things went wrong in our application. This is where LogDNA comes in. Create this file in the project root folder `logdna.js` and insert the following code:

```js
var logdna = require('logdna');
var env = require('node-env-file');

env('.env');

const logArgs = {
   app: 'Player Search'
};
logArgs.index_meta = true;

const logger = logdna.setupDefaultLogger(process.env.LOGDNA_KEY, logArgs);

exports.logger = logger;

```

In the code snippet above, we required `logdna` and `node-env-file` modules installed earlier. Next, we set our environment file, with the help of `node-env-file` and created our instance of LogDNA with our arguments in `logArgs`. Finally, we exported our LogDNA instance.

Basic concepts in Elasticsearch

Before we continue, let’s quickly go through some basic concepts in Elasticsearch.

A cluster is a collection of one or more nodes (servers) that together hold your entire dataset and provides federated indexing and search capabilities across all nodes.

A node is a single server that is part of your cluster, stores your data, and participates in the cluster’s indexing and search capabilities.

An index is a collection of documents that have somewhat similar characteristics. For example, you can have an index for customer data, another index for a product catalog, and yet another index for order data.

A type is a logical category/partition of your index whose semantics is completely up to you. In general, a type is defined for documents that have a set of common fields.

A document is a basic unit of information that can be indexed. For example, you can have a document for a single customer, another document for a single product, and yet another for a single order.

Query DSL is a JSON-style domain-specific language that you can use to execute queries, provided by Elasticsearch. This is an example:

```
GET /bank/_search
{
  "query": { "match_all": {} }
}
```

Setting up Elasticsearch

For this tutorial, I created a json file with details of 2500 dummy players, download it here, create a folder `data` in the project root folder and paste the file in there, i.e `data\player.json`.

Now, create `elasticsearch.js` in the project root folder, then copy the code below:

```js
var env = require('node-env-file');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

env('.env');

const es = elasticsearch.Client({
   host: process.env.BONSAI_URL,
   log: 'trace'
});

const INDEX_NAME = 'players';
const INDEX_TYPE = 'details';

```

In the code snippet above, we required `node-env-file` and added our `.env` file, `fs` to access the file system and `elasticsearch`. Next, we created an instance of Elasticsearch using the Bonsai Elasticsearch URL from Manifold, as host. Then we defined INDEX_NAME and INDEX_TYPE, that will used later.

Next, add the code snippet below:
 
```js
function readDataFile(){
   require.extensions['.json'] = function (module, filename) {
       module.exports = fs.readFileSync(filename, 'utf8');
   };

   return require("./data/players.json")
}
```

This function allows us to modify how we require the dummy data. This is necessary because our JSON file containing the dummy data, is not a valid JSON file and will fail when it is parsed.

Next, let’s add the functions that checks if the index exists, creates the index and deletes the index. Copy the code snippet below:

```js
function indexExists() {
   return es.indices.exists({
       index: INDEX_NAME
   });
}

function createIndex(){
   return es.indices.create({
       index: INDEX_NAME
   });
}

function deleteIndex(){
   return es.indices.delete({
       index: INDEX_NAME
   });
}
```

The next step is to create the index mapping. Mapping is the process of defining how a document, and the fields it contains, are stored and indexed. Mapping is used to define if a field can be used for suggestions or is a date, string, number etc. Add the code snippet below to the existing `elasticsearch.js`:

```js
function indexMapping(){
   return es.indices.putMapping({
       index: INDEX_NAME,
       type: INDEX_TYPE,
       body: {
           properties: {
               firstName: {
                   type: "completion",
                   analyzer: "simple",
                   search_analyzer: "simple"
               },
               lastName: {
                   type: "completion",
                   analyzer: "simple",
                   search_analyzer: "simple"
               },
               address: {
                   type: "text",
                   fields: {
                       keyword: {
                           type: "keyword",
                           ignore_above: 256
                       }
                   }
               },
               age: {
                   type: "long"
               },
               eyeColor: {
                   type: "text",
                   fields: {
                       keyword: {
                           type: "keyword",
                           ignore_above: 256
                       }
                   }
               },
               country: {
                   type: "text",
                   fields: {
                       keyword: {
                           type: "keyword",
                           ignore_above: 256
                       }
                   }
               },
               firstMatch: {
                   type: "text",
                   fields: {
                       keyword: {
                           type: "keyword",
                           ignore_above: 256
                       }
                   }
               },
               position: {
                   type: "text",
                   fields: {
                       keyword: {
                           type: "keyword",
                           ignore_above: 256
                       }
                   }
               },
               retired: {
                   type: "boolean"
               },
               height: {
                   type: "text",
                   fields: {
                       keyword: {
                           type: "keyword",
                           ignore_above: 256
                       }
                   }
               }
           }
       }
   });
}
``` 

In our mapping function above, we defined both `firstName` and `lastName` as type `completion`, this type allows completion suggestions to be made using those two fields.

For the search to work, we need to add documents. Therefore, we need to a function to bulk add our dummy data. Add the code snippet below to `elasticsearch.js`:

```js
function bulkAddDocument(){
   return  es.bulk({
       index: INDEX_NAME,
       type: INDEX_TYPE,
       body: [
           readDataFile()
       ],
       refresh: "true"
   });
}
```

From the code above, `readDataFile()` fetches our dummy data from the JSON file, which becomes the body of the request.

Next, we want Elasticsearch to be able to suggest players based on their first name and last name. However, names of player are sometimes difficult to spell, therefore, we want to be able to suggest players that have their first name or lastname fuzzily similar to the user’s search entry. Add the code below to the file:

```js
function getSuggestions(text, size){
   return es.search({
       index: INDEX_NAME,
       type: INDEX_TYPE,
       body: {
           suggest: {
               firstNameSuggester: {
                   prefix: text,
                   completion: {
                       field: "firstName",
                       size: size,
                       fuzzy: {
                           fuzziness: "auto"
                       }
                   }
               },
               lastNameSuggester: {
                   prefix: text,
                   completion: {
                       field: "lastName",
                       size: size,
                       fuzzy: {
                           fuzziness: "auto"
                       }
                   }
               }
           }

       }
   });
}
```

From the code above, we have two suggesters: `firstNameSuggester` and `lastNameSuggester`. The first will return first names matching the search word while the second suggester will return for last names.

We want to be able to fetch the details of a particular player when we search, therefore, we need to have a search function. Place the code snippet below in your code:

```js
function getStat(id){
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
   });
}
``` 

The function above, searches and returns the details of a player, using the id passed.

Finally, we need to export the functions, so that they can be used in other files. Paste the code below at the end of the file:

```js
exports.deleteIndex = deleteIndex;
exports.createIndex = createIndex;
exports.indexExists = indexExists;
exports.indexMapping = indexMapping;
exports.bulkAddDocument = bulkAddDocument;
exports.getSuggestions = getSuggestions;
exports.getStat = getStat;

```

Defining app routes

Routes are application endpoints that determine how responses are sent to a client’s request. In this application, we will need three routes: `/` to return the homepage, `/suggest/:text/:size` to return suggestions and `/stat/:id` to return the details of a player.

Create a folder `routes`, create a file `index.js` and paste the code snippet below:

```js
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
   res.render('index', { title: 'Elasticsearch Tutorial' });
});

module.exports = router;

```

In the code above, we created a router as a module. This router renders the homepage and sends the title of the page to the page template named `master`. The page template will be discussed later.

Next, create a new file `suggest.js` in the `routes` folder and add the code snippet below:

```js
var express = require('express');
var logger = require('../logdna');
var router = express.Router();

var elasticsearch = require('../elasticsearch');

//Get result from elasticsearch
router.get('/suggest/:text/:size', function(req, res, next) {
   elasticsearch.getSuggestions(req.params.text, req.params.size).then(
       function(result){
           logger.logger.log("Suggest players with first name or last name: "+req.params.text);
           res.json(result)
       }
   );
});

module.exports = router;

```
The router module above requires `elasticsearch.js` and calls the function `getSuggestions`, which returns a client-specified amount of suggestions for the search word from the client. Also, we logged the action using LogDNA.

Finally for routes, create a file `stats.js` in the `routes` folder and copy the code snippet below:

```js
var express = require('express');
var logger = require('../logdna');
var router = express.Router();

var elasticsearch = require('../elasticsearch');

//Get result from elasticsearch
router.get('/stat/:id', function(req, res, next) {
   elasticsearch.getStat(req.params.id).then(
       function(result){
           logger.logger.log("Search for player with ID: "+req.params.id);
           res.json(result)
       }
   );
});

module.exports = router;

```

This route returns the details of a player based on the `id` passed into the `getStat` function. Also, the action is logged using the instance of LogDNA exported as a module in `logdna.js` 

Setting up the server with Express

For the application to work, we need to run it on a server, this is where Express comes in. Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. In the project root folder, create `app.js` file and copy the code below into it:

```js
var express = require('express');
var path = require('path');
var logger = require('./logdna');
var elasticsearch = require('./elasticsearch');

const APP_PORT = 3000;

var index = require('./routes/index');
var suggest = require('./routes/suggest');
var search = require('./routes/stat');

var app = express();
```

In the code snippet above, we required the express and path module, also, we required the LogDNA & Elasticsearch modules and the routes we created earlier. Then, we created an instance of Express named `app`

Next, add the code snippet below to set the view engine, views folder  and static files directory.

```js
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// static folder setup
app.use(express.static(path.join(__dirname, 'public')));
```

For this tutorial, we are using the Pug (formerly known as Jade), a high performance template engine.

Next, we need to check the setup of our Elasticsearch index and make sure that our data is stored correctly. Copy the code snippet below:

```js
elasticsearch.indexExists().then(

   //delete index if it exist
   function(status){
       if(status){
           return elasticsearch.deleteIndex();
       }
   }
).then(
   function(){

       logger.logger.log('Index deleted');

       //create our index
       return elasticsearch.createIndex().then(
           function(){

               logger.logger.log('Index created');

               //Update our index with mappings
               elasticsearch.indexMapping().then(
                   function(){
                       logger.logger.log('Index mapping has been updated');

                       //bulk add our dummy data in ./data/players.json
                       elasticsearch.bulkAddDocument().then(
                           function () {
                               logger.logger.log('Dummy documents have been bulk imported');
                           },
                           function (err) {
                               logger.logger.error('Could not import dummy documents', err);
                           }
                       )
                   },
                   function(err){
                       logger.logger.error('Could not create index', err);
                   }

               )
           },
           function (err){

               logger.logger.error('Could not create index', err);
           }
       );
   }
);
```

In the code snippet above, we did the following:
1. Check if the index exists
2. Delete the index if it exists and log the outcome
3. Create the index and log the outcome
4. Update the index with mapping and log the outcome
5. Bulk insert the dummy documents and log the outcome

```js
// create our app endpoints
app.get('/', index);
app.get('/suggest/:text/:size', suggest);
app.get('/stat/:id/', search);

app.listen(APP_PORT, function(){
   logger.logger.log('App is running');
});

```

Finally, we created our app endpoints and assigned the router modules accordingly. After that, we started the server on the port specified and logged it.

Building the Frontend

Now, we will build a simple frontend web page to consume the backend API, using Pug template engine to generate HTML and jQuery.

Create a folder `views` and create a file `index.pug`, the path should be `views/index.pug` and copy the code snippet below:

```jade
doctype html
html
   head
       title= title
       link(rel='stylesheet', href='https://fonts.googleapis.com/css?family=Raleway:300,400,700')
       link(type='text/css', rel='stylesheet', href='/css/style.css')
   body
       h1.title Player Stats
       div.container
           div.searchbox
               form.searchform
                   input.searchbar(type="text")
                   input.value(type="hidden")
                   button.submit(type="submit", disabled="disabled") Get Details
               div.autocomplete
           div.result

       script(src='https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js')
       script(src='/js/script.js')
```

In the above code snippet, we created the HTML structure. Pug relies on indentation to create parent and child elements, therefore, we have to pay attention to that.

Next, we need to style the web page using CSS, create a stylesheet file `public/css/style.css` and paste the code below:

```css
*{
   padding:0;
   margin:0;
   box-sizing: border-box;
}
html, body{
   font-size: 10px;
   font-family: 'Raleway', sans-serif;
   font-weight: 300;
}

body{
   min-height: 100vh;
   background-color: #cccccc;
}
.title{
   padding: 1rem;
   display: block;
   margin: 0 auto 4rem;
   color: #ffffff;
   text-align: center;
   font-size: 6rem;
   background-color: #16a085;
   text-transform: capitalize;
   font-weight: 400;
}
.container{
   max-width: 1200px;
   margin:auto;
   display: block;
   padding:4rem;
}
.searchbox{
   width:100%;
   display: block;
}
.searchform .searchbar{
   width:75%;
   padding: 2rem 1rem;
   font-weight: 300;
   border: none;
   font-size: 3rem;
   box-shadow: 0 0 3px rgba(0,0,0,0.3);
   display: inline-block;
}
.searchform .submit{
   width:22%;
   margin-left: 3%;
   background-color: #16a085;
   color: #ffffff;
   font-size: 3rem;
   border: none;
   padding: 2rem 1rem;
   font-weight: 300;
   cursor: pointer;
   box-shadow: 0 0 2px rgba(0,0,0,0.2);
}
.searchform .submit[disabled="disabled"]{
   background-color: rgba(22, 160, 133, 0.6);
   cursor: not-allowed;
}
.autocomplete{
   display: block;
   width:75%;
   background-color: #ffffff;
}
.autocomplete a{
   display: block;
   text-decoration: none;
   padding:1rem;
   border-bottom: thin solid #eeeeee;
   font-size: 1.6rem;
   color: #333333;
   font-weight: 300;
}
.bold{
   font-weight: 700;
}
.result{
   margin-top: 4rem;
}
.player{
   background-color: #ffffff;
   padding: 3rem 2rem;
   display: block;
   box-shadow: 0 0 3px rgba(0,0,0,0.3);
}
.player *{
   padding: 0.5rem 0;
}
.player h2, .player p{
   font-weight: 300;
}
.player h2{
   font-size: 2.2rem;
}
.player p{
   font-size: 1.6rem;
}
```

The above style declarations will make the page look a bit nice and simple.

Finally, we need to be able to show suggestions as users search, click on a result and get the player’s details. In this tutorial, we are going to make that possible by using jQuery; a javascript library, however, if you want to use another framework or library, feel free.

Now, let’s create a new javascript file using the path `public/js/script.js`, then copy the code snippet below:

```js
"use strict";
jQuery(document).ready(function($){

   var previous;

   $('.searchbar').on("change paste keyup", function() {

       var word = $(this).val();

       if(word !== '' && word !== previous){
           previous = word;

           suggestion(word, 10);
       }

   });

   $(document).on('click', '.option', function(el){
       el.preventDefault();

       var id = $(this).data('id');
       var name = $(this).data('name');

       $('.submit').prop('disabled', false);

       $('.searchbar').val(name);
       $('.value').val(id);

       $('.submit').prop('disabled', false);

       $('.autocomplete').html('');

   });

   $(document).on('click', '.submit', function(el){
       el.preventDefault();

       var id = $('.value').val();

       stat(id);

   })

});

function suggestion(text, size){

   $.getJSON('/suggest/'+text+'/'+size)
       .done(function(data){
           var firstName = data.suggest.firstNameSuggester[0].options;
           var lastName = data.suggest.lastNameSuggester[0].options;

           $('.autocomplete a').each(function(){
               $(this).remove();
           });

           $.each(firstName, function(index, value){
               $('.autocomplete').append('<a class="option" href="#" data-id="'+value._id+'" data-name="'+value._source.firstName+' '+value._source.lastName+'"><span class="bold">'+ value._source.firstName +'</span> '+ value._source.lastName +'</a>')
           });

           $.each(lastName, function(index, value){
               $('.autocomplete').append('<a class="option" href="#" data-id="'+value._id+'" data-name="'+value._source.firstName+' '+value._source.lastName+'">'+value._source.firstName +' <span class="bold">'+ value._source.lastName +'</span></a>')
           });

       });

}

function stat(id){
   $.getJSON('/stat/'+id)
       .done(function(data){
           $.each(data.hits.hits, function(index, value){
               var details = value._source;
               var retired = value._source.retired ? "Yes" : "No";

               $('.result').html('<div class="player"><p>Full Name: <span class="bold">'+details.firstName+ ' ' + details.lastName+'</span></p><p>Position: <span class="bold">'+details.position+'</span></p><p>Date of First International Match: <span class="bold">'+details.firstMatch+'</span></p><p>Height: <span class="bold">'+details.height+'</span></p><p>Age: <span class="bold">'+details.age+'</span></p><p>Country of Birth: <span class="bold">'+details.country+'</span></p><p>Residential Address: <span class="bold">'+details.address+'</span></p><p>Eye Color: <span class="bold">'+details.eyeColor+'</span></p><p>Retired?: <span class="bold">'+retired+'</span></p></div>')
           })
       });
}
```
In the script above, we have two functions: `suggestion` and `stat` as well as five event listeners: `change`, `paste`, `keyup`, two `click`s.

The event listener `$('.searchbar').on("change paste keyup", function() {...});` checks for when a user changes the value of the search box and sends a request using the `suggestion` function, which returns suggestions.

The event listener `$(document).on('click', '.option', function(el){...});` is triggered when a user clicks on any of the suggested results, this sets the value of a hidden field with the ID of the player and also sets the value in the search box to the player’s name.

Finally, the event listener `$(document).on('click', '.submit', function(el){...}` is triggered when the user clicks on the `Get Details` button. This fetches the ID stored in the hidden input field, sends a request to Elasticsearch using the `stat` function and displays the player’s details below the search box.

The app is ready!

Deployment

Before we deploy, let’s quickly edit `package.json` in the root folder, so that we can start the app automatically, when we deploy. Add this to the file:

```text
"scripts" : {
 "start": "nodemon ./app.js"
}
```

Finally, time to deploy! We will use a simple tool called `now` by Zeit. Let’s quickly install this, run this in your terminal:

```bash
npm install -g now
```

Once the installation is done, navigate to the project root folder in your terminal and run the `now` command. If it is your first time, you will be prompted to create an account. Once you are done, run the `now` command again, a URL will be generated and your project files uploaded.

![insert image]()

You can now access the simple application via the URL generated. Pretty straightforward!

![insert image]()

Also, we can view logs on LogDNA dashboard to make sure everything is working as it should be. To access the dashboard, see the image below:

![insert image]()

The dashboard should look like below, with the log from our application.

![insert image]()

Conclusion

We have been able to focus more on building our simple app, without worrying about infrastructure. The ability to provision resources very fast, all from a single dashboard means we get to focus more on writing code. Don’t stop here, get creative and improve on the code in this tutorial.
