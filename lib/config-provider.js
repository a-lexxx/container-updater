'use strict';

const fileEval = require('file-eval');
var op = require('object-path');

const logger = require('./logger');

const envPrefix = 'CUPD';

class Config {
    constructor(confFile) {
        this._confFile = process.env[`${envPrefix}_configFile`] || confFile;
    }

    _reloadFile() {
        return fileEval(this._confFile)
            .catch(err => {
                if (err.code === 'ENOENT') return logger.warn('Warn: config file was not found');
                throw err;
            });
    }

    _reloadEnv() {
        const env = process.env;
        const keys = Object.keys(env);
        return {
            general: keys.reduce((acc, key) => {
                const [prefix, ...parts] = key.split('_');
                prefix === envPrefix && env[key] && (op.set(acc, parts, env[key]));

                return acc;
            }, {})
        };
    }

    _getDefaults() {
        return {
            general: {
                port: 8080,
                prefix: '/webhook',
                secret: 'myhashsecret'
                // dockerConnectionOptions: {}
            },
            updater: {
            }
        };
    }

    reload() {
        return Promise.all([this._getDefaults(), this._reloadFile(), this._reloadEnv()])
        .then(confs => {
                logger.log('confs[2] ---> ', confs[2]);
                const extractField = f => confs.map(conf => conf && conf[f]);
                this._store = {
                    general: Object.assign({}, ...extractField('general')),
                    updater: Object.assign({}, ...extractField('updater'))
                };
            });
    }

    get(key) {
        if (!this._store) throw new Error('Config should be reloaded before first use');
        return op.get(this._store, key);
    }
}

module.exports = function(confFile) {
    return new Config(confFile);
};
