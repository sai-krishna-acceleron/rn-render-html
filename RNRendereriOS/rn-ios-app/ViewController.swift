//
//  ViewController.swift
//  RNRendereriOS
//
//  Created by Acceleron Developer on 2025/8/15.
//

import UIKit

class ViewController: UIViewController {
    
    var reactViewController: ReactViewController?

    override func viewDidLoad() {
        super.viewDidLoad()
        self.view.backgroundColor = .systemBackground
    }
    
    override func viewWillAppear(_ animated: Bool) {
        let a = UIButton(type: .system)
        a.setTitle("Click me!", for: .normal)
        a.titleLabel?.font = .systemFont(ofSize: 20, weight: .semibold)
        a.translatesAutoresizingMaskIntoConstraints = false
//        a.addTarget(self, action: #selector(openView(_:)), for: .touchUpInside)
        a.addAction(UIAction(handler: { [weak self] _ in
            guard let self else { return }
            if reactViewController == nil {
                reactViewController = ReactViewController()
            }
            present(reactViewController!, animated: true)
        }), for: .touchUpInside)
        self.view.addSubview(a)
        
        NSLayoutConstraint.activate([
            self.view.centerXAnchor.constraint(equalTo: a.centerXAnchor),
            self.view.centerYAnchor.constraint(equalTo: a.centerYAnchor),
        ])
    }
    
    @objc func openView(_ sender: UITapGestureRecognizer) {
        print("THIS IS A TEST: ", sender.state)
    }


}

