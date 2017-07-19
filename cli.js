const config = require('./lib/config-provider')('run/config.js');
const DM = require('./lib/docker');

const args = process.argv.reduce((acc, item) => {
    if (acc.inserting) acc.push(item);
    item === __filename && (acc.inserting = true);
    return acc;
}, []);

function showUsage() {
    console.log('Usage: node cli.js update <imageName> ');
}

config.reload()
    .then(() => {
        const dm = new DM(config.get('general.dockerConnectionOptions'));
        const operation = {
            update: () => {
                const name = args[1];
                if (!name) return showUsage();
                const [repoName, imageTag] = name.split(':');
                return dm.update(config.get('updater'), repoName, imageTag);
            }
        }[args[0]];

        if (!operation) return showUsage();
        return operation();

    });
