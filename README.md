# Icon Pack Supporter #

*Your simple template for icon packs*

You have a bunch of application icon images. You are pretty happy about them and would like to publish in Google Play Store. The big question that remains is _"how"_. This project does not aim to make an app you can open in the traditional sense. Instead it aims to provide an as easy as possible method to package the images so that the launchers are aware of them as an icon pack.

## What launchers are supported? ##

- ADW (no icon picker)
- Apex
- GO Launcher
- Nova

## Have some feedback? Something broke? Anything you want to say? ##

There is a public ticket/issue system available for you to voice whatever you feel. You can see what features are planned and what bugs are known. Just open <https://github.com/sigv/IconPackSupporter/issues> and see if someone might already have submitted an issue about what you wanted to say. If someone has, feel free to pop in and comment on that, but if there doesn't seem to be an issue open, don't hesitate and create one yourself.

## What do I need? ##

Before we start with anything, lets be clear on what the requirements are.

- This project downloaded on your computer (use either `git` to clone this project or you can press the `Download ZIP` on this page)
- Android Developer Tools, to build the app from the source code (check out [this page](http://developer.android.com/sdk/index.html) about downloading)
- node.js and npm, needed if you want to use the quicker and easier setup method (check out <http://nodejs.org/download/> for... you know, downloads for it)
- Your personal graphical assets
  + Of course, the application icons you want to include in the pack
  + Your own icon pack's icon you want to use in the different listings (e.g. on Google Play Store, in the launchers)
  + The feature and preview images for use in launchers (the feature image is a banner styled image displayed above your pack's description and the previews are, well, preview images of your icon pack in action)
  + [The various assets for use on Google Play Store](https://support.google.com/googleplay/android-developer/answer/1078870) (you can also read even more about the guidelines for the Featured-Image [in this post](http://android-developers.blogspot.com/2011/10/android-market-featured-image.html))

## Got it! What now? ##

There are two paths you can take. The first one is the easier and quicker one. It utilizes a bundled setup script which just asks you questions and modifies the files that have to be modified. You have to use the terminal (or command prompt for you Windows people) for it, but all is explained, if you haven't really done anything in it before. The other option is best for when you want to take a look behind the scenes. For both of them, you will need to copy over the same files and the final instructions for releasing the installable package file are also the same so it's just the middle steps that differ. The end result should essentially be the same for both.

### Step 1: Lets start then! ###

You need to copy over the following files to the newly downloaded project:

- `/res/drawable-xxhdpi/theme_icon.png` for your icon pack's icon (used when listed in the installed app view in system's Settings and inside launchers)
- `/res/drawable-xxhdpi/theme_mainfeature.png` for your feature image (it's the banner styled one)
- `/res/drawable-xxhdpi/theme_previewN.png` for your preview images (the N here means the number of the preview starting with 1; note that different launchers have different limitations for the preview image count and up to 5 previews will usually be enough)
- one of the `/res/drawable` directories for your icons for the pack itself (see the section below which explains how drawables are organized by their sizes below to know which is the appropriate directory)

### Step 2a: Quick and easy? Sign me up! ###

1. Open the project directory in a terminal window and run `npm install git://github.com/Leonidas-from-XIV/node-xml2js.git` to install the latest development version of the xml2js node.js module which is used to load/modify/store XML files (which are used for pretty much all the configuration values)
2. Run `./setup.js` and answer to the questions that pop up (on the first run you should also choose to change the core configuration)
3. Open Eclipse (it comes with the Android Developer Tools) and import this project into your workspace (open `File > Import...` and then find and choose `Existing Android Code Into Workspace` and as the Root directory, pick the place where you downloaded this project to)
4. Continue with building and exporting the project as per the instructions below (if you even want to modify anything like adding new icons, just run `./setup.js` again and re-export the installable package file)

### Step 2b: I want to do everything by hand! ###

1. Open Eclipse (it comes with the Android Developer Tools) and import this project into your workspace (open `File > Import...` and then find and choose `Existing Android Code Into Workspace` and as the Root directory, pick the place where you downloaded this project to)
2. You can rename the project in the sidebar by right-clicking the project and choosing `Refactor > Rename...` (this is useful to differentiate icon packs in case you are working on multiple)
3. You must rename the package name by right-clicking the project and using `Android Tools > Rename Application Package` (this is what identifies each installed app in the Android system and you can't change it after publishing the app unless you are interested in releasing it as a brand new app; a suggested package naming scheme is com.name.packname or for example com.johndoe.glowicons)
4. You can modify the version information in the `AndroidManifest.xml` file (the version number is a number used by the system that must increase with each release and the version name displayed to the user that can consist of anything; [read more in-depth about versioning](http://developer.android.com/tools/publishing/versioning.html))
5. Open `/res/values/base.xml` and `/assets/themecfg.xml` and change the values there to represent the ones you want (there are comments about each of them right next to them)
6. Now comes the part of actually declaring the images and there are multiple files to be modified
   - `/res/values/iconpack.xml` is used by icons pickers in ADW and Apex. Example icon declaration: the icon with the filename `play_store.png` will be added as `<item>play_store</item>` (notice the missing .png extension)
   - `/res/xml/drawable.xml` is used by the icon picker in Nova. Example icon declaration: the icon with the filename `play_store.png` will be added as `<item drawable="play_store"/>` (inside quotes instead). Nova also supports category separators which can be added by adding `<category title="Title" />` at the place you want the title at.
   - `/res/xml/appfilter.xml` is used by the launchers to provide automatic theming of the app icons. You need to know the application's component name (package name and activity name). Example icon declaration: `<item component="ComponentInfo{com.android.vending/com.android.vending.AssetBrowserActivity}" drawable="play_store"/>`. You can read about this format in the section about application filters below.
7. GO Launcher uses the files inside `/assets` instead so you need to replace them with your newly made resource files (just copy `/res/xml/appfilter.xml` over to `/assets/appfilter.xml` and copy `/res/xml/drawable.xml` over to `/assets/drawable.xml`)

### Step 3: Lets build this thing! ###

1. Connect up your device to the computer using a USB cable
2. Open up Eclipse and run the project as an Android Application (right-click the `AndroidManifest.xml` file in the sidebar and choose `Run... > Android Application`)
3. Choose your device from the list that pops up (if required)
4. Check out the icon pack in the launcher of your choice
5. Either tweak the things you are not satisfied with or continue with publishing the pack

### Step 4: Now, what about publishing in Google Play Store? ###

1. Open up Eclipse (if not already open) and open `File > Export > Android > Export Android Application`
2. Choose the project you want to export from the list
3. Follow the on-screen instructions (creating a keystore and a private key if necessary; keep those in a private and safe place as you must use these to sign the updates for the pack so that nobody other than you can publish an update for it meaning that if you lose them you won't be able to push updates)
4. After finishing the wizard check for the created .apk file (application package file) ready for release
5. (optional) Install the .apk file on your personal device and check out how the pack looks in the launcher(s)
6. Publish it on Google Play Store if you are satisfied with it (this can be done through the Developer Console; for a quick overview of the different areas there, you can read [this page](http://developer.android.com/distribute/googleplay/publish/console.html))

## Drawable sizes in Android ##

In Android, the drawables (image resources) are sorted in different drawable directories based on the target screen density. These are used so that the images the user sees are the same physical size across different devices. If the app provides high-density (hdpi) drawables and the device is hdpi, then those are used. If the app does not provide hdpi drawables, the next best size is chosen and resized. This means that on devices with lower density, all will be fine, but on devices with higher density, the images might look pixelated because they have been sized up.

### What does that mean for me? ###

The app launcher icons are expected to be 48dp squares. You can choose to either provide icons in one size (you should choose a large enough size for this so that the icons look sharp on all screens; xxhdpi is suggeted) or you can choose to include multiple sizes. Both should have a very similar end result as down-sized icons usually look good, hence I suggest just using including one size.

#### So, what are the different launcher icon sizes? ####

- 48 x 48 icons are mdpi; directory `/res/drawable-mdpi`
- 72 x 72 icons are hdpi; directory `/res/drawable-hdpi`
- 96 x 96 icons are xhdpi; directory `/res/drawable-xhdpi`
- 144 x 144 icons are xxhdpi; directory `/res/drawable-xxhdpi`
- 192 x 192 icons are xxxhdpi; directory `/res/drawable-xxxhdpi`

## Application filters ##

App icons are automatically applied if there is an app's activity which matches the provided component name filters. These component names consist of two parts - the package name and the activity name. In some instances, the activity name is shortened, in which case it will start with a period/dot and that means that before the dot comes the package name. (For example, the default clock app has the component name `com.android.deskclock/.DeskClock` so when you write the component name in the app filter file, you have to use `com.android.deskclock/com.android.deskclock.DeskClock`.) Then for each component (app) you provide a drawable. This name works just like in the other files - it is the name of an image file in one of the drawable directories with no extension (no .png/.jpg) added. You can reuse the same drawable for multiple icons. (For example, if you have a single "books.png" icon file, but you want to theme multiple reading apps automatically, you just provide them both the drawable name `books`.)

### So, how do I find out these component names? ###

In Nova Launcher you can quickly export the icons. To do so, open Nova Settings and long-press the Volume Down button to unlock Labs (extra settings for the launcher). Then you can use `Labs > Debug > Export Icons`. The resulting .zip file (located at `/sdcard/novaIconExport.zip`) consists of a complete `/res/xml/appfilter.xml` file and the best resolution launcher icons each app provides (placed in the appropriate drawable directory). You can use this to see all the component names for your current installed apps.

You can also use Nova to see individual component names. You need to open the forementioned Labs section and then check `Debug > Show Component in Edit dialog`. Then you have to drag an icon (either directly from the app drawer of from one of the homescreens) to the Edit option. At the bottom of the dialog that appears, you will see the component name.

Props to Nova Launcher for providing good documentation and the helpful features other launchers don't have (yet... I hope). If you know other launchers support some of the forementioned features, let me know.

### Anything more about about the components? ###

Sometimes different phone manufacturers and sometimes even different ROMs use different component names for the core apps (e.g. the dialer/phone app).

Nova provides an easy method to allow it to automatically apply the icon to the correct component for system apps. Instead of using the full component name (e.g. writing `ComponentInfo{com.android.deskclock/com.android.deskclock.DeskClock}`) you have to use the provided keyword (e.g. `:CLOCK`). While these only work on Nova Launcher (other launchers just ignore them), they still allow the users of Nova to have their core icons automatically themed. Please note that these only apply to the system apps and not apps installed from the Play Store or any other source.

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

