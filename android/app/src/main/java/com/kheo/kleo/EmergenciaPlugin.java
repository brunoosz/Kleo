package com.kheo.kleo;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.telephony.SmsManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;

@CapacitorPlugin(
    name = "Emergencia",
    permissions = {
        @Permission(alias = "sms", strings = { Manifest.permission.SEND_SMS }),
        @Permission(alias = "ligar", strings = { Manifest.permission.CALL_PHONE })
    }
)
public class EmergenciaPlugin extends Plugin {

    private JSObject estado() {
        JSObject r = new JSObject();
        r.put("sms", getPermissionState("sms") == PermissionState.GRANTED);
        r.put("ligar", getPermissionState("ligar") == PermissionState.GRANTED);
        return r;
    }

    @PluginMethod
    public void permissoes(PluginCall call) {
        call.resolve(estado());
    }

    @PluginMethod
    public void pedirPermissoes(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED && getPermissionState("ligar") == PermissionState.GRANTED) {
            call.resolve(estado());
            return;
        }
        requestAllPermissions(call, "depoisPermissoes");
    }

    @PermissionCallback
    private void depoisPermissoes(PluginCall call) {
        call.resolve(estado());
    }

    @SuppressWarnings("deprecation")
    private SmsManager gerenciador() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            SmsManager m = getContext().getSystemService(SmsManager.class);
            if (m != null) return m;
        }
        return SmsManager.getDefault();
    }

    @PluginMethod
    public void enviarSms(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            call.reject("sem_permissao");
            return;
        }
        JSArray numeros = call.getArray("numeros");
        String texto = call.getString("texto", "");
        if (numeros == null || numeros.length() == 0 || texto.isEmpty()) {
            call.reject("sem_dados");
            return;
        }
        SmsManager sms = gerenciador();
        ArrayList<String> partes = sms.divideMessage(texto);
        JSArray enviados = new JSArray();
        JSArray falhas = new JSArray();
        for (int i = 0; i < numeros.length(); i++) {
            String numero = numeros.optString(i, "");
            if (numero.isEmpty()) continue;
            try {
                if (partes.size() > 1) sms.sendMultipartTextMessage(numero, null, partes, null, null);
                else sms.sendTextMessage(numero, null, texto, null, null);
                enviados.put(numero);
            } catch (Exception e) {
                falhas.put(numero);
            }
        }
        JSObject r = new JSObject();
        r.put("enviados", enviados);
        r.put("falhas", falhas);
        call.resolve(r);
    }

    @PluginMethod
    public void ligar(PluginCall call) {
        String numero = call.getString("numero", "");
        if (numero.isEmpty()) {
            call.reject("sem_numero");
            return;
        }
        boolean direto = getPermissionState("ligar") == PermissionState.GRANTED;
        Intent intent = new Intent(direto ? Intent.ACTION_CALL : Intent.ACTION_DIAL, Uri.parse("tel:" + Uri.encode(numero)));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            Context ctx = getContext();
            ctx.startActivity(intent);
            JSObject r = new JSObject();
            r.put("direto", direto);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("falhou");
        }
    }
}
