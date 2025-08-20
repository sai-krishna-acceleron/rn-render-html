## Implementing New Architecture of RN (TurboModule)

This guide is an end-to-end walkthrough to

  - Enabling the New Architecture on iOS (Fabric + TurboModules + JSI) since react 0.78.0

  - Define a `TurboModule` using Codegen (TypeScript spec → generated native glue) by running Codegen, happens automatically with `pod install`.

  - Implement the native side in Objective-C++ / Swift, consume the module from JavaScript/TypeScript, and troubleshooting the common gotchas.

The instructions are specific for React Native v0.80.x. They’re brownfield-friendly, i.e there is an existing iOS app associated with RN project which implements the legacy version of `NativeModule`


 ### Prerequisites

  - Working RN app on iOS
  - Legacy Archictecture or otherwise (default before 0.76.0)

 ### Step - 1
  #### Opt-in to the New Architecture on iOS
  
    - Updating `ios-project/Podfile`

    - Add the env flag and ensure Hermes/Fabric are enabled via `use_react_native!`. Sample after-podfile below.

      ```ruby
      # ✅ Opt-in to the New Architecture
      ENV['RCT_NEW_ARCH_ENABLED'] = '1'

      require_relative '../node_modules/react-native/scripts/react_native_pods'

      platform :ios, '16.0'

      target 'YourAppTarget' do
        use_react_native!(
          :hermes_enabled => true, # strongly recommended with New Arch
          :fabric_enabled => true # enables Fabric renderer
        )

        # ...any other pods...

        post_install do |installer|
          react_native_post_install(installer)
        end
      end
      ```

  #### Reinstall pods

  ```shell  
    cd ios-project/

    pod deintegrate # Optional

    rm -rf build/ Pods/ Podfile.lock  # Optional
      
    RCT_NEW_ARCH_ENABLED=1 pod install --repo-update # The flag not needed if the ENV variable is added to the podfile
  ```

   - Clean build. If build errors mention `missing` Fabric headers or generated files, it usually means codegen didn’t run or a dependency isn’t ready for New Arch. See “Troubleshooting” section at the bottom.


 ### Step - 2
  
 #### Add Codegen configuration (project-level) [Only the first time]

  - Tell React Native where your TurboModule specs live and how to generate artifacts.

  - In `package.json` (top level RN project):

   ```json
     {
       "name": "your-app",
       "version": "1.0.0",
       // ...
       "codegenConfig": {
         "name": "YourAppSpecs",   // Any name, `Specs` at the end is convention
         "type": "all",       // "modules" is enough if you don't define Fabric components
         "jsSrcsDir": "./specs",    // folder where your Native*.ts specs will live, again `Native` at the beginning is convention
        }
       // ... dependencies here
     }

   ```  

 ### Step - 3

 #### Defining TurboModule spec (TypeScript)
   
   - From here on everything is important and needed to replicate for each time

   - Assume we are creating a simple `Greeting` module that prints your name

   - Create `specs/NativeGreeter.ts` with contents like below

     ```typescript

        // specs/NativeGreeter.ts
        import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
        import { TurboModuleRegistry } from 'react-native';

        export interface Spec extends TurboModule {
          // Keep it simple at first: use async methods (Promise) to avoid sync constraints.
          greet(name: string): Promise<string>;
          // add more APIs as needed...
        }

        export default TurboModuleRegistry.getEnforcing<Spec>('Greeter');
      ```
   - It is convention that the interface should be named `Spec` and any name can be used to export in the last line.      

   - The string passed to TurboModuleRegistry.getEnforcing (here 'Greeter') is the module name the native side will register under. and the JSX/TSX files will import as.


 ### Step - 4

 #### Generate the native glue - With Codegen

  - `pod install` (which triggers codegen automatically) from within the `ios-project`

  - OR `npx react codegen` on the parent (RN directory)

  - OR `node node_modules/react-native/scripts/generate-codegen-artifacts.js --path . --targetPlatform ios --outputPath ios-project/` if `codegen` tool is not installed with react native library / dependency.

  - The first option usually works without issues.

  - Now, post running codegen, a bunch of files are created on the `ios-project/build/generated` (default location, unless RN changes it). The files generated are all dependencies like headers/sources used by pods

  #### Errors

  - If the commands above fail, it usually points to an offending dependency’s spec or TS syntax it can’t parse.


