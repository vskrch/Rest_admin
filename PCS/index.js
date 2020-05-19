const WebSocketServer = require('websocket').server;
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const _ = require('lodash');
const winston = require('winston');
require('winston-daily-rotate-file');
const crypto = require('crypto');
const pako = require('pako');

let logLevel = 'info';
let port = 80;
const fileMaxSize = '10m';

//Command line argument methods for logging level and port number
const myArgs = process.argv.slice(2);
if (myArgs.includes('-L') && myArgs.indexOf('-L') < (myArgs.length - 1) && winston.config.npm.levels[myArgs[myArgs.indexOf('-L') + 1]] !== 'undefined') {
    logLevel = myArgs[myArgs.indexOf('-L') + 1];
}
if (myArgs.includes('-p') && myArgs.indexOf('-p') < (myArgs.length - 1)  && !isNaN(myArgs[myArgs.indexOf('-p') + 1])) {
    port = myArgs[myArgs.indexOf('-p') + 1];
}

//Formatting for console/debugging logs
const myFormat = winston.format.printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level.charAt(0).toUpperCase() + level.substring(1)}: ${message}`;
});

/**
 * Transports for use in the logger that rotates log files daily or after reaching 100 megabytes.
 * 
 * The logging transports need to be in a seperate object in order to allow the logging level to be changed during runtime.
 * This could be moved within the constructor of the logger since the level is not currently changed during runtime, but having 
 * the transports seperate improves readability and allows for accessing variables directly from the loggingTransports object.
 */
const loggingTransports = {
    console: new winston.transports.Console({
        level: logLevel
    }),
    verboseLogs: new winston.transports.DailyRotateFile({
        level: 'verbose',
        dirname: 'logs',
        filename: '%DATE%-verboseLogs.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: fileMaxSize,
        maxFiles: '2'
    }),
    debugLogs: new winston.transports.DailyRotateFile({
        level: 'debug',
        dirname: 'logs',
        filename: '%DATE%-debugLogs.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: fileMaxSize,
        maxFiles: '2'
    }),
    errorLogs: new winston.transports.DailyRotateFile({
        level: 'debug',
        dirname: 'logs',
        filename: '%DATE%-errorLogs.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: fileMaxSize,
        maxFiles: '2'
    })
}

//Logger for console/debugging
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.label({ label: 'Romaeris Web Server' }),
        winston.format.timestamp(),
        myFormat
    ),
    transports: [
        loggingTransports.console,
        loggingTransports.verboseLogs,
        loggingTransports.debugLogs
    ],
    exceptionHandlers: [
        loggingTransports.errorLogs,
        loggingTransports.console
    ]
});

/**
 * Logger for JSON data needs a seperate logger object due to a different format.
 * JSON string format is more easily parsed by a computer if the logs ever need to be extracted.
 */
const jsonLogger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    levels: {
        parsingError: 0,
        topicWarning: 1,
        dataUpToDate: 2,
        newData: 3
    },
    transports: [
        new winston.transports.DailyRotateFile({
            dirname: 'logs',
            filename: '%DATE%-jsonLogs.log',
            datePattern: 'YYYY-MM-DD',
            level: 'newData',
            zippedArchive: true,
            maxSize: fileMaxSize,
            maxFiles: '2'
        })
    ]
});

var payloads = new Map([
    ['navio1/message', {}],
    ['navio2/message', {}],
    ['engine/message', {}],
    ['joystick/data' , {}]
]);

var userSet = new Set();

var uavSet = new Set();

class UAV {
    constructor(formatData) {
        console.log('Created new UAV object: ' + formatData);
        for (let key in formatData) {
            let val = formatData[key];
            if (key === 'header') {
                this.header = val;
            }
            if (key === 'messageType') {
                this.messageType = val;
            }
            console.log('Typeof Val: ' + (typeof (val)));
            if (typeof(key) === 'object' && 'index' in key && 'dataType' in key && 'length' in key) {
                console.log('In Object: ', key['index'], key['dataType'], key['length']);
            }
            console.log(key, val);
        }
    }
}

/**
 * Information for users signing in. Derived keys are only split onto multiple lines because they're so long.
 */
const logUsers = new Map([
    [
        'romaerisadmin', {
            'derivedKey': '5bc1b9e1a1ade44de1cfb592ff323429c7e3f34c5bece03e8bd44d9fbc468c7b' +
                '1289cbd1ddb681428b287ee939cd0b572c096ba641703150518714d38dbabbf9',
            'salt': 'cd78aded7f4bfed455d8bceaa1193270',
            'iterations': 100000
        }
    ],
    [
        'a', {
            'derivedKey': '2d4c5bb03c0cd43f13dbddb022770172303f876937c71494e78c37dda0df8b8f' +
                'ae5aec5e74696434e8e0d58362bd8a21ea4caeab2aa839fef816032ce23ee6b2',
            'salt': '0ccf214c315cc034805fad4cc3d613db',
            'iterations': 100000
        }
    ]
]);
var sessionSet = new Set();

//HTTP server to serve webpage and process data from POST messages
var server = http.createServer(function(request, response) {
    var rawString = '';
    logger.debug('Received HTTP message from: ' + request.connection.remoteAddress);
    //Handles POST messages and data
    if (request.method === 'POST') {
        logger.debug('HTTP message is POST');
        //Receives data from post message and destroys connection if the message is too large
        request.on('data', function (postData) {
            rawString += postData;
            if (rawString.length > 1e6) {
                logger.warn('POST message is too large (data.length > 1e6), destroying connection');
                rawString = '';
                response.writeHead(413, { 'Content-Type': 'text/plain' }).end();
                request.connection.destroy();
            }
        });

        //Triggers once all data has been received
        request.on('end', function () {
            logger.debug('All data in POST message received');
            var data = tryParseJSON(rawString);
            response.writeHead(200, "OK", {
                'Access-Control-Allow-Origin': 'http://romaerispilot.site',
                'Content-Type': 'text/plain'
            });
            if (!data) { //If data cannot be parsed as a JSON object
                jsonLogger.parsingError(rawString);
                logger.warn('POST data not in JSON format: ' + rawString);
                response.write('POST data not in JSON format:\n' + rawString);
                response.end();
            } else if ('topic' in data && payloads.has(data['topic']) && !_.isEqual(payloads.get(data['topic']), data)) { //If data is new
                jsonLogger.newData(JSON.stringify(data));
                logger.info('Updating payload data for topic: ' + data['topic']);
                response.write('Updating payload data for topic: ' + data['topic']);
                response.end();
                payloads.set(data['topic'], data);
                updateUsers(data['topic']);
            } else if ('topic' in data && payloads.has(data['topic'])) { //If data is old
                jsonLogger.dataUpToDate(JSON.stringify(data));
                logger.verbose('Data already up to date for topic: ' + data['topic']);
                response.write('Data already up to date for topic: ' + data['topic']);
                response.end();
            } else if ('topic' in data) { //If data does not have the correct format (with topic)
                jsonLogger.topicWarning(JSON.stringify(data));
                logger.warn('Topic not supported: ' + data['topic']);
                response.write('Topic not supported: ' + data['topic']);
                response.end();
            } else {
                logger.warn('POST message received, but not processed');
            }
            logger.debug('Sent response to POST message');
        });

    //Serves files for webpage (HTML, JS, images, etc.)
    } else if (request.method === 'GET') {
        var filePath = '/', contentType = 'text/html', extname;

        filePath = request.url;
        logger.debug('Received GET message for url: ' + request.url);
        if (filePath == '/' || filePath.indexOf('logs') !== -1) {
            filePath = '/index.html';
        }

        filePath = __dirname + filePath;
        extname = path.extname(filePath);

        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.svg':
                contentType = 'image/svg+xml';
                break;
            case '.png':
                contentType = 'image/png';
                break;
        }
        logger.debug('Sending data as contentType: ' + contentType);

        logger.debug('Attempting to read file: ' + filePath);
        fs.exists(filePath, function (exists) {
            if (exists) {
                fs.readFile(filePath, function (error, content) {
                    if (error) {
                        logger.error('Error reading file' + filePath);
                        response.writeHead(500);
                        response.end();
                    }
                    else {
                        logger.verbose('Successfully read file: ' + filePath);
                        response.writeHead(200, { 'Content-Type': contentType });
                        response.end(content, 'utf-8');
                    }
                });
            } else {
                logger.warn('File requested does not exist:\n' + filePath);
                response.writeHead(404);
                response.end();
            }
        });
    }
});

// Runs as server starts listening
server.listen(port, function () {
    logger.info('Server initializing');
    logger.info('Console logging level = ' + loggingTransports.console.level);
});

// Creates the server
wsServer = new WebSocketServer({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function (request) {
    var connection = request.accept(null, request.origin); // Accepts the WebSocket connection
    logger.info('New WebSocket connection received from ' + request.remoteAddress);

    connection.on('message', function (message) { // Processes the WebSocket message
        if (message.type === 'utf8') {
            data = tryParseJSON(message.utf8Data);
            if (!data) {
                logger.warn('Message format unsupported: ' + message.utf8Data);
                jsonLogger.parsingError(message.utf8data);
            } else if ('CON' in data) { //Initial connection from a browser client
                logger.debug('Sending acknowledgement');
                connection.send(JSON.stringify({ 'CONNACK': 1 }));
                logger.debug('Sending previous data');
                //TODO: Update to handle multiple UAVs
                for (let key of payloads.keys()) { //Updates the client with current data
                    connection.send(JSON.stringify(payloads.get(key)));
                }
                logger.info('Adding user to userSet from ' + request.remoteAddress);
                userSet.add(connection);
            } else if ('UAVCON' in data) { //UAV initial connection
                logger.info('UAV connected');
                uavSet.add(new UAV(data['UAVCON']));
            } else if ('topic' in data && payloads.has(data['topic']) && !_.isEqual(payloads.get(data['topic']), data)) { //UAV JSON message
                logger.info('Updating payload data for topic: ' + data['topic']);
                jsonLogger.newData(data);
                payloads.set(data['topic'], data);
                updateUsers(data['topic']);
            } else if ('topic' in data && payloads.has(data['topic'])) {
                logger.verbose('Data already up to date for topic: ' + data['topic']);
                jsonLogger.dataUpToDate(data);
            } else if ('topic' in data) {
                logger.warn('Topic not supported: ' + data['topic']);
                jsonLogger.topicWarning(data);
            } else if ('username' in data && 'password' in data) { //If the user is logging on
                logger.info('Sign in attempt received from connection: "' + request.remoteAddress + '"');
                signIn(connection, data.username, data.password);
            } else if ('logRequest' in data) {
                logRequest(connection, data.logRequest);
            } else {
                logger.warn('Received JSON message but not processed');
            }
        }
    });

    connection.on('close', function (connection) { //When a connection is closed
        logger.info('Closed connection to ' + request.remoteAddress);
    });
});

/**
 * Handles requests for logs and sends them zipped to the user.
 * 
 * @param {Object} connection WebSocket user requesting logs
 * @param {Object} req        The JSON object with request information
 */
function logRequest(connection, req) {
    if ('sessionId' in req && sessionSet.has(req.sessionId) && 'path' in req) {
        logger.info('Log request received: path = "' + req.path + '"');
        if (sessionSet.has(req.sessionId)) {
            logger.info('Successful request for "' + req.path + '"');
            var path = 'logs/' + req.path;
            fs.exists(path, function (exists) {
                if (exists) {
                    fs.readFile(path, function (error, content) {
                        if (error) {
                            logger.error('Error reading file:\n' + path);
                        } else {
                            logger.verbose('Successfully read file:\n' + path);
                            connection.send(JSON.stringify({
                                'logResponse': path.endsWith('.gz') ? content : toBuffer(pako.gzip(content))
                            }));
                        }
                    });
                } else {
                    logger.warn('File requested does not exist:\n' + path);
                }
            });
        }
    }
}

/**
 * Handles sign in attempts from clients.
 * 
 * The hashing function used is the PBKDF2 with SHA-512
 * 
 * @param {Object} connection WebSocket connection attempting to sign in
 * @param {String} user       Username to be used
 * @param {String} pass       Password to be used
 */
function signIn(connection, user, pass) {
    /* Used to generate a new salt and the respective derived key for a username and password combination.
     * To use, attempt to sign in using desired username and password, then copy new salt and derived key from the console logs.
    crypto.randomBytes(16, function (err, buffer) {
        var noncesalt = buffer.toString('hex');
        console.log('noncesalt = "' + noncesalt + '"');
        crypto.pbkdf2(pass, noncesalt, 100000, 64, 'sha512', (err, derivedKey) => {
            if (err) throw err;
            console.log('derivedKey.toString("hex") = "' + derivedKey.toString('hex') + '"');
        });
    });
    //*/

    if (logUsers.has(user)) {
        var user = logUsers.get(user);
        crypto.pbkdf2(pass, user.salt, user.iterations, 64, 'sha512', (err, derivedKey) => {
            if (err) throw err;
            if (derivedKey.toString('hex') === user.derivedKey) {
                var filePath = 'logs';
                crypto.randomBytes(16, function (err, buffer) {
                    sessionId = buffer.toString('hex');
                    sessionSet.add(buffer.toString('hex'));
                    logger.info('Successful sign in');
                    logger.debug('Attempting to read file:\n' + filePath);
                    fs.readdir(filePath, function (err, files) {
                        if (err) {
                            return logger.warn('Unable to scan directory: ' + err);
                        }
                        logger.debug('Unfiltered logs files are:\n' + files.toString().split(',').join('\n'));
                        var filteredFiles = files.filter(f => !f.startsWith('.'));
                        var fileSizes = [];
                        for (var i in filteredFiles) {
                            var size = fs.statSync('logs/' + filteredFiles[i])['size'];
                            fileSizes.push(size);
                        }
                        logger.debug('Filtered logs files are:\n' + filteredFiles.toString().split(',').join('\n'));
                        connection.send(JSON.stringify({
                            'signInResponse': {
                                'sessionId': sessionId,
                                'files': filteredFiles,
                                'fileSizes': fileSizes
                            }
                        }));
                    });
                });
            } else {
                connection.send(JSON.stringify({
                    'signInResponse': 'Incorrect username or password'
                }));
            }
        });
    } 
}

//TODO: Update to handle multiple UAVs
function updateUsers(topic) {
    logger.debug('Updating users on topic: ' + topic);
    for (let user of userSet) {
        user.send(JSON.stringify(payloads.get(topic)));
    }
}

/**
 * Converts an ArrayBuffer to a Buffer.
 * 
 * @param {ArrayBuffer} arrayBuffer ArrayBuffer to be converted
 * @return {Buffer} Converted Buffer
 */
function toBuffer(arrayBuffer) {
    var buffer = Buffer.alloc(arrayBuffer.byteLength);
    var arr = new Uint8Array(arrayBuffer);
    for (var i = 0; i < buffer.length; i++) {
        buffer[i] = arr[i];
    }
    return buffer;
}

/**
 * Checks if the passed object is "empty", or contains no properties.
 * 
 * @param  {any}     obj Object being checked
 * @return {Boolean}     Boolean value that is true if empty and false if not 
 */
function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            return false;
        }
    }
    return JSON.stringify(obj) === JSON.stringify({});
}

/**
 * Attempts to parse a string as a JSON object and returns the JSON object if it can, or false if it can't.
 * 
 * @param  {String} jsonString String to be parsed as a JSON object
 * @return {(Object|Boolean)}  Returns a JSON object or false if the string could not be parsed
 */
function tryParseJSON(jsonString) {
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            logger.debug('Successfully parsed JSON string');
            return o;
        }
    }
    catch (e) {
        logger.warn('Error in parsing JSON object:\n' + e.message);
    }
    return false;
};

/**
 * Prints the properties and property values for the object passed
 * 
 * @param {any} obj Object whose properties are to be printed
 */
function printProperties(obj) {
    let propValue;
    for (letpropName in obj) {
        propValue = obj[propName];
        console.log('Property Name = ' + propName);
        console.log('Property Value = ' + propValue);
    }
}