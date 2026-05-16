package com.tmk4men.okusureminder;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class OkusuWidget extends AppWidgetProvider {

    public static final String PREFS_NAME = "OkusuWidgetPrefs";
    public static final String KEY_TOTAL = "today_total";
    public static final String KEY_TAKEN = "today_taken";
    public static final String KEY_MESSAGE = "message";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            updateOne(context, appWidgetManager, id);
        }
    }

    static void updateOne(Context context, AppWidgetManager manager, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int total = prefs.getInt(KEY_TOTAL, 0);
        int taken = prefs.getInt(KEY_TAKEN, 0);
        String customMessage = prefs.getString(KEY_MESSAGE, null);

        String countStr = taken + "/" + total;
        String message;
        if (total == 0) {
            message = "お薬を登録してね";
        } else if (taken >= total) {
            message = "今日もばっちり！";
        } else {
            int remain = total - taken;
            message = "あと " + remain + " 個";
        }
        if (customMessage != null && customMessage.length() > 0) {
            message = customMessage;
        }

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_okusu);
        views.setTextViewText(R.id.widget_count, countStr);
        views.setTextViewText(R.id.widget_message, message);

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
                context,
                widgetId,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, pi);
        views.setOnClickPendingIntent(R.id.widget_btn, pi);

        manager.updateAppWidget(widgetId, views);
    }

    public static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName cn = new ComponentName(context, OkusuWidget.class);
        int[] ids = manager.getAppWidgetIds(cn);
        for (int id : ids) {
            updateOne(context, manager, id);
        }
    }
}
