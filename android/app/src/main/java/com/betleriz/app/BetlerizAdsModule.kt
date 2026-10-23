package com.betleriz.app

import android.app.Activity
import com.facebook.react.bridge.*
import com.facebook.react.ReactPackage
import com.facebook.react.uimanager.ViewManager
import com.google.android.gms.ads.*
import com.google.android.gms.ads.rewarded.*
import com.google.android.ump.*

class BetlerizAdsModule(context:ReactApplicationContext):ReactContextBaseJavaModule(context) {
    private var pending:Promise?=null
    private var initialized=false
    override fun getName()="BetlerizAds"
    private fun fail(code:String,message:String){val promise=pending;pending=null;promise?.reject(code,message)}
    @ReactMethod fun prepare(promise:Promise){
        val activity=currentActivity?:run{promise.resolve(false);return}
        activity.runOnUiThread {
            val consent=UserMessagingPlatform.getConsentInformation(activity)
            consent.requestConsentInfoUpdate(activity,ConsentRequestParameters.Builder().build(),{promise.resolve(true)},{promise.resolve(false)})
        }
    }
    @ReactMethod fun privacy(promise:Promise){
        val activity=currentActivity?:run{promise.reject("NO_ACTIVITY","Activity unavailable");return}
        activity.runOnUiThread{
            val info=UserMessagingPlatform.getConsentInformation(activity)
            if(info.privacyOptionsRequirementStatus!=ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED){promise.resolve(false);return@runOnUiThread}
            UserMessagingPlatform.showPrivacyOptionsForm(activity){error->if(error!=null)promise.reject("CONSENT",error.message) else promise.resolve(true)}
        }
    }
    @ReactMethod fun show(unit:String,user:String,nonce:String,test:Boolean,promise:Promise){
        val activity=currentActivity?:run{promise.reject("NO_ACTIVITY","Activity unavailable");return}
        if(unit!=BuildConfig.BETLERIZ_REWARDED_AD_UNIT || (test&&!BuildConfig.DEBUG) || (!test&&unit.startsWith("ca-app-pub-3940256099942544/"))){promise.reject("AD_CONFIG","Rewarded ad configuration is incomplete");return}
        if(!nonce.matches(Regex("[a-f0-9]{48}"))||!user.matches(Regex("[a-f0-9]{32}"))){promise.reject("AD_CONFIG","Invalid verification session");return}
        activity.runOnUiThread {
            if(pending!=null){promise.reject("AD_BUSY","An ad is already active");return@runOnUiThread}
            pending=promise
            val consent=UserMessagingPlatform.getConsentInformation(activity)
            consent.requestConsentInfoUpdate(activity,ConsentRequestParameters.Builder().build(),{
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity){error->
                    if(error!=null||!consent.canRequestAds()){fail("CONSENT",error?.message?:"Ads are not permitted")}else{
                        if(initialized)load(activity,unit,user,nonce)else MobileAds.initialize(activity){
                            activity.runOnUiThread{initialized=true;load(activity,unit,user,nonce)}
                        }
                    }
                }
            },{error->fail("CONSENT",error.message)})
        }
    }
    private fun load(activity:Activity,unit:String,user:String,nonce:String){
        RewardedAd.load(activity,unit,AdRequest.Builder().build(),object:RewardedAdLoadCallback(){
            override fun onAdFailedToLoad(error:LoadAdError){fail("AD_UNAVAILABLE",error.message)}
            override fun onAdLoaded(ad:RewardedAd){
                if(activity.isFinishing||activity.isDestroyed){fail("NO_ACTIVITY","Activity unavailable");return}
                ad.setServerSideVerificationOptions(ServerSideVerificationOptions.Builder().setUserId(user).setCustomData(nonce).build())
                var earned=false
                ad.fullScreenContentCallback=object:FullScreenContentCallback(){
                    override fun onAdFailedToShowFullScreenContent(error:AdError){fail("AD_UNAVAILABLE",error.message)}
                    override fun onAdDismissedFullScreenContent(){val result=pending;pending=null;result?.resolve(earned)}
                }
                ad.show(activity){earned=true}
            }
        })
    }
}
class BetlerizAdsPackage:ReactPackage {
    override fun createNativeModules(context:ReactApplicationContext):List<NativeModule> = listOf(BetlerizAdsModule(context))
    override fun createViewManagers(context:ReactApplicationContext):List<ViewManager<*,*>> = emptyList()
}
