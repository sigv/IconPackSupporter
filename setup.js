#!/usr/bin/env node
var fs = require('fs'),
    path = require('path'),
    xml2js = require('xml2js'),
    parse = require('xml2js').parseString;

// paths to the modifiable files
var projectfn = './.project';
var manifestfn = './AndroidManifest.xml';
var basefn = './res/values/base.xml';
var cfgfn = './assets/themecfg.xml';
var iconpackfn = './res/values/iconpack.xml';
var drawablefn = './res/xml/drawable.xml';
var drawablegfn = './assets/drawable.xml';

// pretty self-explanatory variables
var core = { name: '', description: '', authorDeveloper: '', link: '', packageName: '' };
var filesUpdated = 0;
var drawables = [];
var previews = [];

// grabs all the drawables and populates the two arrays
var dirs = fs.readdirSync('./res');
for (var i in dirs) {
    var dir = dirs[i];
    if (dir === 'drawable' || dir.indexOf('drawable-') === 0) {
        var files = fs.readdirSync('./res/' + dir);
        for (var y in files) {
            var ext = path.extname(files[y]);
            if (ext === '.png' || ext === '.jpg' || ext === '.gif') {
                var drawable = files[y].replace(ext, '');
                if (drawables.indexOf(drawable) === -1 && drawable !== 'theme_icon' && drawable !== 'theme_mainfeature' && drawable.indexOf('theme_preview') !== 0) {
                    drawables.push(drawable);
                } else if (previews.indexOf(drawable) === -1 && drawable.indexOf('theme_preview') === 0) {
                    previews.push(drawable);
                }
            }
        }
    }
}

// start the question chain
function startChain() {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdout.write('What do you want to put as your icon pack\'s name? ');
    process.stdin.once('data', setPackName);
}

// set the icon resource files (add and remove the appropriate declarations)
function updateIconReferences() {
    parse(fs.readFileSync(iconpackfn), function checkIconpack(err, result) {
        if (err) throw err;
        var setDrawables = [];
        for (var i in result.resources['string-array'][0].item) {
            var d = result.resources['string-array'][0].item[i];
            if (drawables.indexOf(d) === -1) {
                console.log('[iconpack res] Removing a reference to the ' + d + ' icon');
                delete result.resources['string-array'][0].item[i];
            } else if (setDrawables.indexOf(d) === -1) setDrawables.push(d);
        }

        for (var y in drawables) {
            var d = drawables[y];
            if (setDrawables.indexOf(d) !== -1) continue;
            if (result.resources['string-array'][0].item === undefined)
                result.resources['string-array'][0].item = [];
            result.resources['string-array'][0].item.push(d);
            console.log('[iconpack res] Creating a reference to the ' + d + ' icon');
        }

        fs.writeFileSync(iconpackfn, (new xml2js.Builder()).buildObject(result));
        console.log('[iconpack res] Finished writing file');

        if (++filesUpdated === 3) startChain();
    });

    parse(fs.readFileSync(drawablefn), function checkDrawable(err, result) {
        if (err) throw err;
        delete result.resources.category; // TODO add category support
        var setDrawables = [];
        for (var i in result.resources.item) {
            var d = result.resources.item[i].$.drawable;
            if (drawables.indexOf(d) === -1) {
                console.log('[drawable res] Removing a reference to the ' + d + ' icon');
                delete result.resources.item[i];
            } else if (setDrawables.indexOf(d) === -1) setDrawables.push(d);
        }

        for (var y in drawables) {
            var d = drawables[y];
            if (setDrawables.indexOf(d) !== -1) continue;
            if (result.resources.item === undefined)
                result.resources.item = [];
            result.resources.item.push({ $: { drawable: d } });
            console.log('[drawable res] Creating a reference to the ' + d + ' icon');
        }

        fs.writeFileSync(drawablefn, (new xml2js.Builder()).buildObject(result));
        console.log('[drawable res] Finished writing file');

        if (++filesUpdated === 3) startChain();
    });

    parse(fs.readFileSync(drawablegfn), function checkDrawableG(err, result) {
        if (err) throw err;
        var setDrawables = [];
        for (var i in result.resources.item) {
            var d = result.resources.item[i].$.drawable;
            if (drawables.indexOf(d) === -1) {
                console.log('[drawable ast] Removing a reference to the ' + d + ' icon');
                delete result.resources.item[i];
            } else if (setDrawables.indexOf(d) === -1) setDrawables.push(d);
        }

        for (var y in drawables) {
            var d = drawables[y];
            if (setDrawables.indexOf(d) !== -1) continue;
            if (result.resources.item === undefined)
                result.resources.item = [];
            result.resources.item.push({ $: { drawable: d } });
            console.log('[drawable ast] Creating a reference to the ' + d + ' icon');
        }

        fs.writeFileSync(drawablegfn, (new xml2js.Builder()).buildObject(result));
        console.log('[drawable ast] Finished writing file');

        if (++filesUpdated === 3) startChain();
    });

// TODO listing sorting?

// TODO app filters?

}

