package com.auth_app

import android.content.Context
import com.aheaditec.talsec_security.security.api.Talsec
import com.aheaditec.talsec_security.security.api.TalsecConfig
import com.aheaditec.talsec_security.security.api.TalsecMode
import com.aheaditec.talsec_security.security.api.ThreatListener
import com.auth_app.BuildConfig
import android.util.Log

object SecurityManager {

    fun checkRuntimeSecurity(context: Context, onViolation: (String) -> Unit) {

        val listener = object : ThreatListener.ThreatDetected() {
            override fun onRootDetected() = onViolation("ROOT_DETECTED")
            override fun onDebuggerDetected() = onViolation("DEBUGGER_ATTACHED")
            override fun onEmulatorDetected() = onViolation("EMULATOR_DETECTED")
            override fun onHookDetected() = onViolation("DYNAMIC_HOOK_DETECTED")
            override fun onTamperDetected() = onViolation("APK_TAMPERING")
        }

        val hashes = mutableListOf<String>()

        if (!BuildConfig.DEBUG) {
            hashes.add("ZCvi3PWJOn5wJNMnMfkK6/XzKck4vUj9v3nOHFLSDUQ=") // hash debug
        } else {
            if (BuildConfig.TALSEC_PROD_HASH.isNotEmpty()) {
                hashes.add(BuildConfig.TALSEC_PROD_HASH)
            }
        }

        Log.d("hashes", hashes.toString())
        Log.d("BuildConfig.TALSEC_PROD_HASH", BuildConfig.TALSEC_PROD_HASH.toString())

        val config = TalsecConfig.Builder(
            context.packageName,
            hashes.toTypedArray()
        ).watcherMail("villanoreyes@hotmail.com").prod(!BuildConfig.DEBUG).build()

        ThreatListener(listener).registerListener(context)
        Talsec.start(context, config, TalsecMode.BACKGROUND)

    }

}