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

// cleans up the existing noappfilter file
for (var i in noAppFilter) if (drawables.indexOf(noAppFilter[i]) === -1) delete noAppFilter[i];
noAppFilter = noAppFilter.sort();
fs.writeFileSync('.noappfilter', noAppFilter.join('\n') + '\n');

// getters for the default values
function getSuggestedName() { return 'Awesome Icon Pack'; }
function getSuggestedDescription() { return 'Theme description.\\n\\nContact me at support@example.com'; }
function getSuggestedAuthorDeveloper() { return 'John Doe'; }
function getSuggestedLink() { return 'http://www.example.com/'; }
function getSuggestedPackageName() {
    var dev = core.authorDeveloper.toLowerCase().replace(/(\.| )/g, ''), name = core.name.toLowerCase().replace(/(\.| )/g, '');
    return 'com.' + (dev === name ? dev : dev + '.' + name);
}

// takes the user input to get the value that should be used
function consumeCoreInput(userInput, suggestedValue) {
    userInput = userInput.toString().trim();
    if (userInput === '') return consumeCoreInput(suggestedValue, '.');
    if (userInput === '.') return '';
    return userInput.replace(/\\n/g, '\n');
}

// start the question chain
function startChain() {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdout.write('Do you want to change the core configuration [y/N]? ');
    process.stdin.once('data', setModCore);
}

