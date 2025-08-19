Pre-requisites:

- Please make sure to have the following installed.
  - XCode 16.2 or higher
  - Compatible XCode command line tools.
    - Install using `xcode-select --install`
    - Also can be found on apple developers website along with the XCode software
  - Node v18 or higher
  - Gem `concurrent-ruby` 'v1.3.4' preferred
    - Remove older / duplicated versions by `sudo gem uninstall concurrent-ruby`
    - Install by `sudo gem install concurrent-ruby -v '1.3.4'`
  - Gem `cocoapods` latest version
    - Install by `sudo gem install cocoapods`
  - Optional:
     - `brew install watchman` only on development, speeds up watching the code for react native.


Current Project Environment:
  - MacOS Sequoia 15.6
  - ruby - v3.2.2
  - Node - v20.19.4
  - XCode 16.4
    - XCode Commmand line tools 16.4  




Steps to run this project:

1. Please make sure the above pre-requisites are satisfied.

2. Install pods from the iOS folder `RNRendereriOS`
  - `pod install --repo-update`

3. Back on the root folder, start the metro bundler / server to start serving the react-native code to the app. In the release app, we bundle it directly into the app before deploying it.
  - `npm start`

4. Clean build and run the iOS app  

