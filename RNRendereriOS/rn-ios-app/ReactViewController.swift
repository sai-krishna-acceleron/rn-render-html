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
            loadData(site: site, topicId: topicId)
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
    
    private func loadData(site: String, topicId: String) {
        Task {
            let sources = await fetchTopic(site: site, topicId: topicId)
            await MainActor.run {
                self.renderReactView(with: sources, baseDomain: site)
            }
        }
    }
    
    private func renderReactView(with sources: String?, baseDomain: String) {
        let initialProps: [String: Any] = [
            "sources": sources ?? "",
            "baseDomain": baseDomain,
        ]
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
    
    private func fetchTopic(site: String, topicId: String) async -> String? {
        guard let url = URL(string: "\(site)/t/\(topicId).json")
        else { return nil }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            return String(data: data, encoding: .utf8)
        } catch {
            print("API error: \(error.localizedDescription)")
            return nil
        }
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


