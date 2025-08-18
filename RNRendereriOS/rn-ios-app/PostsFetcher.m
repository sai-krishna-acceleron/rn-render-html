//
//  PostsFetcher.m
//  rn-ios-app
//
//  Created by Acceleron Developer on 2025/8/18.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PostsFetcher, NSObject)
RCT_EXTERN_METHOD(fetchPosts:(NSString *)baseUrl
                  topicId:(nonnull NSNumber *)topicId
                  postIds:(NSArray *)postIds
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