// set the icon resource files (add and remove the appropriate declarations)
function updateIconReferences() {
    parse(fs.readFileSync(iconpackfn), function checkIconpack(err, result) {
        if (err) throw err;
        var setDrawables = [];
        for (var i in result.resources['string-array'][0].item) {
            var d = result.resources['string-array'][0].item[i];
            if (drawables.indexOf(d) === -1) {
                console.log('[iconpack res] Removing the ' + d + ' icon (file does not exist)');
                delete result.resources['string-array'][0].item[i];
            } else if (setDrawables.indexOf(d) === -1) setDrawables.push(d);
        }

        for (var y in drawables) {
            var d = drawables[y];
            if (setDrawables.indexOf(d) !== -1) continue;
            if (result.resources['string-array'][0].item === undefined)
                result.resources['string-array'][0].item = [];
            result.resources['string-array'][0].item.push(d);
            console.log('[iconpack res] Adding the ' + d + ' icon');
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
                    console.log('[' + meta.tag + '] Removing the ' + d + ' icon (file does not exist)');
                    delete result.resources.item[i];
                } else if (setDrawables.indexOf(d) === -1) setDrawables.push(d);
            }

            for (var y in drawables) {
                var d = drawables[y];
                if (setDrawables.indexOf(d) !== -1) continue;
                if (result.resources.item === undefined)
                    result.resources.item = [];
                result.resources.item.push({ $: { drawable: d } });
                console.log('[' + meta.tag + '] Adding the ' + d + ' icon');
            }

            if (result.resources.item !== undefined)
                result.resources.item.sort(function(a, b) { return a.$.drawable.toString().localeCompare(b.$.drawable.toString()); });

            fs.writeFileSync(meta.filename, (new xml2js.Builder()).buildObject(result));
            console.log('[' + meta.tag + '] Finished writing file');
            console.log();

            if (++filesUpdated === 5) startChain();
        });
    });

    console.log();
    console.log('The component names can be either Nova keywords or full component\n' +
                'names consisting of the package name and the activity name. Check\n' +
                'the attached README for more information about them. You can also\n' +
                'add multiple components to the same icon by seperating them using\n' +
                'the space character.');
    console.log('------');
    console.log();
    var blRun = false;

    [{ filename: appfilterfn, tag: 'appfiltr res' }, { filename: appfiltergfn, tag: 'appfiltr ast' }].forEach(function (meta) {
        parse(fs.readFileSync(meta.filename), function checkAppfilter(err, result) {
            if (err) throw err;
            var blChain = [];
            for (var i in result.resources.item) {
                var d = result.resources.item[i].$.drawable;
                if (drawables.indexOf(d) === -1) {
                    console.log('[' + meta.tag + '] Removing the ' + d + ' icon (file does not exist)');
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
                if (noAppFilter.indexOf(d) !== -1) {
                    if (blChain.length === 0) return doStoreFile();
                    else return createReference(blChain.pop());
                }

                if (doAppFilter[d] === undefined) doAppFilter[d] = [];
                for (var i in doAppFilter[d]) {
                    var c = doAppFilter[d][i];
                    if (result.resources.item === undefined) result.resources.item = [];
                    result.resources.item.push({ '$': { component: c.charAt(0) === ':' ? c : 'ComponentInfo{' + c + '}', drawable: d } });
                    console.log('[' + meta.tag + '] Adding the ' + c + ' component (for the ' + d + ' icon)');

                    if (blChain.length === 0) return doStoreFile();
                    else return createReference(blChain.pop());
                }

                process.stdin.resume();
                process.stdin.setEncoding('utf8');
                process.stdout.write('Component name for ' + d + ' icon: ');
                process.stdin.once('data', function(data) {
                    process.stdin.pause();
                    if (result.resources.item === undefined)
                        result.resources.item = [];

                    var components = data.toString().trim().split(' ').filter(function(element) { return element.trim().length > 0; });
                    for (var i in components) components[i] = components[i].trim();
                    if (components.length === 0) {
                        console.log('[' + meta.tag + '] Skipping the ' + d + ' icon');
                    } else if (components.length === 1 && components[0] === '.') {
                        noAppFilter.push(d);
                        fs.appendFileSync('.noappfilter', d + '\n');
                        console.log('[' + meta.tag + '] Ignoring the ' + d + ' icon');
                    } else {
                        for (var i in components) {
                            var c = components[i].split('/');
                            if (c[0].charAt(0) !== ':' && c.length !== 2) {
                                console.log('[' + meta.tag + '] Skipping the ' + c + ' component (incorrect format)');
                            } else {
                                if (c.length === 2) if (c[1].charAt(0) === '.') c[1] = c[0] + c[1];
                                c = c.join('/');
                                if (doAppFilter[d] === undefined) doAppFilter[d] = [];
                                doAppFilter[d].push(c);
                                if (result.resources.item === undefined) result.resources.item = [];
                                result.resources.item.push({ '$': { component: c.charAt(0) === ':' ? c : 'ComponentInfo{' + c + '}', drawable: d } });
                                console.log('[' + meta.tag + '] Adding the ' + c + ' component (for the ' + d + ' icon)');
                            }
                        }
                    }

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
    core.packageName = consumeCoreInput(data, getSuggestedPackageName());
    if (core.packageName === '') console.log('You will encounter a failure; the package name may not be empty.');
    if (!!core.packageName.match(/\.\./)) console.log('You will encounter a failure; the package name may not have 2 periods right next to each other.');
    if (core.packageName.split('.').length < 2) console.log('You will encounter a failure; the package name must contain at least 2 segments (the parts divided by periods).');
    console.log();
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
    core.authorDeveloper = consumeCoreInput(data, getSuggestedAuthorDeveloper());
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
    if (core.name === '') console.log('You will encounter a failure; the name of the pack may not be empty.');
    process.stdout.write('Description (e.g. tagline, contact info) [' + getSuggestedDescription() + ']: ');
    process.stdin.once('data', setPackDescription);
}

// get whether the user wants to change the core values
function setModCore(data) {
    if (data.toString().toLowerCase().charAt(0) === 'y') {
        console.log();
        console.log('The following information will be used inside your project. The\n' +
                    'following fields have defaults (shown inside brackets) that are\n' +
                    'used when nothing is provided. If you enter ".", the field will\n' +
                    'be left empty.');
        console.log('------');
        console.log();
        process.stdout.write('Name (title of icon pack) [' + getSuggestedName() + ']: ');
        process.stdin.once('data', setPackName);
    } else {
        process.stdin.pause();
        console.log('Leaving the core configuration as-is.');
        console.log();
    }
}

// start the chain
updateIconReferences();

