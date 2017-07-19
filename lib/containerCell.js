'use strict';

const logger = require('./logger');

const SELF_LABEL = 'syngularity.docker.updater';

function deepEqual(x, y) {
    if ((typeof x === 'object' && x !== null) && (typeof y === 'object' && y !== null)) {
        if (x === y) return true;
        if (Object.keys(x).length !== Object.keys(y).length) return false;
        return Object.keys(x).every(prop => {
            if (!y.hasOwnProperty(prop)) return false;
            if (!deepEqual(x[prop], y[prop])) return false;
            return true;
        });
    }

    return x === y;
}

class containerCell {

    constructor(info, docker, options) {
        this.options = Object.assign({}, options);
        this.docker = docker;
        this.info = info;
        this.selfUpdate = info.Labels.hasOwnProperty(SELF_LABEL);
        this.blueGreen = this.options.restartMode === 'blue-green' || this.selfUpdate;
        this.runtimeData = {};
        this.displayName = `${info.Image} (${info.Id.substr(0, 7)})`;
        this.instance = this.docker.getContainer(info.Id);
        this.selfUpdate && this.debug('self updating in blue-green mode');
    }

    init() {
        return Promise.all([this._pullFullConfig(), this._pullImageInfo()]).then(() => this);
    }

    _runHook(hook, msg, ...args) {
        if (!hook) return Promise.resolve();
        if (typeof hook !== 'function') throw new Error('Hook should be a function');
        this.debug(`${msg}`);
        const ret = hook.call(this.runtimeData, this, ...args);
        if (ret && typeof ret.then === 'function') return ret; // TODO: check for real promise
        return Promise.resolve(ret);
    }

    _pullFullConfig() {
        return this.instance.inspect()
            .then(container => { this.fullConfig = container; });
    }

    _pullImageInfo() {
        return this.docker.getImage(this.info.ImageID).inspect()
        .then(image => { this.image = image; });
    }

    debug(...args) {
        logger.debug(`${this.displayName}:`, ...args);
    }

    stop() {
        return this._runHook(this.options.preStopHook, 'pre-stop hook')
            .then(() => {
                this.debug('stopping...');
                return this.instance.stop();
            })
            .then(() => {
                this.wasStopped = true;
                return this._runHook(this.options.postStopHook, 'post-stop hook');
            })
            .then(() => this);
    }

    start() {
        return this._runHook(this.options.preStartHook, 'pre-start hook')
            .then(() => {
                this.debug('starting...');
                if (!this.newInstance) throw new Error('New instance of container was not initialized');
                return this.newInstance.start()
                    .then(() => { this.goodStart = true; })
                    .catch(err => this._onFailStart(err))
                    .then(() => {
                        return this._runHook(this.options.postStartHook, 'post-start hook');
                    });
            })
            .then(() => this);
    }

    _cleanup() {
        // async remove ?
        if (!this.goodStart || this.options.noCleanup) return;
        this.instance.remove()
            .catch(err => {
                if (err.statusCode === 404) {
                    return this.debug('container already was removed');
                } else throw err;
            });
    }

    _onFailStart(err) {
        this.goodStart = false;
        logger.error(err);
        this._runHook(this.options.failStartHook, 'fail-start hook');
        if (this.blueGreen) throw err; // throw to stop upgrade process
        if (!this.options.noRestoreAfterFail) {
            logger.warn(`${this.displayName}: start of new container was unsuccessful. Restoring previous state`);
            return this.instance.start()
                .then(() => { this.wasRestored = true; });
        }
    }

    upgrade(newImageName) {
        return this.init()
            .then(() => this._getContainerRunOptions(newImageName))
            .then(runConfig => this._checkRunConfig(runConfig))
            .then(runConfig => logger.verbose('config', runConfig) || this.docker.createContainer(runConfig))
            .then(newInstance => {
                this.newInstance = newInstance;
                return this;
            })
            .then(() => {
                const order = this.blueGreen ? ['start', 'stop'] : ['stop', 'start'];

                return this[order[0]]().then(() => this[order[1]]());
            })
            .then(() => this._cleanup())
            .then(() => this.debug(this.goodStart ? 'Successfully done' : 'Done'))
            .catch(err => logger.error('skipped because', err));
    }

    _checkRunConfig(config) {
        if (!config || typeof config !== 'object') {
            throw `User supplied configuration function should returns object, got ${typeof config}`;
        }
        if (this.blueGreen && config.HostConfig && Object.keys(config.HostConfig.PortBindings).length) {
            throw 'Containers with port bindings cannot be upgraded in blue-green mode. Skiping..';
        }

        return config;
    }

    // https://github.com/v2tec/watchtower/blob/master/container/container.go#L102
    // Ideally, we'd just be able to take the ContainerConfig from the old container
    // and use it as the starting point for creating the new container; however,
    // the ContainerConfig that comes back from the Inspect call merges the default
    // configuration (the stuff specified in the metadata for the image itself)
    // with the overridden configuration (the stuff that you might specify as part
    // of the "docker run"). In order to avoid unintentionally overriding the
    // defaults in the new image we need to separate the override options from the
    // default options. To do this we have to compare the ContainerConfig for the
    // running container with the ContainerConfig from the image that container was
    // started from. This function returns a ContainerConfig which contains just
    // the options overridden at runtime.
    _getContainerRunOptions(newImageName) {
        const config = this.fullConfig.Config;
        const imageConfig = this.image.Config;
        const userConfig = this.options.configRun;

        // TODO: (containers dependencies) linked containers "Links": [ "redis3:redis" ]

        const mandatoryOptions = {
            Image: newImageName,
            HostConfig: this.fullConfig.HostConfig
        };
        const filterableOptions = ['Hostname'].concat(Object.keys(mandatoryOptions)).reduce((acc, item) => {
            acc[item] = true;

            return acc;
        }, {});
        const optionList = Object.keys(Object.keys(config).reduce((acc, field) => {
            acc[field] = true;

            return acc;
        }, {})).filter(item => !filterableOptions[item]);

        let resultConfig = Object.assign(optionList.reduce((acc, field) => {
            const cval = config[field];
            deepEqual(cval, imageConfig[field]) || (acc[field] = cval);

            return acc;
        }, {}), mandatoryOptions);

        if (typeof userConfig !== 'function') return Promise.resolve(Object.assign(resultConfig, userConfig));
        return this._runHook(userConfig, 'config hook', resultConfig);
    }
}

module.exports = containerCell;
