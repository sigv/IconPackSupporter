# IconPackSupporter #

__*Your simple template for icon packs*__

You have a bunch of application icon images. You are pretty happy about them and would like to publish in Google Play Store. The big question that remains is _"how"_. This project aims to provide clear instructions for that so that you get something that can be installed and recognized by the launchers as an icon pack.

*Please note that my personal opinion is that icon packs do not need colorful companion apps with links and similar items and I feel the icon pack should be available from the launcher's settings (with contact information inside the Google Play Store listing). If you do not agree with this philosophy, this might not be the project for you.*

## How do I update or migrate my existing project? ##

You should be done in no-time with this. Here is the short checklist for you.

- Grab the stuff listed in _"What do I need?"_ section
- Copy over the files as the _"Step 1: Lets dive in!"_ section describes (just as you would do for a brand new project here) and also copy your existing `appfilter.xml` file to `/res/xml/appfilter.xml`
- Use the bundled automation script (follow _"Step 2a: Quick and easy? Sign me up!"_ section for info) as it will quickly make the icon picker files, ask for whether there are specific component names for the icons that don't have them set yet and ask some small questions about how the pack should appear in the launcher such as pack's name, your name, etc
- Check out the end result (follow steps 3 and 4 for help on running the project on your device or publishing on Google Play, respectively, but I assume you might know this stuff already)
- (optional) Provide feedback on the project

## Which launchers are supported? ##

