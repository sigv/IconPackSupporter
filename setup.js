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
var appfilterfn = './res/xml/appfilter.xml';
var appfiltergfn = './assets/appfilter.xml';

// pretty self-explanatory variables
var core = { name: '', description: '', authorDeveloper: '', link: '', packageName: '' };
var filesUpdated = 0;
var drawables = [];
var previews = [];

// sets the drawables that should not have appfilter rules (utilizes the .noappfilter file)
if (!fs.exists('.noappfilter')) fs.openSync('.noappfilter', 'a');
var noAppFilter = fs.readFileSync('.noappfilter').toString().split('\n').filter(function(element) { return element !== ''; });
var doAppFilter = {};

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

// getters for the default values
function getSuggestedName() { return 'Awesome Icon Pack'; }
function getSuggestedDescription() { return ''; }
function getSuggestedAuthorDeveloper() { return 'John Doe'; }
function getSuggestedLink() { return ''; }
function getSuggestedPackageName() {
    var admod = core.authorDeveloper.toLowerCase().split(' ').join('');
    var nmod = core.name.toLowerCase().split(' ').join('');
    var suggestedPackageName = 'com.' + (admod === nmod ? admod : admod + '.' + nmod);
    while (suggestedPackageName.indexOf('..') !== -1) suggestedPackageName.split('..').join('.');
    return suggestedPackageName;
}

// takes the user input to get the value that should be used
function consumeCoreInput(userInput, suggestedValue) {
    userInput = userInput.toString().trim();
    if (userInput === '') return suggestedValue;
    if (userInput === '.') return '';
    return userInput.replace('\\n', '\n');
}

// start the question chain
function startChain() {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdout.write('Name (title of icon pack) [' + getSuggestedName() + ']: ');
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

        if (result.resources.item !== undefined)
            result.resources.item.sort(function(a, b) { return a.toString().localeCompare(b.toString()); });

        fs.writeFileSync(iconpackfn, (new xml2js.Builder()).buildObject(result));
        console.log('[iconpack res] Finished writing file');
        console.log();

        if (++filesUpdated === 5) startChain();
    });

    [{ filename: drawablefn, tag: 'drawable res' }, { filename: drawablegfn, tag: 'drawable ast' }].forEach(function(meta) {
        parse(fs.readFileSync(meta.filename), function checkDrawable(err, result) {
            if (err) throw err;
            delete result.resources.category; // TODO add category support
            var setDrawables = [];
            for (var i in result.resources.item) {
                var d = result.resources.item[i].$.drawable;
                if (drawables.indexOf(d) === -1) {
                    console.log('[' + meta.tag + '] Removing a reference to the ' + d + ' icon');
                    delete result.resources.item[i];
                } else if (setDrawables.indexOf(d) === -1) setDrawables.push(d);
            }

            for (var y in drawables) {
                var d = drawables[y];
                if (setDrawables.indexOf(d) !== -1) continue;
                if (result.resources.item === undefined)
                    result.resources.item = [];
                result.resources.item.push({ $: { drawable: d } });
                console.log('[' + meta.tag + '] Creating a reference to the ' + d + ' icon');
            }

            if (result.resources.item !== undefined)
                result.resources.item.sort(function(a, b) { return a.$.drawable.toString().localeCompare(b.$.drawable.toString()); });

            fs.writeFileSync(meta.filename, (new xml2js.Builder()).buildObject(result));
            console.log('[' + meta.tag + '] Finished writing file');
            console.log();

            if (++filesUpdated === 5) startChain();
        });
    });

    var blRun = false;

    [{ filename: appfilterfn, tag: 'appfiltr res' }, { filename: appfiltergfn, tag: 'appfiltr ast' }].forEach(function (meta) {
        parse(fs.readFileSync(meta.filename), function checkAppfilter(err, result) {
            if (err) throw err;
            var blChain = [];
            for (var i in result.resources.item) {
                var d = result.resources.item[i].$.drawable;
                if (drawables.indexOf(d) === -1) {
                    console.log('[' + meta.tag + '] Removing a reference to the ' + d + ' icon');
                    delete result.resources.item[i];
                } else {
                    if (doAppFilter[d] === undefined) doAppFilter[d] = [];
                    var component = result.resources.item[i].$.component;
                    if (doAppFilter[d].indexOf(component) === -1) doAppFilter[d].push(component);
                }
            }

            var doStoreFile = function doStoreFile() {
                if (result.resources.item !== undefined)
                    result.resources.item.sort(function(a, b) {
                        var dsort = a.$.drawable.toString().localeCompare(b.$.drawable.toString());
                        return dsort === 0 ? a.$.component.toString().localeCompare(b.$.component.toString()) : dsort;
                    });

                fs.writeFileSync(meta.filename, (new xml2js.Builder()).buildObject(result));
                console.log('[' + meta.tag + '] Finished writing file');
                console.log();

                blRun = false;
                if (++filesUpdated === 5) startChain();
            };

            var createReference = function createReference(d) {
                if (doAppFilter[d] === undefined) doAppFilter[d] = [];
                for (var c in doAppFilter[d]) {
                    result.resources.item.push({ '$': { component: c, drawable: d } });
                    console.log('[' + meta.tag + '] Creating a reference to the ' + d + ' icon (component ' + c + ')');

                    if (blChain.length === 0) return doStoreFile();
                    else return createReference(blChain.pop());
                }

                process.stdin.resume();
                process.stdin.setEncoding('utf8');
                process.stdout.write('There seems to be a new icon named ' + d + '. What is the component name for the app it belongs to? (Just leave this empty if there is no appropriate component.) ');
                process.stdin.once('data', function(data) {
                    process.stdin.pause();
                    if (result.resources.item === undefined)
                        result.resources.item = [];

                    var component = data.toString().trim();
                    if (component === '') {
                        fs.appendFileSync('.noappfilter', '\n' + d);
                        noAppFilter.push(d);
                        console.log('[' + meta.tag + '] Not creating a reference to the ' + d + ' icon');
                        if (blChain.length === 0) return doStoreFile();
                        else return createReference(blChain.pop());
                    }
                    component = component.split('/');
                    if (component.length !== 2) {
                        console.log('[' + meta.tag + '] Skipping a reference to the ' + d + ' icon for now (component name must be in format com.example.package/.Activity)');
                        if (blChain.length === 0) return doStoreFile();
                        else return createReference(blChain.pop());
                    }
                    if (component[1].indexOf('.') === 0) component[1] = component[0] + component[1];
                    component = component.join('/');

                    doAppFilter[d].push(component);
                    result.resources.item.push({ '$': { component: component, drawable: d } });

                    console.log('[' + meta.tag + '] Creating a reference to the ' + d + ' icon');
                    if (blChain.length === 0) return doStoreFile();
                    else return createReference(blChain.pop());
                });
            };

            for (var y in drawables) {
                var d = drawables[y];
                if (doAppFilter[d] === undefined) doAppFilter[d] = [];
                if (blChain.indexOf(d) !== -1) continue;// already expecting modifications
                if (noAppFilter.indexOf(d) !== -1) continue;// should not be modified
                var allComponentsSet = true;
                for (var c in doAppFilter[d]) {
                    var gotComponent = false;
                    for (var z in result.resources.item) {
                        var el = result.resources.item[z];
                        if (el.$.drawable === d && el.$.component === c) gotComponent = true;
                    }
                    if (!gotComponent) allComponentsSet = false;
                }
                if (allComponentsSet && doAppFilter[d].length > 0) continue;// the appfilter files seem to be alright
                blChain.push(d);
            }
            blChain.reverse();
            if (blChain.length === 0) doStoreFile();
            else if (!blRun) {
                blRun = true;
                createReference(blChain.pop());
            } else {
                var checkBlChain = function checkBlChain() {
                    if (blRun) setTimeout(checkBlChain, 1000);
                    else createReference(blChain.pop());
                };
                checkBlChain();
            }
        });
    });
}

