//service for working with oracle databases.
//updates ora account passwords.
const appConfig = require("./appConfig.js");
const express = require('express');
const app = express();
const oracledb = require('oracledb');

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

// Router instance for our endpoints
var router = express.Router();

// Validate that the request contains a valid API key in the
// expected header.
function ValidateAPIKey(req) {
    var apiKey = req.headers[appConfig.apiKeyHeader] || req.headers[appConfig.apiKeyHeader.toLowerCase()];
    if (apiKey && (apiKey === appConfig.apiKey)) {
        return true;
    } else {
        false;
    }
}

//POST
//Update oracle credentials.
router.post(virtualDirPath + '/', function(req, res, next) {
    console.log('POST');
    if(ValidateAPIKey(req)){
        var connectionString = req.body.connectionString;
        var userName = req.body.userName;
        var oldPassword = req.body.oldPassword;
        var newPassword = req.body.newPassword;
        var confirmPassword = req.body.confirmPassword;

        console.log('Change ' + userName + ' on ' + connectionString);
        /*console.log(connectionString);
        console.log(userName);
        console.log(oldPassword);
        console.log(newPassword);*/

        if(newPassword != confirmPassword) {
            res.status(400).json({ ErrorMessage: "Passwords don't match."})
        } else {
            oracledb.getConnection({
                user: userName,
                password: oldPassword,
                newPassword: newPassword,
                connectString: connectionString
            },
            function(err, connection) {
                if (err) {
                    console.error(err.message);
                    res.status(500).json({ ErrorCode: err.code, ErrorMessage: err.message });
                } else {
                    res.status(200).json({ Message: 'SUCCESS'});
                }
            });
        }
    } else {
        res.status(401).json({ Message: 'Unauthorized'});
    }
});

// Startup
app.use(router);
var port = process.env.PORT || 9092;
app.listen(port);
console.log('oracle pw change service listening on port ' + port);