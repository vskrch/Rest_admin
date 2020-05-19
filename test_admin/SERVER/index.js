var WebSocketServer = require('websocket').server;
var http = require('http');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var winston = require('winston');
require('winston-daily-rotate-file');

var myArgs = process.argv.slice(2);

var logLevel = 'info';
var port = 80;

<<<<<<< HEAD
//Command line argument methods for logging level and port number
var myArgs = process.argv.slice(2);
=======
>>>>>>> parent of 5cd72f6... Moved error logger to loggingTransports for consistency
if (myArgs.includes('-L') && myArgs.indexOf('-L') < (myArgs.length - 1) && winston.config.npm.levels[myArgs[myArgs.indexOf('-L') + 1]] !== 'undefined') {
    logLevel = myArgs[myArgs.indexOf('-L') + 1];
}
if (myArgs.includes('-p') && myArgs.indexOf('-p') < (myArgs.length - 1)  && !isNaN(myArgs[myArgs.indexOf('-p') + 1])) {
    port = myArgs[myArgs.indexOf('-p') + 1];
}

<<<<<<< HEAD
/**
 * Formatting for console/debugging logs.
 * 
 * Format creates logs as below:
 * 2019-11-25T16:08:37.764Z [Romaeris Web Server] Info: Updating payload data for topic: navio1/message
 */
=======
//Formatting for console/debugging logs
>>>>>>> parent of 5cd72f6... Moved error logger to loggingTransports for consistency
const myFormat = winston.format.printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level.charAt(0).toUpperCase() + level.substring(1)}: ${message}`;
});

<<<<<<< HEAD
/**
 * Transports for use in the logger that rotates log files daily or after reaching 100 megabytes.
 * 
 * The logging transports need to be in a seperate object in order to allow the logging level to be changed during runtime.
 * This could be moved within the constructor of the logger since the level is not currently changed during runtime, but having 
 * the transports seperate improves readability and allows for accessing variables directly from the loggingTransports object.
 */
const loggingTransports = {
=======
//Transports for console/debugging
const loggingtransports = {
>>>>>>> parent of 5cd72f6... Moved error logger to loggingTransports for consistency
    console: new winston.transports.Console({
        level: logLevel
    }),
    verboseLogs: new winston.transports.DailyRotateFile({
        level: 'verbose',
        dirname: 'logs',
        filename: '%DATE%-verboseLogs.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '100m',
        maxFiles: '2'
    }),
    debugLogs: new winston.transports.DailyRotateFile({
        level: 'debug',
        dirname: 'logs',
        filename: '%DATE%-debugLogs.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '100m',
        maxFiles: '2'
    })
}

//Logger for consol/debugging
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.label({ label: 'Romaeris Web Server' }),
        winston.format.timestamp(),
        myFormat
    ),
    transports: [
        loggingtransports.console,
        loggingtransports.verboseLogs,
        loggingtransports.debugLogs
    ],
    exceptionHandlers: [
        new winston.transports.DailyRotateFile({
            level: 'debug',
            dirname: 'logs',
            filename: '%DATE%-errorLogs.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '100m',
            maxFiles: '2'
        })
    ]
});

<<<<<<< HEAD
/**
 * Logger for JSON data needs a seperate logger object due to a different format.
 * JSON string format is more easily parsed by a computer if the logs ever need to be extracted.
 */
=======
//Logger for JSON data
>>>>>>> parent of 5cd72f6... Moved error logger to loggingTransports for consistency
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
            maxSize: '100m',
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
var uavMap = new Map();

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
            response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });
            if (!data) {
                jsonLogger.parsingError(rawString);
                logger.warn('POST data not in JSON format: ' + rawString);
                response.write('POST data not in JSON format:\n' + rawString);
            } else if ('topic' in data && payloads.has(data['topic']) && !_.isEqual(payloads.get(data['topic']), data)) {
                jsonLogger.newData(JSON.stringify(data));
                logger.info('Updating payload data for topic: ' + data['topic']);
                response.write('Updating payload data for topic: ' + data['topic']);
                payloads.set(data['topic'], data);
                updateUsers(data['topic']);
            } else if ('topic' in data && payloads.has(data['topic'])) {
                jsonLogger.dataUpToDate(JSON.stringify(data));
                logger.verbose('Data already up to date for topic: ' + data['topic']);
                response.write('Data already up to date for topic: ' + data['topic']);
            } else if (!('topic' in data)) {
                jsonLogger.topicWarning(JSON.stringify(data));
                logger.warn('Topic not supported: ' + data['topic']);
                response.write('Topic not supported: ' + data['topic']);
            }
            logger.debug('Sending response to POST message');
            response.end();
        });

    //Serves files for webpage (HTML, JS, images, etc.)
    } else if (request.method === 'GET') {
        var filePath = '/', contentType = 'text/html', extname;

        filePath = request.url;
        logger.debug('Received GET message for url: ' + request.url);
        if (filePath == '/') {
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
            }
        });
    }
});

// Runs as server starts listening
server.listen(port, function () {
    logger.info('Server initializing');
    logger.info('Console logging level = ' + loggingtransports.console.level);
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
                logger.warn('Message format unsupported: ' + rawString);
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
                uavMap.set(data['UAVCON'], new Map([
                    ['navio1/message', {}],
                    ['navio2/message', {}],
                    ['engine/message', {}],
                    ['joystick/data', {}]
                ]));
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
            } else {
                logger.warn('Received JSON message but not processed');
            }
        }
    });

    connection.on('close', function (connection) { //When a connection is closed
        logger.info('Closing connection to ' + connection);
    });
});

//TODO: Update to handle multiple UAVs
function updateUsers(topic) {
    logger.debug('Updating users on topic: ' + topic);
    for (let user of userSet) {
        user.send(JSON.stringify(payloads.get(topic)));
    }
}

<<<<<<< HEAD
/**
 * Checks if the passed object is "empty", or contains no properties.
 * 
 * @param  {any}     obj Object being checked
 * @return {Boolean}     Boolean value that is true if empty and false if not 
 */
=======
function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

>>>>>>> parent of 5cd72f6... Moved error logger to loggingTransports for consistency
function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            return false;
        }
    }
    return JSON.stringify(obj) === JSON.stringify({});
}

<<<<<<< HEAD
/**
 * Attempts to parse a string as a JSON object and returns the JSON object if it can, or false if it can't.
 * 
 * @param  {any} jsonString   String to be parsed as a JSON object
 * @return {(object|Boolean)} Returns a JSON object or false if the string could not be parsed
 */
=======
>>>>>>> parent of 5cd72f6... Moved error logger to loggingTransports for consistency
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

<<<<<<< HEAD
/**
 * Prints the properties and property values for the object passed
 * 
 * @param {any} obj Object whose properties are to be printed
 * @return {void}
 */
=======
>>>>>>> parent of 5cd72f6... Moved error logger to loggingTransports for consistency
function printProperties(obj) {
    var propValue;
    for (var propName in obj) {
        propValue = obj[propName];
        logger.debug(propName, propValue);
    }
}