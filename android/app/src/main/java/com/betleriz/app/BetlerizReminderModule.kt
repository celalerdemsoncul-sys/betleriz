package com.betleriz.app

import android.Manifest
import android.app.*
import android.content.*
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.*
import com.facebook.react.ReactPackage
import com.facebook.react.uimanager.ViewManager
import org.json.JSONObject

internal object ReminderStore {
    private const val CHANNEL = "betleriz_matches"
    private fun prefs(context: Context) = context.getSharedPreferences("betleriz_reminders", Context.MODE_PRIVATE)
    private fun intent(context: Context, id: String) = Intent(context, BetlerizReminderReceiver::class.java).apply {
        action = "com.betleriz.app.REMINDER"
        data = Uri.parse("betleriz://reminder/" + Uri.encode(id))
        putExtra("id", id)
    }
    private fun pending(context: Context, id: String): PendingIntent = PendingIntent.getBroadcast(
        context, 0, intent(context, id), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    @Synchronized fun schedule(context: Context, id: String, title: String, body: String, at: Long) {
        require(id.isNotEmpty() && at > System.currentTimeMillis()) { "Reminder time has passed" }
        val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        // Inexact idle-aware alarms need no exact-alarm special access. Battery saving can delay delivery.
        manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending(context, id))
        val value = JSONObject().put("id", id).put("title", title).put("body", body).put("at", at)
        if (!prefs(context).edit().putString(id, value.toString()).commit()) {
            manager.cancel(pending(context,id)); throw IllegalStateException("Could not persist reminder")
        }
    }
    @Synchronized fun cancel(context: Context, id: String) {
        (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(pending(context,id))
        (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).cancel(id, 1)
        if (!prefs(context).edit().remove(id).commit()) throw IllegalStateException("Could not remove reminder")
    }
    fun notify(context: Context, id: String) {
        val raw = prefs(context).getString(id, null) ?: return
        val value = JSONObject(raw)
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(NotificationChannel(CHANNEL, "Betleriz", NotificationManager.IMPORTANCE_DEFAULT))
        }
        val open = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(context, CHANNEL) else Notification.Builder(context)
        builder.setSmallIcon(R.drawable.ic_betleriz_notification).setContentTitle(value.getString("title"))
            .setContentText(value.getString("body")).setStyle(Notification.BigTextStyle().bigText(value.getString("body")))
            .setContentIntent(open).setAutoCancel(true)
        if (Build.VERSION.SDK_INT < 33 || context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            manager.notify(id, 1, builder.build())
        }
        prefs(context).edit().remove(id).apply()
    }
    fun restore(context: Context) {
        val saved = prefs(context).all.toMap()
        for ((id, raw) in saved) {
            try {
                val value = JSONObject(raw as String)
                if (value.getLong("at") > System.currentTimeMillis()) {
                    schedule(context,id,value.getString("title"),value.getString("body"),value.getLong("at"))
                } else { cancel(context,id) }
            } catch (_: Exception) { prefs(context).edit().remove(id).apply() }
        }
    }
}

class BetlerizReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        try { if (intent.action == "com.betleriz.app.REMINDER") ReminderStore.notify(context,intent.getStringExtra("id") ?: return) }
        catch (_: Exception) { /* Do not crash the receiver when permission/storage changed. */ }
    }
}
class BetlerizBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action in listOf(Intent.ACTION_BOOT_COMPLETED,Intent.ACTION_MY_PACKAGE_REPLACED,Intent.ACTION_TIME_CHANGED,Intent.ACTION_TIMEZONE_CHANGED)) ReminderStore.restore(context)
    }
}
class BetlerizReminderModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName() = "BetlerizReminders"
    @ReactMethod fun schedule(id:String,title:String,body:String,at:Double,promise:Promise) {
        try { ReminderStore.schedule(reactApplicationContext,id,title,body,at.toLong());promise.resolve(true) }
        catch (e:Exception) {promise.reject("REMINDER_SCHEDULE",e)}
    }
    @ReactMethod fun cancel(id:String,promise:Promise) {
        try { ReminderStore.cancel(reactApplicationContext,id);promise.resolve(true) }
        catch (e:Exception) {promise.reject("REMINDER_CANCEL",e)}
    }
    @ReactMethod fun notificationsEnabled(promise:Promise) {
        val manager=reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = if (Build.VERSION.SDK_INT >= 26) manager.getNotificationChannel("betleriz_matches") else null
        promise.resolve(manager.areNotificationsEnabled() && (channel == null || channel.importance != NotificationManager.IMPORTANCE_NONE))
    }
}
class BetlerizReminderPackage : ReactPackage {
    override fun createNativeModules(context:ReactApplicationContext):List<NativeModule> = listOf(BetlerizReminderModule(context))
    override fun createViewManagers(context:ReactApplicationContext):List<ViewManager<*,*>> = emptyList()
}
