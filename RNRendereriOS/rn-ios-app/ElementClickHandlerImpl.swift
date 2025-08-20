import Foundation
import React

@objc(ElementClickHandlerImpl)
class ElementClickHandlerImpl: NSObject {

  @objc
  func onUserClicked(
    _ username: String,
    href: String,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    NSLog("User clicked: \(username) (\(href))")
    showAlert(title: "User Mention", message: "Username: \(username)")
    resolver(nil)
  }

  @objc
  func onLinkClicked(
    _ href: String,
    text: String?,
    target: String?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    NSLog("Link clicked: \(text ?? "") (\(href)), target: \(target ?? "")")
    showAlert(title: "Link Clicked", message: "URL: \(href)")
    resolver(nil)
  }

  @objc
  func onImageClicked(
    _ src: String,
    alt: String?,
    imgClass: String?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    NSLog("Image clicked: \(src), alt: \(alt ?? ""), class: \(imgClass ?? "")")
    showAlert(title: "Image Clicked", message: "URL: \(src)\nAlt: \(alt ?? "")")
    resolver(nil)
  }

  private func getTopViewController(
    _ rootViewController: UIViewController? = UIApplication.shared.appKeyWindow?.rootViewController
  ) -> UIViewController? {
    if let presented = rootViewController?.presentedViewController {
      return getTopViewController(presented)
    }
    if let nav = rootViewController as? UINavigationController {
      return getTopViewController(nav.visibleViewController)
    }
    if let tab = rootViewController as? UITabBarController {
      return getTopViewController(tab.selectedViewController)
    }
    return rootViewController
  }

  private func showAlert(title: String, message: String) {
    DispatchQueue.main.async {
      if let topVC = self.getTopViewController() {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
        topVC.present(alert, animated: true, completion: nil)
      }
    }
  }
}
