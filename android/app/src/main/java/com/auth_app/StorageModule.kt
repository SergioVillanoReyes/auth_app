package com.auth_app

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class StorageModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "StorageModule"

  private val prefs by lazy {
    val masterKey = MasterKey.Builder(reactApplicationContext)
      .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
      .build()

    EncryptedSharedPreferences.create(
      reactApplicationContext,
      "auth_app_secure_prefs",
      masterKey,
      EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
      EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
  }

  @ReactMethod
  fun setItem(key: String, value: String, promise: Promise) {
    try {
      prefs.edit().putString(key, value).apply()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("SET_ERROR", e.message)
    }
  }

  @ReactMethod
  fun getItem(key: String, promise: Promise) {
    try {
      val value = prefs.getString(key, null)
      promise.resolve(value)
    } catch (e: Exception) {
      promise.reject("GET_ERROR", e.message)
    }
  }
}
