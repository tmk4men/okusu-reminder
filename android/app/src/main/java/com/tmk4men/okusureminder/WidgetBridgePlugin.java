package com.tmk4men.okusureminder;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        Integer total = call.getInt("total", 0);
        Integer taken = call.getInt("taken", 0);
        String message = call.getString("message", "");

        Context ctx = getContext();
        SharedPreferences prefs = ctx.getSharedPreferences(OkusuWidget.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putInt(OkusuWidget.KEY_TOTAL, total == null ? 0 : total)
                .putInt(OkusuWidget.KEY_TAKEN, taken == null ? 0 : taken)
                .putString(OkusuWidget.KEY_MESSAGE, message == null ? "" : message)
                .apply();

        OkusuWidget.refreshAll(ctx);
        call.resolve();
    }

    @PluginMethod
    public void refresh(PluginCall call) {
        OkusuWidget.refreshAll(getContext());
        call.resolve();
    }
}
