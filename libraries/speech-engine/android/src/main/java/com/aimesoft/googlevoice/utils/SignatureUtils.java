package com.aimesoft.googlevoice.utils;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.content.pm.SigningInfo;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.common.io.BaseEncoding;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;

public class SignatureUtils {

    @NonNull
    public static Map<String, String> calculateSignatureHeaders(@NonNull Context context, @NonNull String apiKey) {
        Map<String, String> headers = new HashMap<>(3);
        String packageName = apkPackageName(context);
        headers.put("X-Goog-Api-Key", apiKey);
        headers.put("X-Android-Package", packageName);
        try {
            String signature = apkSignatureString(context);
            headers.put("X-Android-Cert", signature);
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
        return headers;
    }

    @NonNull
    public static String apkPackageName(Context context) {
        return context.getApplicationContext().getPackageName();
    }

    @SuppressLint("PackageManagerGetSignatures")
    @Nullable
    private static Signature apkSignature(@NonNull Context context) throws PackageManager.NameNotFoundException {
        String packageName = apkPackageName(context);
        PackageManager pm = context.getApplicationContext().getPackageManager();
        if (pm == null) {
            return null;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            PackageInfo packageInfo = pm.getPackageInfo(packageName, PackageManager.GET_SIGNING_CERTIFICATES);
            if (packageInfo == null) {
                return null;
            }
            SigningInfo signingInfo = packageInfo.signingInfo;
            if (signingInfo == null) {
                return null;
            }
            Signature[] signatures = signingInfo.getSigningCertificateHistory();
            if (signatures != null && signatures.length > 0) {
                return signatures[0];
            }
            signatures = signingInfo.getApkContentsSigners();
            if (signatures != null && signatures.length > 0) {
                return signatures[0];
            }
        } else {
            PackageInfo packageInfo = pm.getPackageInfo(packageName, PackageManager.GET_SIGNATURES);
            if (packageInfo == null || packageInfo.signatures.length == 0) {
                return null;
            }
            return packageInfo.signatures[0];
        }
        return null;
    }

    @Nullable
    private static String apkSignatureString(@NonNull Context context) throws PackageManager.NameNotFoundException, NoSuchAlgorithmException {
        Signature signature = apkSignature(context);
        if (signature == null) {
            return null;
        }
        return signature2Digest(signature);
    }

    @NonNull
    private static String signature2Digest(@NonNull Signature signature) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA256");
        byte[] digest = md.digest(signature.toByteArray());
        return BaseEncoding.base16().lowerCase().encode(digest);
    }
}
