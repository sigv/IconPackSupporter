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
var srcactfn = './src/org/signalv/iconpack/MActivity.java';

// pretty self-explanatory variables
var core = { name: '', description: '', authorDeveloper: '', link: '', packageName: '', versionCode: '', versionName: '' };
var filesUpdated = 0;
var drawables = [];
var previews = [];

// sets the drawables that should be reset
var resettables = {};
var args = process.argv;
args.shift();
args.shift();
for (var i in args) if (resettables[args[i]] === undefined) resettables[args[i]] = [];

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
                if (drawable === 'theme_icon' || drawable === 'theme_mainfeature') continue;
                if (drawable.indexOf('theme_preview') === 0) {
                    if (previews.indexOf(drawable) === -1) previews.push(drawable);
                } else if (drawables.indexOf(drawable) === -1) drawables.push(drawable);
            }
        }
    }
}

for (var d in resettables) {
    if (drawables.indexOf(d) === -1) {
        console.log('icon ' + d + ' does not seem to exist; ignoring');
        delete resettables[d];
    }
}
console.log();

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
    parse(fs.readFileSync(manifestfn), function checkManifest(err, result) {
        if (err) throw err;
        core.versionCode = result.manifest.$['android:versionCode'];
        core.versionName = result.manifest.$['android:versionName'];
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        console.log();
        process.stdout.write('Version Code (version number used by the system) [currently ' + core.versionCode + ']: ');
        process.stdin.once('data', setVersionCode);
    });
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
                var c = result.resources.item[i].$.component, d = result.resources.item[i].$.drawable;
                if (drawables.indexOf(d) === -1) {
                    delete result.resources.item[i];
                } else if (resettables[d] !== undefined) {
                    if (resettables[d].indexOf(c) === -1) resettables[d].push(c);
                    delete result.resources.item[i];
                } else {
                    if (doAppFilter[d] === undefined) doAppFilter[d] = [];
                    if (doAppFilter[d].indexOf(c) === -1) doAppFilter[d].push(c);
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
                    var ex = false;
                    for (var y in result.resources.item) {
                        if (result.resources.item[y].$.component === c) {
                            ex = true;
                            if (result.resources.item[y].$.drawable !== d) {
                                console.log('[' + meta.tag + '] Skipping the ' + c + ' component (for the ' + d + ' icon; already added for the ' + result.resources.item[y].drawable + ' icon)');
                            }
                        }
                    }

                    if (!ex) {
                        result.resources.item.push({ '$': { component: c, drawable: d } });
                        console.log('[' + meta.tag + '] Adding the ' + c + ' component (for the ' + d + ' icon)');
                    }
                }
                if (doAppFilter[d].length > 0) {
                    if (blChain.length === 0) return doStoreFile();
                    else return createReference(blChain.pop());
                }

                process.stdin.resume();
                process.stdin.setEncoding('utf8');
                process.stdout.write('Component name for ' + d + ' icon' + (resettables[d] === undefined || resettables[d].length === 0 ? '' : ' (previously ' + resettables[d].join(' ') + ')') + ': ');
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
                                console.log('[' + meta.tag + '] Skipping the ' + c + ' component (incorrect component format)');
                            } else {
                                if (c.length === 2) if (c[1].charAt(0) === '.') c[1] = c[0] + c[1];
                                c = c.join('/');
                                if (c.charAt(0) === ':') c = c.toUpperCase();
                                else if (c.indexOf('ComponentInfo{') !== 0) c = 'ComponentInfo{' + c + '}';

                                var ex = false;
                                for (var y in result.resources.item) {
                                    if (result.resources.item[y].$.component === c) {
                                        ex = true;
                                        console.log('[' + meta.tag + '] Skipping the ' + c + ' component (for the ' + d + ' icon; already added for the ' + (result.resources.item[y].$.drawable === d ? 'exact same' : result.resources.item[y].drawable) + ' icon)');
                                    }
                                }

                                if (!ex) {
                                    if (doAppFilter[d] === undefined) doAppFilter[d] = [];
                                    if (doAppFilter[d].indexOf(c) === -1) doAppFilter[d].push(c);

                                    if (result.resources.item === undefined) result.resources.item = [];
                                    result.resources.item.push({ '$': { component: c, drawable: d } });
                                    console.log('[' + meta.tag + '] Adding the ' + c + ' component (for the ' + d + ' icon)');
                                }
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
    fs.writeFileSync(srcactfn, fs.readFileSync(srcactfn).toString().replace(/import .*\.R;/, 'import ' + core.packageName + '.R;'));
    console.log('[activity src] Finished writing file');

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
    console.log();
    if (data.toString().toLowerCase().charAt(0) === 'y') {
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

function setVersionName(data) {
    core.versionName = consumeCoreInput(data, '.');
    if (core.versionName === '') console.log('The version name is not being set.');
    parse(fs.readFileSync(manifestfn), function checkManifest(err, result) {
        if (err) throw err;
        if (core.versionCode !== '') result.manifest.$['android:versionCode'] = core.versionCode;
        if (core.versionName !== '') result.manifest.$['android:versionName'] = core.versionName;
        fs.writeFileSync(manifestfn, (new xml2js.Builder()).buildObject(result));
        console.log('[the manifest] Finished writing file');
        console.log();
        process.stdout.write('Do you want to change the core configuration [y/N]? ');
        process.stdin.once('data', setModCore);
    });
}

function setVersionCode(data) {
    core.versionCode = consumeCoreInput(data, '.');
    if (core.versionCode === '') console.log('The version code is not being set.');
    process.stdout.write('Version Name (version info displayed to the user) [currently ' + core.versionName + ']: ');
    process.stdin.once('data', setVersionName);
}

// start the chain
updateIconReferences();

