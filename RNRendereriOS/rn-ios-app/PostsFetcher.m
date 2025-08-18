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

RCT_EXTERN_METHOD(fetchWindow:(NSString *)baseUrl
                  topicId:(NSString *)topicId
                  postNumber:(nullable NSString *)postNumber
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(fetchNext:(NSString *)baseUrl
                  topicId:(NSString *)topicId
                  lastPostNumber:(nonnull NSString *)lastPostNumber
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(fetchPrev:(NSString *)baseUrl
                  topicId:(NSString *)topicId
                  firstPostNumber:(nonnull NSString *)firstPostNumber
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