### Step - 5

#### Implement the iOS module

 - We will create 2 files, one Swift and the other Objective C++ (a shim to help with access to the swift code during build)
  

#### Create `ios-project/Greeter.mm` (Objective-C++ shim):

  ```objc
    #import "YourAppSpecs.h" // Name given in "codegenConfig" package.json, this is generated by codegen
    #import <React/RCTBridgeModule.h>
    #import <React/RCTEventEmitter.h>
    #import "RCTDefaultReactNativeFactoryDelegate.h" // Very Important line especially when following new architecture because the view controller that initiates RN view implements this `delegate`

    #import "YourAppName-Swift.h" // `YourAppName` is the name of the target, this is a generated file by XCode


    // The interface name must match the module name from the spec.
    // It inherits from RCTEventEmitter and the Codegen-generated protocol `NativePostsFetcherSpec`.
    @interface Greeter : RCTEventEmitter <NativeGreeterSpec>
    @end

    @implementation Greeter {
      // Name of the swift class is `GreeterImpl`
      GreeterImpl *swiftGreeterImpl;
    }

    // This is the standard TurboModule entry point.
    // It creates and returns the JSI binding for the module.
    - (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
      return std::make_shared<facebook::react::NativePostsFetcherSpecJSI>(params);
    }

    // The initializer for this Objective-C++ class.
    - (instancetype)init {
        self = [super init];
        if (self) {
            // Create an instance of your Swift class when the module is initialized.
            swiftGreeterImpl = [[GreeterImpl alloc] init];
        }
        return self;
    }

    // Spec methods below (The exact same type, names and arguments)
    - (void)greet:(NSString *)name
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject {
      [swiftGreeterImpl greet:name resolver: resolve rejecter:reject];    
    }
    
    // Other spec methods

    // Helper methods (mandatory)

    // Tells React Native the module name.
    // Make sure this absolutely matches with the class, JS and the spec
    + (NSString *)moduleName {
      return @"Greeter"; 
    }

    // If your module doesn't send events, you can return an empty array.
    // This is not necaessary at the moment
    - (NSArray<NSString *> *)supportedEvents {
      return @[];
    }

    // This ensures the module is initialized on the main thread.
    + (BOOL)requiresMainQueueSetup {
      return YES;
    }
  @end
  ```

 - Codegen generates a protocol that defines the module’s interface. (`NativeGreeterSpec` in this case)

 - After running codegen, open the generated files to confirm the exact class names, just in case the above conventions change, as react native being fickle in their decisions

 #### Create `ios-project/GreeterImpl.swift` (.swift source):

  - This file is called by the above ObjC++ implementation as the function calls internally do.

  ```swift

    import Foundation
    import React

    @objc(GreeterImpl)
    class GreeterImpl: NSObject {
      
      @objc func greet(_ name: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) -> String {
        return "Hello, \(name)!"
      }

    }

  ```

- So the way this works is, the .mm (previously defined) file includes the auto-generated `YourAppName-Swift.h` (which links this swift file, after build) so it can call `Greeter.greet(name:)`.

#### Ensure all files are compiled into the app target

 - Add Greeter.mm, and GreeterImpl.swift to the Xcode project under the app target. (Usually happens when created, but just making sure wouldnt hurt)

 - If packaged as a Pod, ensure the Podspec includes *.{h,m,mm,swift}.



### Step - 6

#### Using the module from JS / TS in the RN code

  ```js
  import * as React from 'react';
  import {Button, Text, View} from 'react-native';
  import {greet} from './specs/NativePostsGreeter';

  export default function GreeterScreen() {
    const [msg, setMsg] = React.useState('—');
    return (
      <View style={{padding: 24}}>
        <Button
          title="Say hi"
          onPress={async () => {
            const res = await greet('Trmup');
            setMsg(res);
          }}
        />
        <Text>{msg}</Text>
      </View>
    );
  }
  ```