- [ADW](https://play.google.com/store/apps/details?id=org.adw.launcher)
- [Apex](https://play.google.com/store/apps/details?id=com.anddoes.launcher)
- [GO Launcher](https://play.google.com/store/apps/details?id=com.gau.go.launcherex)
- [Nova](https://play.google.com/store/apps/details?id=com.teslacoilsw.launcher)

## Want to share some feedback or tell that something broke? ##

There is a public ticket/issue system available for you to have your voice heard. You can see what features are planned and what bugs are known. Just open <https://github.com/sigv/IconPackSupporter/issues> and see if someone might already have submitted an issue about what you wanted to say. If someone has, feel free to pop in and comment on that, but if there doesn't seem to be an issue open, don't hesitate and create one yourself.

## What do I need? ##

Before we start with anything, lets be clear on what the requirements are.

- This project downloaded on your computer (use either `git` to clone the project or press the `Download ZIP` on this page)
- Android Developer Tools Bundle, to build the app from the source code (check out [this page](http://developer.android.com/sdk/index.html) about downloading)
- node.js and npm, to run the automated script for quicker and easier setup (check out <http://nodejs.org/download/> for downloads)
- Your personal graphical assets
  + (of course) The application icons you want to include in the pack
  + (optional) The application icon layers to be used for apps that the pack does not include a replacement for
  + Your own icon pack's icon to be used in the different listings (e.g. on Google Play Store, in the launchers)
  + The feature and preview images for use in launchers (the feature image is a banner styled image displayed above your pack's description and the previews are preview images of your icon pack in action)
  + [The various assets for use on Google Play Store](https://support.google.com/googleplay/android-developer/answer/1078870) (you can also read even more about the guidelines for the Google Play Store Featured Image [in this post](http://android-developers.blogspot.com/2011/10/android-market-featured-image.html))

## Got all of them! Now what? ##

There are two paths you can take. The first one is the easier and quicker one. It uses the included setup script which just asks you questions and modifies the files that have to be modified based on your answers. You have to use the terminal (or command prompt, for you Windows people) for it, but everything is explained. Actually, it's pretty much just typing out answers to questions and pressing the enter key. The other option is best for when you want to take a look behind the scenes as you modify the files by hand. For both choices, you will essentially need to copy over the same files and the final instructions for testing and releasing the installable package file are also the same so it's just the middle steps that differ. The end result is expected to be roughly<sup>1</sup> the same for both.

<sup>1</sup>The automation script automatically sorts all the entries by their filenames and removes all the categories.

### Step 1: Lets dive in! ###

You need to copy over the following files to the newly downloaded project:

- `/res/drawable-xxhdpi/theme_icon.png` for your icon pack's icon (used when listed in the installed apps view in system's Settings and inside launchers)
- `/res/drawable-xxhdpi/theme_mainfeature.png` for your feature image (it's the banner styled one)
- `/res/drawable-xxhdpi/theme_previewN.png` for your preview images (the N here means the number of the preview, starting with 1; note that different launchers have different limitations for the preview image count and up to 5 previews will usually be enough)
- one of the `/res/drawable` directories for your icon pack's icons themselves (please note that the icon filenames can only consist of lowercase letters (a-z), numbers (0-9), dots and underscores as per Android restrictions; see the section below explaining how drawables are organized by their sizes to know which is the appropriate directory)
- one of the `/res/drawable` directories for your icon layers (the expected filenames are `iconback1.png` for a background layer, `iconupon1.png` for an overlay layer and `iconmask1.png` for a transparency mask and you can add multiple of each layer by changing the number in the filename; see the section below to learn how the drawables are organized into the appropriate directories)

### Step 2a: Quick and easy? Sign me up! ###

1. Open the project directory in a terminal window and run `npm install git://github.com/Leonidas-from-XIV/node-xml2js.git` to install the latest development version of the xml2js node.js module (it is used to load/modify/store XML files which hold pretty much all of the configuration values)
2. Run `./setup.js` and answer to the questions that pop up (on the first run you should also choose to change the core configuration)
3. Open Eclipse (it comes with the Android Developer Tools Bundle) and import this project into your workspace (open `File > Import...`, then find and choose `Existing Android Code Into Workspace` and as the Root directory pick the place where you downloaded this project to)
4. Continue with building and exporting the project as per the instructions below (if you ever want to modify anything like adding new icons, do the changes to the files, run `./setup.js` again and re-export; see the section below with extensive usage info)

### Step 2b: No, I want to do everything by hand! ###

1. Open Eclipse (it comes with the Android Developer Tools Bundle) and import this project into your workspace (open `File > Import...`, then find and choose `Existing Android Code Into Workspace` and as the Root directory pick the place where you downloaded this project to)
2. You can rename the project in the sidebar by right-clicking it and choosing `Refactor > Rename...` (this is useful to differentiate icon packs in case you are working on multiple)
3. You must rename the package name by right-clicking the project and using `Android Tools > Rename Application Package` (this is what identifies each installed app in the Android system and you cannot change it after publishing the app unless you are interested in releasing it as a brand new app; a suggested package naming scheme is com.name.packname, for example com.johndoe.awesomeiconpack)
4. You can modify the version information in the `AndroidManifest.xml` file (the version code is a number used by the system that must increase with each release and the version name is a text displayed to the user that can consist of anything; [read more in-depth about versioning](http://developer.android.com/tools/publishing/versioning.html))
5. Open `/res/values/base.xml` and `/res/xml/themecfg.xml` and change the values there to represent the ones you want (there are comments about each of them right next to them)
6. Now comes the part of actually declaring the images and there are multiple files to be modified
   - `/res/values/iconpack.xml` is used by icons pickers in ADW and Apex. Example icon declaration: the icon with the filename `play_store.png` will be added as `<item>play_store</item>` (notice the missing .png extension)
   - `/res/xml/drawable.xml` is used by the icon picker in Nova. Example icon declaration: the icon with the filename `play_store.png` will be added as `<item drawable="play_store"/>` (inside quotes instead). Nova also supports category separators which can be added by adding `<category title="Title" />` at the place you want the title at.
   - `/res/xml/appfilter.xml` is used by the launchers to provide automatic theming of the app icons. Include your icon layers here following the comments in the file. You need to know the application's component name (package name and activity name). Example icon declaration: `<item component="ComponentInfo{com.android.vending/com.android.vending.AssetBrowserActivity}" drawable="play_store"/>`. You can read a bit more about the application filters in the section below.

### Step 3: Cool, but how can I get it on my device? ###

This section deals with making a debug version which is intended for debugging/testing (not a public release). This is a quick way to see how the project looks on a device. If you do not want to do that, feel free to skip to the next step.

1. Connect up your device to the computer using a USB cable
2. Open up Eclipse and run the project as an Android Application (right-click the `AndroidManifest.xml` file in the sidebar and choose `Run... > Android Application`)
3. (if asked) Choose your device from the list that appears
4. Check out the icon pack in the launcher of your choice
5. Tweak everything you are not satisfied with (and repeat the steps to see how the changes look) or continue with publishing the pack if you feel ready

### Step 4: I want to publish! ###

This section deals with making a release version which is intended for a public release.

1. Okay, open up Eclipse (if it isn't already open) and open `File > Export > Android > Export Android Application`
2. Choose the project you want to export from the list
3. Follow the on-screen instructions (creating a keystore and a private key if necessary; keep those in a private and safe place as you must use these to sign the updates for the pack so that nobody other than you can release an update for it meaning that if you lose them you won't be able to release updates)
4. After finishing the wizard check for the created release-ready .apk file (application package file)
5. (optional) Install the .apk file on your personal device and check how this version of the pack looks in the launcher(s) before releasing to the public
6. Publish it on Google Play Store if you are satisfied with it (this can be done through the [Developer Console](https://play.google.com/apps/publish/); for a quick overview of the different areas there, you can read [this page](http://developer.android.com/distribute/googleplay/publish/console.html))

## How are these drawables organized by sizes? ##

In Android, the drawables (image resources) are sorted in different drawable directories based on the target screen density. These are used so that the images the user sees are the same physical size across different devices. If the app provides high-density (hdpi) drawables and the device is hdpi, then those are used. If the app does not provide hdpi drawables, the next best size is chosen and resized. This means that on devices with lower density everything will almost always be fine, but on devices with higher density the images might look pixelated because they have been forced to get sized up.

### What does that mean for me? ###

The app launcher icons are expected to be 48dp squares. 48dp means it is 48px in mdpi and scaled differently in other densities based on that. You can choose to either provide icons in one size (you should choose a large enough size for this so that the icons look sharp on all screens; xxhdpi is suggeted) or you can choose to include multiple sizes. Both should have a very similar end result as down-sized icons usually look good enough, hence I suggest just including one size.

#### So, what exactly are the different launcher icon sizes? ####

- 48 x 48 icons (mdpi) inside directory `/res/drawable-mdpi`
- 72 x 72 icons (hdpi) inside directory `/res/drawable-hdpi`
- 96 x 96 icons (xhdpi) inside directory `/res/drawable-xhdpi`
- 144 x 144 icons (xxhdpi) inside directory `/res/drawable-xxhdpi`
- 192 x 192 icons (xxxhdpi) inside directory `/res/drawable-xxxhdpi`

## What are these application filters? ##

Application icons are automatically applied by launchers if the component name of the icon matches a filter. These component names consist of two parts - the package name and the activity name. In some instances, the activity name is shortened, in which case it will start with a dot meaning that before the dot comes the package name. (For example, when adding a rule for the default clock app you have to use the component name `com.android.deskclock/com.android.deskclock.DeskClock` but in some instances it might be shown as `com.android.deskclock/.DeskClock` instead.) For each app filter rule you must provide a drawable too. This works just like in the other files - it is the name of the icon's image file in one of the drawable directories with no extension (no .png/.jpg/etc) added. You can reuse the same drawable for multiple app filter rules/components. (For example, say if you have a single generic "books.png" icon file and want to automatically theme multiple reading apps automatically, all you need to do is add a rule for each of the components with the drawable name set as `books`.)

### How can I find out these component names? ###

In Nova Launcher you can quickly export the icons and component names of all the installed apps. To do so, open Nova Settings and long-press the Volume Down button to unlock Labs (extra settings for the launcher). Then you can use `Labs > Debug > Export Icons`. The resulting .zip file (located at `/sdcard/novaIconExport.zip`) consists of a complete `/res/xml/appfilter.xml` file and the best resolution launcher icons each app provides (placed in the appropriate drawable directory). You can use this to see all the component names for your current installed apps (or maybe to have the app icons as a base to work on).

You can also use Nova to see individual component names. You need to open the forementioned Labs section and then check the `Debug > Show Component in Edit dialog` checkbox. Then you have to drag an icon (either directly from the app drawer of from one of the homescreens) to the Edit option at top. At the bottom of the dialog that appears, you will see the component name.

If you are providing a request form (you should; those are a good way to see what app icons the users what to have themed), you can include a field in which the user can include the component name, if they know how to get it. It can be a time-saver as you don't have to go looking online or download the app just to see the component name.

Props to Nova Launcher for providing good documentation and the helpful features. If you know other launchers support some of the forementioned features, let me know.

### Anything more about about the components? ###

Sometimes different phone manufacturers and sometimes even different ROMs use different component names for the core apps (e.g. the dialer/phone app). This can get annoying as the component name might change from one Android version to another on the same phone which means some apps might not longer get themed automatically after an update.

Nova provides an easy method to automatically apply the icons to the correct components for system apps. Instead of using the full component name (e.g. writing `ComponentInfo{com.android.deskclock/com.android.deskclock.DeskClock}`) you have to use the provided keyword (e.g. `:CLOCK`). While these only work on Nova Launcher (other launchers just ignore them) and they can also sometimes be out-of-date if something new has just appeared, they still allow many users of Nova to have their core icons automatically themed. Please note that these only apply to the system apps and not apps installed from the Play Store or any other source.

#### So, which keywords are provided? ####

- `:BROWSER`
- `:CALCULATOR`
- `:CALENDAR`
- `:CAMERA`
- `:CLOCK`
- `:CONTACTS`
- `:EMAIL`
- `:GALLERY`
- `:PHONE`
- `:SMS`
- `:LAUNCHER_ACTION_APP_DRAWER` (the app drawer icon in Nova)

## Notes about the automation script ##

Usage: `./setup.js [filename...]`

The automation script automatically sorts all the icon picker icon declarations (based on filename) and application filter rules (based on filename or component name if the filenames are matching). The script also removes all category entries from the icon pickers due to sorting.

The filenames supplied affect the application filter rules set. If there are rules set for the filenames provided, they are removed and the user is asked for the new component names. The previous ones are displayed to the side.

