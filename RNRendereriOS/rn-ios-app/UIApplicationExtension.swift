//
//  UIApplicationExtension.swift
//  rn-ios-app
//
//  Created by Acceleron Developer on 2025/8/20.
//

import Foundation
import UIKit

extension UIApplication {
    var appKeyWindow: UIWindow? {
        // Get connected scenes
        return UIApplication.shared.connectedScenes
            // Keep only active scenes, onscreen and visible to the user
            .filter { $0.activationState == .foregroundActive }
            // Keep only the first `UIWindowScene`
            .first(where: { $0 is UIWindowScene })
            // Get its associated windows
            .flatMap({ $0 as? UIWindowScene })?.windows
            // Finally, keep only the key window
            .first(where: \.isKeyWindow)
    }
    
    var firstWindow: UIWindow? {
        return (UIApplication.shared.connectedScenes.first as? UIWindowScene)?.windows.first
    }
    
    var safeAreaInsets: UIEdgeInsets? {
        return appKeyWindow?.safeAreaInsets
    }
    
}
