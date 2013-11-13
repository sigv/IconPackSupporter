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

        if (result.resources.item !== undefined)
            result.resources.item.sort(function(a, b) { return a.toString().localeCompare(b.toString()); });

        fs.writeFileSync(iconpackfn, (new xml2js.Builder()).buildObject(result));
        console.log('[iconpack res] Finished writing file');

        if (++filesUpdated === 5) startChain();
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

        if (result.resources.item !== undefined)
            result.resources.item.sort(function(a, b) { return a.$.drawable.toString().localeCompare(b.$.drawable.toString()); });

        fs.writeFileSync(drawablefn, (new xml2js.Builder()).buildObject(result));
        console.log('[drawable res] Finished writing file');

        if (++filesUpdated === 5) startChain();
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

        if (result.resources.item !== undefined)
            result.resources.item.sort(function(a, b) { return a.$.drawable.toString().localeCompare(b.$.drawable.toString()); });

        fs.writeFileSync(drawablegfn, (new xml2js.Builder()).buildObject(result));
        console.log('[drawable ast] Finished writing file');

        if (++filesUpdated === 5) startChain();
    });

    var missingAppFilters = {}, blRun = false;

    parse(fs.readFileSync(appfilterfn), function checkAppfilter(err, result) {
        if (err) throw err;
        var setDrawables = [], blChain = [];
        for (var i in result.resources.item) {
            var d = result.resources.item[i];
            if (drawables.indexOf(d) === -1) {
                console.log('[appfiltr res] Removing a reference to the ' + d + ' icon');
                delete result.resources.item[i];
            } else if (setDrawables.indexOf(d) === -1) setDrawables.push(d);
        }

        var doStoreFile = function doStoreFile() {
            if (result.resources.item !== undefined)
                result.resources.item.sort(function(a, b) {
                    var dsort = a.$.drawable.toString().localeCompare(b.$.drawable.toString());
                    return dsort === 0 ? a.$.component.toString().localeCompare(b.$.component.toString()) : dsort;
                });

            fs.writeFileSync(appfilterfn, (new xml2js.Builder()).buildObject(result));
            console.log('[appfiltr res] Finished writing file');

            blRun = false;
            if (++filesUpdated === 5) startChain();
        };

        var createReference = function createReference(d) {
            if (missingAppFilters[d] !== undefined) {
                result.resources.item.push({ '$': { component: missingAppFilters[d], drawable: d } });
                console.log('[appfiltr res] Creating a reference to the ' + d + ' icon');

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
                    console.log('[appfiltr res] Not creating a reference to the ' + d + ' icon');
                    if (blChain.length === 0) return doStoreFile();
                    else return createReference(blChain.pop());
                }
                component = component.split('/');
                if (component.length !== 2) {
                    console.log('[appfiltr res] Skipping a reference to the ' + d + ' icon for now (component name must be in format com.example.package/.Activity)');
                    if (blChain.length === 0) return doStoreFile();
                    else return createReference(blChain.pop());
                }
                if (component[1].indexOf('.') === 0) component[1] = component[0] + component[1];
                component = component.join('/');

                missingAppFilters[d] = component;
                result.resources.item.push({ '$': { component: component, drawable: d } });

                console.log('[appfiltr res] Creating a reference to the ' + d + ' icon');
                if (blChain.length === 0) return doStoreFile();
                else return createReference(blChain.pop());
            });
        };

        for (var y in drawables) {
            var d = drawables[y];
            if (setDrawables.indexOf(d) !== -1 || noAppFilter.indexOf(d) !== -1 || blChain.indexOf(d) !== -1) continue;
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

    parse(fs.readFileSync(appfiltergfn), function checkAppfilterG(err, result) {
        if (err) throw err;
        var setDrawables = [], blChain = [];
        for (var i in result.resources.item) {
            var d = result.resources.item[i];
            if (drawables.indexOf(d) === -1) {
                console.log('[appfiltr ast] Removing a reference to the ' + d + ' icon');
                delete result.resources.item[i];
            } else if (setDrawables.indexOf(d) === -1) setDrawables.push(d);
        }

        var doStoreFile = function doStoreFile() {
            if (result.resources.item !== undefined)
                result.resources.item.sort(function(a, b) {
                    var dsort = a.$.drawable.toString().localeCompare(b.$.drawable.toString());
                    return dsort === 0 ? a.$.component.toString().localeCompare(b.$.component.toString()) : dsort;
                });

            fs.writeFileSync(appfiltergfn, (new xml2js.Builder()).buildObject(result));
            console.log('[appfiltr ast] Finished writing file');

            blRun = false;
            if (++filesUpdated === 5) startChain();
        };

        var leftRefCounter = 0;
        var createReference = function createReference(d) {
            if (missingAppFilters[d] !== undefined) {
                result.resources.item.push({ '$': { component: missingAppFilters[d], drawable: d } });
                console.log('[appfiltr ast] Creating a reference to the ' + d + ' icon');

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
                    console.log('[appfiltr ast] Not creating a reference to the ' + d + ' icon');
                    if (blChain.length === 0) return doStoreFile();
                    else return createReference(blChain.pop());
                }
                component = component.split('/');
                if (component.length !== 2) {
                    console.log('[appfiltr res] Skipping a reference to the ' + d + ' icon for now (component name must be in format com.example.package/.Activity)');
                    if (blChain.length === 0) return doStoreFile();
                    else return createReference(blChain.pop());
                }
                if (component[1].indexOf('.') === 0) component[1] = component[0] + component[1];
                component = component.join('/');

                missingAppFilters[d] = component;
                result.resources.item.push({ '$': { component: component, drawable: d } });

                console.log('[appfiltr ast] Creating a reference to the ' + d + ' icon');
                if (blChain.length === 0) return doStoreFile();
                else return createReference(blChain.pop());
            });
        };

        for (var y in drawables) {
            var d = drawables[y];
            if (setDrawables.indexOf(d) !== -1 || noAppFilter.indexOf(d) !== -1 || blChain.indexOf(d) !== -1) continue;
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
    core.link = data.toString().trim();

    var admod = core.authorDeveloper.toLowerCase().split(' ').join('');
    var nmod = core.name.toLowerCase().split(' ').join('');
    var suggestedPackageName = 'com.' + (admod === nmod ? admod : admod + '.' + nmod);
    while (suggestedPackageName.indexOf('..') !== -1) suggestedPackageName.split('..').join('.');
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

