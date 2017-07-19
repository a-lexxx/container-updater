'use strict';

const http = require('http');
const DWH = require('docker-hub-webhook-handler');

const logger = require('./lib/logger');

const config = require('./lib/config-provider')('run/config.js');
const DM = require('./lib/docker');

const fs = require('fs');

function unlinkSocket(file) {
    try {
        fs.unlinkSync(file);
    } catch (e) {} // eslint-disable-line no-empty
}

// TODO: prevent running several copies

logger.info('Starting...');

config.reload()
.then(() => {
        const dm = new DM(config.get('general.dockerConnectionOptions'));
        const handler = DWH({
            path: config.get('general.prefix'),
            secret: config.get('general.secret'),
            responseCode: 404,
            responseText: 'Not found'  // prevent info disclosure
        });
        const portOrSocket = config.get('general.port');
        const isSocket = isNaN(portOrSocket);
        isSocket && unlinkSocket(portOrSocket);

        const server = http.createServer(function(req, res) {
            handler(req, res, function(err) { // eslint-disable-line no-unused-vars
                logger.debug('Error occured', err);
                res.statusCode = 404;
                res.end('Not found'); // prevent info disclosure
            });
        }).listen(portOrSocket);

        server.on('listening', () => {
            isSocket && fs.chmod(portOrSocket, 0o666);
        });

        handler.on('error', function(err, req) {
            const remote = req && req.socket && req.socket.remoteAddress;
            logger.error('Error', remote ? ` (from ${remote}):` : ':', err.message || err);
        });

        handler.on('build', function(event) {
            const { repoName, imageTag } = event;
            logger.debug(`Got build event on "${repoName}"`);
            config.reload()
                .then(() => {
                    dm.update(config.get('updater'), repoName, imageTag);
                });
        });
    })
    .catch(err => {
        logger.error(err);
    });