// store the data according to the values inside the core object
function setCore() {
    parse(fs.readFileSync(projectfn), function checkProject(err, result) {
        if (err) throw err;
        result.projectDescription.name = core.name;
        fs.writeFileSync(projectfn, (new xml2js.Builder()).buildObject(result));
        console.log('[project file] Finished writing file');
    });

    parse(fs.readFileSync(manifestfn), function checkManifest(err, result) {
        if (err) throw err;
        result.manifest.$.package = core.packageName;
        fs.writeFileSync(manifestfn, (new xml2js.Builder()).buildObject(result));
        console.log('[the manifest] Finished writing file');
    });

    parse(fs.readFileSync(basefn), function checkBase(err, result) {
        if (err) throw err;
        for (var i in result.resources.string) {
            switch (result.resources.string[i].$.name) {
            case 'theme_title':
                result.resources.string[i]._ = core.name;
                break;
            case 'theme_description':
            case 'theme_info':
                result.resources.string[i]._ = core.description;
                break;
            case 'authorName':
            case 'developerName':
            case 'developer_name':
                result.resources.string[i]._ = core.authorDeveloper;
                break;
            case 'authorLink':
            case 'developer_link':
                result.resources.string[i]._ = core.link;
                break;
            }
        }
        result.resources.string = result.resources.string.filter(function(element) { return element.$.name.indexOf('theme_preview') !== 0; });
        for (var y in previews) result.resources.string.push({ _: previews[y], $: { name: 'theme_preview' + (parseInt(y, 10) + 1) } });
        fs.writeFileSync(basefn, (new xml2js.Builder()).buildObject(result));
        console.log('[base cfg res] Finished writing file');
    });

    parse(fs.readFileSync(cfgfn), function checkCfg(err, result) {
        if (err) throw err;
        result.theme.themeName = core.name;
        result.theme.themeInfo = core.description;
        result.theme.preview = { $: {} };
        for (var y in previews) result.theme.preview.$['img' + (parseInt(y) + 1)] = previews[y];
        fs.writeFileSync(cfgfn, (new xml2js.Builder()).buildObject(result));
        console.log('[themecfg ast] Finished writing file');
    });

    process.stdin.pause();
}

// get the package name from the user
function setPackageName(data) {
    var packageName = data.toString().trim();
    if (packageName === '') {
        process.stdout.write('The package name cannot be empty. What do you want to put there? ');
        process.stdin.once('data', setPackageName);
        return;
    }

    core.packageName = packageName;

    setCore();
}

// get the author/developer link from the user
function setLink(data) {
    core.link = data.toString().trim();

    var admod = core.authorDeveloper.toLowerCase().split(' ').join('');
    var nmod = core.name.toLowerCase().split(' ').join('');
    var suggestedPackageName = 'com.' + (admod === nmod ? admod : admod + '.' + nmod);
    process.stdout.write('What do you want to put as your icon pack\'s package name? (Suggesting: ' + suggestedPackageName + ') ');
    process.stdin.once('data', setPackageName);
}

// get the author/developer name from the user
function setAuthorDeveloper(data) {
    var name = data.toString().trim();
    if (name === '') {
        process.stdout.write('The author/developer name cannot be empty. What do you want to put there? ');
        process.stdin.once('data', setAuthorDeveloper);
        return;
    }

    core.authorDeveloper = name;

    process.stdout.write('What do you want to put as your icon pack\'s author/developer link? (Just leave this empty if you have no website to link to.) ');
    process.stdin.once('data', setLink);
}

// get the icon pack's description from the user
function setPackDescription(data) {
    var description = data.toString().trim();
    if (description === '') {
        process.stdout.write('The description cannot be empty. What do you want to put there? ');
        process.stdin.once('data', setPackDescription);
        return;
    }

    core.description = description;

    process.stdout.write('What do you want to put as your icon pack\'s author/developer name? ');
    process.stdin.once('data', setAuthorDeveloper);
}

// get the icon pack's name from the user
function setPackName(data) {
    var name = data.toString().trim();
    if (name === '') {
        process.stdout.write('The name cannot be empty. What do you want to put there? ');
        process.stdin.once('data', setPackName);
        return;
    }

    core.name = name;

    process.stdout.write('What do you want to put as your icon pack\'s description? ');
    process.stdin.once('data', setPackDescription);
}

// start the chain
updateIconReferences();

