'use strict';

const logger = require('./logger');
const Docker = require('dockerode');

const ContainerCell = require('./containerCell');

class DockerManager extends Docker {
    constructor(dockerConnectionOptions) {
        super(dockerConnectionOptions);
    }

    configure(options) {
        this._options = options;
        this._byName = options.byName || {};
        delete this._options.byName;
        return Promise.resolve(this);
    }

    _getContainerConfig(repoName) {
        return Object.assign({}, this._options, this._byName[repoName]);
    }

    getServicedList(repoName, tagName) {
        const repoConfig = this._repoConfig =  this._getContainerConfig(repoName);
        if (repoConfig.updateDisabled) {
            logger.debug('Repo update disabled by config');
            return [];
        }
        return this.listContainers(this._options.filter)
            .then(workingCts => {
                const filteredList = workingCts
                    .filter(container => container.Image === repoName || container.Image === `${repoName}:${tagName}`)
                    .map(info => new ContainerCell(info, this, repoConfig));
                logger.debug(`Filtered ${filteredList.length} of ${workingCts.length} containers`);
                return filteredList;
            });
    }

    processUpdateList(newImageName, containersList) {
        return Promise.all(containersList.map(containerCell => containerCell.upgrade(newImageName)));
    }

    download(updateLink) {
        logger.debug(`Pulling new "${updateLink}" image`);
        return this.pull(updateLink, this._repoConfig.dockerPullAuthOptions);
        // return Promise.resolve();
    }

    update(updaterConfig, repoName, imageTag) {
        imageTag || (imageTag = 'latest');
        const newImageName = `${repoName}:${imageTag}`;

        return Promise.resolve(
                typeof updaterConfig === 'function' ? updaterConfig(repoName, imageTag) : updaterConfig
            )
            .then(conf => this.configure(conf))
            .then(() => this.getServicedList(repoName, imageTag))
            .then(ctsList => {
                if (!ctsList.length) return Promise.reject({ type: 'empty' });
                logger.info(`Updating ${ctsList.length} container(s) with new ${repoName}`);

                return this.download(newImageName)
                    .then(() => ctsList);
            })
            .then(ctsList => this.processUpdateList(newImageName, ctsList))
            .catch(err => {
                if (err.type === 'empty') return;
                logger.error('Error ocurred: ', err, err.stack);
            });
    }

}

module.exports = DockerManager;