// store the data according to the values inside the core object
function setCore() {
    parse(fs.readFileSync(projectfn), function checkProject(err, result) {
        if (err) throw err;
        result.projectDescription.name = core.name;
        fs.writeFileSync(projectfn, (new xml2js.Builder()).buildObject(result));
        console.log('[project file] Finished writing file');
        console.log();
    });

    parse(fs.readFileSync(manifestfn), function checkManifest(err, result) {
        if (err) throw err;
        result.manifest.$.package = core.packageName;
        fs.writeFileSync(manifestfn, (new xml2js.Builder()).buildObject(result));
        console.log('[the manifest] Finished writing file');
        console.log();
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
        console.log();
    });

    parse(fs.readFileSync(cfgfn), function checkCfg(err, result) {
        if (err) throw err;
        result.theme.themeName = core.name;
        result.theme.themeInfo = core.description;
        result.theme.preview = { $: {} };
        for (var y in previews) result.theme.preview.$['img' + (parseInt(y) + 1)] = previews[y];
        fs.writeFileSync(cfgfn, (new xml2js.Builder()).buildObject(result));
        console.log('[themecfg ast] Finished writing file');
        console.log();
    });

    process.stdin.pause();
}

// get the package name from the user
function setPackageName(data) {
    var packageName = consumeCoreInput(data, getSuggestedPackageName());

    if (packageName.match(/^((?!\.\.).)*$/)) {
        process.stdout.write('The package name cannot contain two periods/dots one after another. What do you want to put there instead? ');
        process.stdin.once('data', setPackageName);
        return;
    }

    if (packageName.split('.').length < 2) {
        process.stdout.write('The package name must contain at least two segments (the parts divided by periods/dots). What do you want to put there instead? ');
        process.stdin.once('data', setPackageName);
        return;
    }

    core.packageName = packageName;
    setCore();
}

// get the author/developer link from the user
function setLink(data) {
    core.link = consumeCoreInput(data, getSuggestedLink());
    process.stdout.write('Package Name (identifier in Android system) [' + getSuggestedPackageName() + ']: ');
    process.stdin.once('data', setPackageName);
}

// get the author/developer name from the user
function setAuthorDeveloper(data) {
    core.authorDeveloper = consumeCoreInput(data, getSuggestedDescription());
    process.stdout.write('Author/Developer Link (website) [' + getSuggestedLink() + ']: ');
    process.stdin.once('data', setLink);
}

// get the icon pack's description from the user
function setPackDescription(data) {
    core.description = consumeCoreInput(data, getSuggestedDescription());
    process.stdout.write('Author/Developer Name (name on Google Play Store) [' + getSuggestedAuthorDeveloper() + ']: ');
    process.stdin.once('data', setAuthorDeveloper);
}

// get the icon pack's name from the user
function setPackName(data) {
    core.name = consumeCoreInput(data, getSuggestedName());
    process.stdout.write('Description (e.g. tagline, contact info) [' + getSuggestedDescription() + ']: ');
    process.stdin.once('data', setPackDescription);
}

// start the chain
updateIconReferences();