### Step - 7

#### Re-run Pods & Build

  - Anytime specs / package.json `codegenConfig` has been changed, must run
  codegen, so follow the steps given in `Step - 4` above.

  - Which also means when the `.mm` file is changed, it should be reflected on the spec, otherwise react native can't read the change, so when `Greeter.greet` is called form the JS it'll crash saying `null` or `undefined`

  - Preferably clean, or simply build.

  - On run, In the simulator’s RN Dev Menu, you should see indicators for Hermes/New Architecture if enabled.



### Step - 8

#### Verifying the module is registered

- This is simple, as we can clearly see errors like below.

  ```js
    TurboModuleRegistry.getEnforcing(...): 'Greeter' could not be found
  ```

- Check:

  - `Naming` — The string in getEnforcing('Greeter') exactly matches the native module’s registration name. (including the case)

  - `Build linkage` — The generated code and your NativeGreeter.mm are compiled into the app target.

  - `Pods` — pod install picked up the generated artifacts. Try `pod deintegrate && pod install` and clean build again if needed.

  - `Generated headers` — Open the generated header file (`YourAppSpecs.h`) to confirm the protocol name (`NativeGreeterSpec`) and that your class conforms to it.


### Troubleshooting (common issues)

#### Missing Fabric / codegen headers at build time

  - Usually means New Arch pods weren’t installed with the flag. Re-run with:

    `cd ios-project && RCT_NEW_ARCH_ENABLED=1 pod install --repo-update`

  - Delete DerivedData and retry. Ensure `fabric_enabled => true` in use_react_native! in the `Podfile`.

#### Codegen fails parsing TS

  - Dependency defines a spec that codegen can’t parse. Update the dependency, check typescript syntax, or check if the `.ts` exists in the first place before running Codegen. 
  - You can also run the codegen CLI manually to see detailed errors (3rd option in step 4)

#### Swift symbol not visible

  - Ensure Swift class/methods are all annotated with `@objc` and public where needed.

  - Confirm the `YourAppName-Swift.h` is imported by the `.mm` file, and files are in the same build target.

  - Ensure that the generated headers are available to the build system, check if `HEADER_SEARCH_PATHS` has the path `$(PODS_ROOT)/../build/generated/ios` and is set to `recursive`

#### Module not found at runtime

  - Confirm the generated provider/registry (the header file) includes your module.
  - Sometimes a manual provider hook is required (depends on RN minor). 
  - Inspect generated C++/ObjC glue after codegen to see if the module is listed.

#### Build succeeds, but method crashes

  - Check the method signature in the generated protocol header and your implementation matches exactly
  - name, case, arguments, Promise resolve/reject blocks, etc


### More gotchas

  - Preferably use async methods, that return promises in your spec.

  - If there isn't a bridging header `.h` available in the project, create it even though nothing is needed in it, i.e leave it empty. The build system needs it to link between the `.mm` and `.swift` files.
    - This should be listed under `SWIFT_OBJC_BRIDGING_HEADER`

  - sync methods aren't fully supported or vary in functionality with the react native version.

  - Since, all our logic is in swift and ObjC++ is an unknown, kepp it very simple with just definitions and calls to the swift class, all implementations go into swift.
  
  - Add one module at a time. Add them slowly and test after each, so it doesn't mess up the rest of the codebase.

  - Name the modules consistently, can't attest to this, but some react native versions (or patches) enfore these conventions strictly, as reported in stack overflow

     `specs/NativeFeature.ts -> Feature.mm -> FeatureImpl.swift -> TurboModuleRegistry.getEnforcing('Feature')`

  - Preferably use the [new style](https://reactnative.dev/docs/0.80/integration-with-existing-apps) of react native with the delegation pattern to figure out where the JS sources come from, as RN raises warnings saying you're still following legacy pattern.
