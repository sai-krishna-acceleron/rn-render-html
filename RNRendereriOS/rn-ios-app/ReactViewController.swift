//
//  ReactViewController.swift
//  RNRendereriOS
//
//  Created by Acceleron Developer on 2025/8/15.
//

import Foundation
import React
import ReactAppDependencyProvider
import React_RCTAppDelegate
import UIKit

class ReactViewController: UIViewController {
    
    var reactNativeFactory: RCTReactNativeFactory?
    var reactNativeFactoryDelegate: RCTReactNativeFactoryDelegate?
    
    static let COMPONENT_NAME = "RNRenderHTML"
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        reactNativeFactoryDelegate = ReactNativeDelegate()
        reactNativeFactoryDelegate!.dependencyProvider = RCTAppDependencyProvider()
        reactNativeFactory = RCTReactNativeFactory(delegate: reactNativeFactoryDelegate!)
        
        if let topicData = pickRandomTopic(), let site = topicData["site"], let topicId = topicData["topicId"] {
            let postNumber = topicData["postNumber"] ?? nil
            renderReactView(baseDomain: site, topicId: topicId, postNumber: postNumber)
        } else {
            NSLog("ERROR!!! Invalid data found. Cannot load RN view")
        }
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        self.view.backgroundColor = .white
    }
    
    private func pickRandomTopic() -> [String: String]? {
        guard !DATA.isEmpty else { return nil }
        let idx = Int.random(in: 0..<DATA.count)
        let dict = DATA[idx]
        let site = dict["site"] ?? ""
        let topicId = dict["topicId"] ?? ""
        print("❗️[RANDOM POST PICKED] Index: \(idx), site: \(site), topicId: \(topicId)")
        return dict
    }
    
    private func renderReactView(baseDomain: String, topicId: String, postNumber: String? = nil) {
        var initialProps: [String: Any] = [
            "baseDomain": baseDomain,
            "topicId": topicId,
        ]
        if let postNumber = postNumber {
            initialProps["postNumber"] = postNumber
        }
        let rootView = reactNativeFactory!.rootViewFactory.view(
            withModuleName: ReactViewController.COMPONENT_NAME,
            initialProperties: initialProps
        )
        rootView.translatesAutoresizingMaskIntoConstraints = false
        self.view.addSubview(rootView)
        NSLayoutConstraint.activate([
            rootView.safeAreaLayoutGuide.leadingAnchor.constraint(equalTo: self.view.leadingAnchor),
            rootView.safeAreaLayoutGuide.trailingAnchor.constraint(equalTo: self.view.trailingAnchor),
            rootView.safeAreaLayoutGuide.topAnchor.constraint(
                equalTo: self.view.safeAreaLayoutGuide.topAnchor),
            rootView.safeAreaLayoutGuide.bottomAnchor.constraint(
                equalTo: self.view.safeAreaLayoutGuide.bottomAnchor),
        ])
    }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
    override func sourceURL(for bridge: RCTBridge) -> URL? {
        self.bundleURL()
    }
    
    override func bundleURL() -> URL? {
#if DEBUG
        RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
        Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
    }
    
}
