//
//  ReactViewController.swift
//  RNRendereriOS
//
//  Created by Acceleron Developer on 2025/8/15.
//

import Foundation
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider



class ReactViewController: UIViewController {
    
    var reactNativeFactory: RCTReactNativeFactory?
    var reactNativeFactoryDelegate: RCTReactNativeFactoryDelegate?
    
    static let TOPIC_ID = "34686"
    static let COMPONENT_NAME = "RNRenderHTML"
    static let API_BASE_URL = "https://meta.discourse.org"
    
    override func viewDidLoad() {
        super.viewDidLoad()

        reactNativeFactoryDelegate = ReactNativeDelegate()
        reactNativeFactoryDelegate!.dependencyProvider = RCTAppDependencyProvider()
        reactNativeFactory = RCTReactNativeFactory(delegate: reactNativeFactoryDelegate!)

        loadData()

        // self.view = reactNativeFactory!.rootViewFactory.view(withModuleName: ReactViewController.COMPONENT_NAME)
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        self.view.backgroundColor = .white
    }

    private func loadData() {
      Task {
        let sources = await fetchTopic()
        await MainActor.run {
          self.renderReactView(with: sources)
        }
      }
    }

    private func renderReactView(with sources: String?) {
      let initialProps: [String: Any] = ["sources": sources ?? ""]
      let rootView = reactNativeFactory!.rootViewFactory.view(
            withModuleName: ReactViewController.COMPONENT_NAME,
            initialProperties: initialProps
        )
        rootView.translatesAutoresizingMaskIntoConstraints = false
        self.view.addSubview(rootView)
        NSLayoutConstraint.activate([
            rootView.safeAreaLayoutGuide.leadingAnchor.constraint(equalTo: self.view.leadingAnchor),
            rootView.safeAreaLayoutGuide.trailingAnchor.constraint(equalTo: self.view.trailingAnchor),
            rootView.safeAreaLayoutGuide.topAnchor.constraint(equalTo: self.view.safeAreaLayoutGuide.topAnchor),
            rootView.safeAreaLayoutGuide.bottomAnchor.constraint(equalTo: self.view.safeAreaLayoutGuide.bottomAnchor),
        ])
    }

    private func fetchTopic() async -> String? {
        guard let url = URL(string: "\(ReactViewController.API_BASE_URL)/t/\(ReactViewController.TOPIC_ID).json") else { return nil }
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

