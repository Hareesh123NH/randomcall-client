import { VideoOff, User } from "lucide-react";
import { useState, useEffect } from "react";

export default function VideoSection({
  connecting,
  localVideo,
  remoteVideo,
  camOn,
  remoteSubtitle,
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
        <div className="absolute flex flex-col items-center gap-6 z-20">
          <div className="relative flex justify-center items-center">
            <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin shadow-[0_0_40px_rgba(99,102,241,0.5)]"></div>
            <div className="absolute w-12 h-12 border-4 border-purple-500/20 border-b-purple-400 rounded-full animate-spin-reverse"></div>
          </div>
          <p className="text-indigo-200 text-lg md:text-xl font-medium tracking-wide animate-pulse">Establishing Secure Connection...</p>
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
        <div className="absolute flex flex-col items-center gap-5 text-gray-400 z-10 transition-all duration-500 animate-in fade-in zoom-in">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
            <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping opacity-20"></div>
            <User size={48} className="text-indigo-300 opacity-60" />
          </div>
          <div className="flex items-center gap-3 text-sm md:text-base font-medium px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/5">
            <VideoOff size={18} className="text-rose-400" />
            Remote Video Paused
          </div>
        </div>
      )}

      {/* Remote person's subtitles — above main video */}
      {remoteSubtitle ? (
        <div className="absolute bottom-24 md:bottom-32 left-0 w-full flex justify-center px-4 pointer-events-none z-30 transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in">
          <div className="bg-black/60 backdrop-blur-xl border border-indigo-500/30 text-indigo-100 shadow-[0_0_30px_rgba(79,70,229,0.25)] px-5 py-3 md:px-8 md:py-4 rounded-2xl max-w-[90%] md:max-w-3xl text-center text-lg md:text-2xl tracking-wide font-medium">
            {remoteSubtitle}
          </div>
        </div>
      ) : null}

      {/* LOCAL PREVIEW */}
      <div className="absolute top-6 right-6 md:top-auto md:bottom-8 md:right-8 w-28 h-40 md:w-56 md:h-40 rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.4)] z-30 group hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
        <video
          ref={localVideo}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
            !camOn ? "opacity-0" : "opacity-100"
          }`}
        />

        {!camOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-indigo-300/60 bg-black/40 backdrop-blur-md transition-all duration-300">
            <VideoOff size={28} />
            <span className="text-xs font-semibold tracking-wider uppercase">Paused</span>
          </div>
        )}
      </div>
    </div>
  );
}