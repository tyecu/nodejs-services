//service for working with neo4j (graphdb) instance.
//retrieves database names, friendly names and connection information.
const appConfig = require("./appConfig.js");
const express = require('express');
const app = express();
const neo4j = require('neo4j');
const db = new neo4j.GraphDatabase('http://neo4j:neo@localhost:7474');

// The express router uses the full relative path to determine which
// method to call.  This means it needs to be aware of the hosting vdir.
// The virtual directory will be passed in via an environment variable,
// if no directory is passed then we assume we are working in the root
// which is typical of a DEBUG scenario.
var virtualDirPath = process.env.virtualDirPath || '';

// Use body parser so we can receive POST requests easily,
// set up to handle both forms and JSON submissions.
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Allow custom header and enable cross origin requests.
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-APIKEY-HEADER");
    next();
});

// Router instance for our endpoints.
var router = express.Router();

//Validate API key.
function ValidateAPIKey(req) {
    var apiKey = req.headers[appConfig.apiKeyHeader] || req.headers[appConfig.apiKeyHeader.toLowerCase()];
    if (apiKey && (apiKey === appConfig.apiKey)) {
        return true;
    } else {
        false;
    }
}

// GET (Default)
// Get all oracle database info from graph db.
router.get(virtualDirPath + '/oradbs', function(req, res) {
    console.log("GET /oradbs");
    if(ValidateAPIKey(req)){
        db.cypher({
            query: 'MATCH (x:ORACLEDBCONNECTIONS) RETURN x'
        }, function (err, results) {
            if(err) throw err;
            results.forEach(element => {
                var e = element['x'];
                var eobj = JSON.parse(e.properties.databases);
                eobj.forEach(o => {
                    console.log(o.name);
                });
                res.status(200).json(eobj);
            });
        });
    } else {
        res.status(401).json({ Message: 'Unauthorized'});
    }
});

app.use(router);
var port = process.env.PORT || 9091;
app.listen(port);
console.log('graph service listening on port ' + port);