//
//  PostsFetcher.swift
//  rn-ios-app
//
//  Created by Acceleron Developer on 2025/8/18.
//

import Foundation
import React

@objc(PostsFetcher)
class PostsFetcher: NSObject, RCTBridgeModule {
  static func moduleName() -> String! { return "PostsFetcher" }
  static func requiresMainQueueSetup() -> Bool { return false }

  @objc
  func fetchPosts(
    _ baseUrl: String, topicId: NSNumber, postIds: [NSNumber],
    resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock
  ) {
    guard postIds.count > 0 else {
      resolver(["post_stream": ["posts": []]])
      return
    }
    let postIdsQuery = postIds.map { "post_ids[]=\($0)" }.joined(separator: "&")
    let urlString = "\(baseUrl)/t/\(topicId)/posts.json?\(postIdsQuery)&include_suggested=false"
    guard let url = URL(string: urlString) else {
      rejecter("bad_url", "Invalid URL", nil)
      return
    }
    let task = URLSession.shared.dataTask(with: url) { data, _, error in
      if let error = error {
        rejecter("network_error", error.localizedDescription, error)
        return
      }
      guard let data = data else {
        rejecter("no_data", "No data", nil)
        return
      }
      do {
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        resolver(json)
      } catch {
        rejecter("json_error", error.localizedDescription, error)
      }
    }
    task.resume()
  }
}
