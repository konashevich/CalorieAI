package com.calorieai.aacrecorder;

import android.media.MediaRecorder;
import org.apache.cordova.*;
import org.json.*;
import java.io.File;

public class AACRecorder extends CordovaPlugin {
    private MediaRecorder recorder; private String filePath; private long startedAt = 0L;
    @Override public boolean execute(String action, JSONArray args, CallbackContext cb) throws JSONException {
        switch (action) {
            case "hasPermission": cb.success(cordova.hasPermission(android.Manifest.permission.RECORD_AUDIO) ? 1 : 0); return true;
            case "requestPermission": if (cordova.hasPermission(android.Manifest.permission.RECORD_AUDIO)) { cb.success(1); } else { pending = cb; cordova.requestPermission(this, 1001, android.Manifest.permission.RECORD_AUDIO); } return true;
            case "start": start(cb); return true;
            case "stop": stop(cb); return true;
            case "isRecording": cb.success(recorder != null ? 1 : 0); return true;
        }
        return false;
    }
    private CallbackContext pending;
    @Override public void onRequestPermissionResult(int code, String[] p, int[] g) throws JSONException { if (code==1001 && pending!=null) { boolean ok = cordova.hasPermission(android.Manifest.permission.RECORD_AUDIO); pending.success(ok?1:0); pending=null; } }
    private void start(CallbackContext cb) {
        if (recorder!=null) { cb.error("alreadyRecording"); return; }
        if (!cordova.hasPermission(android.Manifest.permission.RECORD_AUDIO)) { cb.error("permissionDenied"); return; }
        try {
            File dir = cordova.getContext().getFilesDir(); File out = new File(dir, "calorieai_"+System.currentTimeMillis()+".aac");
            filePath = "file://"+out.getAbsolutePath();
            recorder = new MediaRecorder();
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            recorder.setOutputFormat(MediaRecorder.OutputFormat.AAC_ADTS);
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            recorder.setAudioChannels(1); recorder.setAudioSamplingRate(16000); recorder.setAudioEncodingBitRate(32000);
            recorder.setOutputFile(out.getAbsolutePath()); recorder.prepare(); recorder.start(); startedAt = System.currentTimeMillis();
            JSONObject res = new JSONObject(); res.put("started", true); res.put("filePath", filePath); res.put("mimeType", "audio/aac"); res.put("startedAt", startedAt); cb.success(res);
        } catch (Exception e) { cleanup(); cb.error("startFailure"); }
    }
    private void stop(CallbackContext cb) { if (recorder==null) { cb.error("notRecording"); return; } try { recorder.stop(); } catch (Exception ignored) {} cleanup(); try { File f=new File(filePath.replace("file://","")); long dur= startedAt>0? (System.currentTimeMillis()-startedAt):0; JSONObject res=new JSONObject(); res.put("filePath",filePath); res.put("mimeType","audio/aac"); res.put("durationMs",dur); res.put("sizeBytes", f.exists()? f.length():0); cb.success(res);} catch (JSONException e){ cb.error("ioFailure"); } }
    private void cleanup(){ try{ if(recorder!=null){ recorder.reset(); recorder.release(); } }catch(Exception ignored){} recorder=null; }
}
