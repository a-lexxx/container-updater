# container-updater

Inspired by [dockerode](https://github.com/apocas/dockerode), [cptwebhook](http://captain-webhook.readthedocs.io/en/latest/) and [watchtower](https://github.com/v2tec/watchtower)

Updates working docker containers on webhooks.

## ENV
    All env variables prefixed by 'CUPD_'
    * CUPD_LOGLEVEL=DEBUG # http://seanmonstar.github.io/intel/#setting-the-log-level
    * CUPD_configFile=run/config.js
    * CUPD_port=8081
    * CUPD_dockerConnectionOptions_port=80 # https://github.com/apocas/dockerode#getting-started
    * CUPD_* --- all options from general section of config file


## config
By default is loaded from run/config.js
```
    module.exports = {
        general: {
            port: 8080,
            prefix: '/webhook',
            secret: 'myhashsecret'
            // https://github.com/apocas/dockerode#getting-started
            // dockerConnectionOptions: {}
        },
        updater: {
            updateDisabled: false,
            forceUpdatePeriod: 24,
            // https://github.com/apocas/dockerode#pull-from-private-repos
            dockerPullAuthOptions: null,
            // https://docs.docker.com/engine/reference/commandline/ps/#filteringš
            filter: '',
            // noCleanup: true,
            // noRestoreAfterFail: true,
            // restartMode: 'blue-green',
            preStopHook: () => {},
            postStopHook: () => Promise.resolve(0),
            preStartHook: () => {},
            postStartHook: () => Promise.resolve(0),
            failStartHook: () => {},
            // https://docs.docker.com/engine/api/v1.27/#operation/ContainerList
            byName: {
                'some/other': {
                    updateDisabled: true
                },
                'syngularity/bemder': {
                    configRun: (containerCell, config) => config
                }
            }
        }
    };

```

## CLI
```
node cli.js update <imageName>
```
