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

## The instructions ##

1. Download this project. You can use `git` to clone this project or you can just download the current version using the `Download ZIP` button.
2. If you haven't set up the Android Developer Tools, you need to do that. You can download the full SDK [here](http://developer.android.com/sdk/index.html). It is needed to build the app from the source code.
3. Launch Eclipse (it's bundled with the tools) and import this project into your workspace (open `File > Import...` and then find and choose `Existing Android Code Into Workspace`, then as the Root directory, choose the place where you downloaded this project to).
4. Now you have the project imported, you can rename it in the sidebar so that you know which icon pack you are working on in case you have multiple. You can do that by right-clicking the project and using `Refactor > Rename...`.
5. Now, we must rename the package name (right-click the project and then use `Android Tools > Rename Application Package`). The package name is what identifies each installed app in the Android system so different package names mean different apps. It must be unique and you can't change it after publishing (unless you re-publish it as a new app).
6. If you want, you can open the `AndroidManifest.xml` file to change the version of the application. The version code is a number that must increase and the version name can be anything you want. The code is used by the system and the name is displayed to the user. You can read more in-depth information about versioning the app [right here](http://developer.android.com/tools/publishing/versioning.html).
7. Replace `/res/drawable-xxhdpi/theme_icon.png` with your own icon. This is the icon that you see along with the icon pack (e.g. installed apps section or launcher settings).
8. Replace the `/res/drawable-xxhdpi/theme_mainfeature.png` file with your own banner-styled image. This usually appears above the description of your pack inside launchers. Replace the `/res/drawable/xxhdpi/theme_preview*.png` files (and add more, if you want) with your theme previews (usually either images of themed home-screens or app drawers). There can be up to 5 of these and they follow the naming scheme `/res/drawable-xxhdpidpi/theme_previewN.png` where N is the number of the preview (starting with 1).
9. Open `/res/values/base.xml` and `/assets/themecfg.xml` and modify the values you feel like changing. There is information about each of the values right next to them.
10. Copy your icons over to the appropriate `/res/drawable` directory. Because of how applications store resources, the file names can only consist of lowercase letters, numbers, underscores and periods/dots. Check out the subsection below to read about the different drawable directories.
11. Since different launchers expect something a bit different, there are multiple files to be modified now.
   - `/res/values/iconpack.xml` is used by icon pickers in ADW and Apex. In this file, the icon with the filename `play_store.png` will be written as `<item>play_store</item>`. Notice the missing extension (.png).
   - `/res/xml/drawable.xml` is used by the icon picker in Nova. In this file, the icon with the filename `play_store.png` will be written inside quotes as `<item drawable="play_store"/>`. To use category seperators in Nova, add a `<category title="Title" />` at the place you want a category title.
   - `/res/xml/appfilter.xml` is used by the launchers to automatically apply icons. An example item entry for this file is ` <item component="ComponentInfo{com.android.vending/com.android.vending.AssetBrowserActivity}" drawable="play_store"/>`. You can read about this format in the subsection below.
12. Copy `/res/xml/appfilter.xml` to `/assets/appfilter.xml` and copy `/res/xml/drawable.xml` to `/assets/drawable.xml`. The files in the assets directory are used by GO Launcher.
13. Prepare your graphical assets for use on the Google Play Store. You can read about the different assets [here](https://support.google.com/googleplay/android-developer/answer/1078870). If you want, you can read even more about the guidelines for the Featured-Image [in this post](http://android-developers.blogspot.com/2011/10/android-market-featured-image.html).
14. Export the application for the release. You have to open `File > Export > Export Android Application (inside the Android subsection)`, choose your newly made project and then just follow the on-screen instructions. You will need to create a new keystore and a private key, if you don't have them. Don't lose those as you will need them to publish updates. After finishing this wizard you will have an .apk file (application package file) ready for release. Before you continue, you should install the app on your personal device to test the icon pack. You can also open [this page](http://developer.android.com/tools/publishing/app-signing.html#ExportWizard) to read more extensively about the application signing process.
15. If you are satisfied with how the pack looks installed on the device, publish it on Google Play Store! This can be done through the Developer Console. To get a quick overview of the different areas in the Console, you can read [this page](http://developer.android.com/distribute/googleplay/publish/console.html).

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

Sometimes different phone manufacturers and sometimes even different ROMs use different component names for the core apps (e.g. the dialer/phone app). Nova provides an easy method to allow it to automatically apply the icon to the correct component for system apps. Instead of using the component name (e.g. writing `ComponentInfo{com.android.deskclock/com.android.deskclock.DeskClock}`) you have to use the provided keyword (e.g. `:CLOCK`). While these only work on Nova Launcher (other launchers just ignore them), they still allow the users of Nova to have their core icons automatically themed. Please note that these only apply to the system apps and not apps installed from the Play Store or any other source.

The keywords provided by Nova:

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

### So, how do I find out these component names? ###

In Nova Launcher you can quickly export the icons. To do so, open Nova Settings and long-press the Volume Down button to unlock Labs (extra settings for the launcher). Then you can use `Labs > Debug > Export Icons`. The resulting .zip file (located at `/sdcard/novaIconExport.zip`) consists of a complete `/res/xml/appfilter.xml` file and the best resolution launcher icons each app provides (placed in the appropriate drawable directory). You can use this to see all the component names for your current installed apps.

You can also use Nova to see individual component names. You need to open the forementioned Labs section and then check `Debug > Show Component in Edit dialog`. Then you have to drag an icon (either directly from the app drawer of from one of the homescreens) to the Edit option. At the bottom of the dialog that appears, you will see the component name.

Props to Nova Launcher for providing good documentation and the helpful features other launchers don't have (yet... I hope). If you know other launchers support some of the forementioned features, let me know.

