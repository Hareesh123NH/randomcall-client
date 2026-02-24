import { VideoOff, User } from "lucide-react";
import { useState, useEffect } from "react";

export default function VideoSection({
  connecting,
  localVideo,
  remoteVideo,
  camOn,
}) {
  const [remoteCamOn, setRemoteCamOn] = useState(true);

  useEffect(() => {
    const videoEl = remoteVideo.current;
    if (!videoEl) return;

    const handleTrackCheck = () => {
      const stream = videoEl.srcObject;
      if (!stream) {
        setRemoteCamOn(false);
        return;
      }

      const track = stream.getVideoTracks()[0];
      if (!track) {
        setRemoteCamOn(false);
        return;
      }

      // ✅ THIS is the correct detection
      setRemoteCamOn(track.enabled);
    };

    videoEl.onloadedmetadata = () => {
      handleTrackCheck();

      const stream = videoEl.srcObject;
      if (!stream) return;

      const track = stream.getVideoTracks()[0];
      if (!track) return;

      // Listen when remote toggles camera
      track.onended = handleTrackCheck;
      track.onmute = handleTrackCheck;
      track.onunmute = handleTrackCheck;

      // Small safety interval (lightweight)
      const interval = setInterval(handleTrackCheck, 800);

      return () => clearInterval(interval);
    };
  }, [remoteVideo]);

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center">
      {/* CONNECTING */}
      {connecting && (
        <div className="absolute flex flex-col items-center gap-4 z-20">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-300 text-lg font-medium">Connecting...</p>
        </div>
      )}

      {/* REMOTE VIDEO */}
      <video
        ref={remoteVideo}
        autoPlay
        playsInline
        className={`w-full h-full object-contain scale-x-[-1] ${
          !remoteCamOn ? "hidden" : ""
        }`}
      />

      {/* REMOTE CAMERA OFF UI */}
      {!remoteCamOn && !connecting && (
        <div className="absolute flex flex-col items-center gap-4 text-gray-400">
          <div className="w-24 h-24 rounded-full bg-[#1e293b] flex items-center justify-center shadow-lg">
            <User size={40} />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <VideoOff size={18} />
            Remote Camera Off
          </div>
        </div>
      )}

      {/* LOCAL PREVIEW */}
      <div className="absolute bottom-6 right-6 w-48 h-36 rounded-2xl overflow-hidden border border-gray-600 bg-[#0f172a] shadow-xl">
        <video
          ref={localVideo}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover scale-x-[-1] ${
            !camOn ? "hidden" : ""
          }`}
        />

        {!camOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300 bg-[#0f172a]">
            <VideoOff size={24} />
            <span className="text-xs">Camera Off</span>
          </div>
        )}
      </div>
    </div>
  );
}
