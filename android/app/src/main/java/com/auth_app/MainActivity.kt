package com.auth_app

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.util.Log
class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "auth_app"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)


   /**
   * RASP Security Check
   */
  override fun onStart() {
        super.onStart()
        checkSecurity()
    }

  override fun onResume() {
        super.onResume()
        checkSecurity()
    }

    private var isHandlingThreat = false
    private fun checkSecurity() {
        SecurityManager.checkRuntimeSecurity(this) { threat ->
            Log.d("SECURITY_RASP", "Amenaza detectada: $threat")
            if(isHandlingThreat) return@checkRuntimeSecurity
            isHandlingThreat = true
            finishAndRemoveTask()
        }
    }
}
