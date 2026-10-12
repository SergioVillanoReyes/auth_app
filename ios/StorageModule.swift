//
//  StorageModule.swift
//  app_pokedex
//
//  Created by user on 08/07/26.
//

import Foundation
import React

@objc(StorageModule)
class StorageModule: NSObject {
  
  @objc
  func setItem(
    _ key: String,
    value: String,
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ){
      UserDefaults.standard.set(value, forKey: key)
      resolve(nil)
  }
  
  @objc
  func getItem(
    _ key: String,
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
      resolve(UserDefaults.standard.string(forKey: key))
  }
  
}
