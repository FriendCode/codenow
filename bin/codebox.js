#!/usr/bin/env node

// Requires
var Q = require('q');
var _ = require('underscore');
var fs  =  require('fs');
var path = require('path');
var cli = require('commander');
var pkg = require('../package.json');
var exec = require('child_process').exec;
var Codebox = require('../index.js').Client;

// Settings
var settings = require('cat-settings').loadSync(__dirname + '/../settings.json');
var defaultSettings = {
    'token': '',
    'host': 'https://api.codebox.io'
};
_.defaults(settings, defaultSettings);

// Return package info for addons
var getPackage = directory => {
    var git;
    var gitRef;
    var packagePath;
    var packageInfos;
    packagePath = path.join(directory, "package.json");

    // Check directory is a git repository
    return Q.nfcall(exec, "cd "+directory+" && git config --get remote.origin.url").then(output => {
        git = output.join("").replace(/(\r\n|\n|\r)/gm, "");
        
        // Check package.json exists
        if (!fs.existsSync(packagePath)) {
            return Q.reject(new Error("package.json not found"));
        } else {
            return Q();
        }
    }).then(() => // Read current commit
    Q.nfcall(exec, "cd "+directory+" && git rev-parse HEAD").then(output => {
        gitRef = output.join("").replace(/(\r\n|\n|\r)/gm, "");
    })).then(() => // Read package.json
    Q.nfcall(fs.readFile, packagePath, 'utf8')).then(output => {
        packageInfos = JSON.parse(output);
        return Q({
            'git': git+"#"+gitRef,
            'package': packageInfos
        });
    });
};

// Client
var client = new Codebox({
    'token': settings.token,
    'host': settings.host
});
client.on("apierror", (err, body) => {
    console.log("error: ", body);
});

////// Define auth token
cli
.command('whoami')
.description('display current authentication.')
.action(() => {
    console.log("Client currently use:");
    console.log("\tHost: %s", client.config.host);
    console.log("\tToken: %s", client.config.token);
});

////// Define auth token
cli
.command('auth [token]')
.description('configure authentication.')
.action(token => {
    if (!token) {
        console.log("Need token to authenticate: codebox-io -h for more infos");
        return;
    }
    console.log("Authentication will use API token:", token);
    settings.token = token;
    settings.saveSync();
});

////// Define hostname
cli
.command('host [hostname]')
.description('configure Codebox host.')
.action(host => {
    console.log("Codebox host is:", host);
    settings.host = host;
    settings.saveSync();
});


////// Reset settings
cli
.command('reset')
.description('reset settings.')
.action(() => {
    _.extend(settings, defaultSettings);
    settings.saveSync();
    console.log("Settings have been reset!");
});


////// List boxes
cli
.command('list')
.description('list boxes.')
.action(() => {
    client.boxes().then(boxes => {
        boxes.forEach(box => {
            console.log(box.name, "|", box.url)
        })
    });
});

////// Download a box
cli
.command('download [id] [output]')
.description('download a box content.')
.action((boxId, output) => {
    if (!boxId) {
        console.log("Need boxId to download content: codebox-io -h for more infos");
        return;
    }
    if (!output) {
        console.log("Need file path to downlaod content: codebox-io -h for more infos");
        return;
    }

    client.box(boxId).then(box => {
        console.log("Start Downloading %s...", box.name);
        console.log(" In file %s", output);
        return box.content(output);
    }).then(() => {
        console.log("\nEnd, content is in %s", output);
    }, err => {
        console.log("\nError:", err);
    }, n => {
        console.log('\t-> got %d bytes of data', n);
    });
});

////// Create a box
cli
.command('create [type] [name]')
.description('create a new box (type could be type1 or type2).')
.action(function(boxType, boxName) {
    if (!boxType || !boxName) {
        console.log("Need 'name' and 'type' to create a box");
        return;
    }

    client.create({
        'name': boxName,
        'type': boxType,
        'git': this.git,
        'stack': this.stack,
        'description': this.label
    }).then(box => {
        console.log(box.name, "|", box.url);
    });
});

////// Publish an addon
cli
.command('publish [directory]')
.description('Publish an addon.')
.action(directory => {
    directory = path.resolve(directory || "./");
    getPackage(directory).then(packageInfos => client.publishAddon(packageInfos)).then(addon => {
        console.log("published", addon.name, ":", addon["package"]["version"]);
    }, err => {
        console.log("error publishing addon:", err);
    })
});

////// Unpublish an addon
cli
.command('unpublish [directory]')
.description('Unpublish an addon.')
.action(directory => {
    directory = path.resolve(directory || "./");
    getPackage(directory).then(packageInfos => client.unpublishAddon(packageInfos["package"].name)).then(addon => {
        console.log("Unpublished addon from", directory);
    }, err => {
        console.log("error publishing addon:", err);
    })
});


cli.option('-g, --git <git url>', 'GIT url for a new box.');
cli.option('-s, --stack <stack name>', 'Stack for a new box.');
cli.option('-l, --label <Description Label>', 'Description for a new box.');


cli.version(pkg.version).parse(process.argv);

if (!cli.args.length) cli.help();

