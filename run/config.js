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
