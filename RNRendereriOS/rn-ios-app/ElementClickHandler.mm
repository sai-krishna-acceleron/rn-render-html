#import "RNRenderHTMLSpecs.h"
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "RCTDefaultReactNativeFactoryDelegate.h"
#import "rn_ios_app-Swift.h"

@interface ElementClickHandler : RCTEventEmitter <NativeElementClickHandlerSpec>
@end

@implementation ElementClickHandler {
    ElementClickHandlerImpl *swiftImpl;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
(const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeElementClickHandlerSpecJSI>(params);
}

- (instancetype)init {
    self = [super init];
    if (self) {
        swiftImpl = [[ElementClickHandlerImpl alloc] init];
    }
    return self;
}

#pragma mark - NativeElementClickHandlerSpec Methods

- (void)onImageClicked:(nonnull NSString *)src
                   alt:(NSString *)alt
              imgClass:(NSString *)imgClass
               resolve:(nonnull RCTPromiseResolveBlock)resolve
                reject:(nonnull RCTPromiseRejectBlock)reject {
    [swiftImpl onImageClicked:src alt:alt imgClass:imgClass resolver:resolve rejecter:reject];
}

- (void)onLinkClicked:(nonnull NSString *)href
                 text:(NSString *)text
               target:(NSString *)target
              resolve:(nonnull RCTPromiseResolveBlock)resolve
               reject:(nonnull RCTPromiseRejectBlock)reject {
    [swiftImpl onLinkClicked:href text:text target:target resolver:resolve rejecter:reject];
}

- (void)onUserClicked:(nonnull NSString *)username
                 href:(nonnull NSString *)href
              resolve:(nonnull RCTPromiseResolveBlock)resolve
               reject:(nonnull RCTPromiseRejectBlock)reject {
    [swiftImpl onUserClicked:username href:href resolver:resolve rejecter:reject];
}


+ (NSString *)moduleName {
    return @"ElementClickHandler";
}

- (NSArray<NSString *> *)supportedEvents {
    return @[];
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

@end
