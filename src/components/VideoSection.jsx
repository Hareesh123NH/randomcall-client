export default function VideoSection({
  connecting,
  localVideo,
  remoteVideo,
  camOn,
  subtitle
}) {
  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center">

      {connecting && (
        <div className="absolute flex flex-col items-center gap-4 z-10">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-300">Connecting...</p>
        </div>
      )}

      <video
        ref={remoteVideo}
        autoPlay
        playsInline
        className="w-full h-full object-cover scale-x-[-1]"
      />

      <div className="absolute bottom-24 left-0 w-full flex justify-center px-4 pointer-events-none">
        <div className="bg-black/60 text-white px-4 py-2 rounded-lg max-w-2xl text-center text-lg font-medium">
          {subtitle}
        </div>
      </div>

      {/* Local preview */}
      <div className="absolute bottom-6 right-6 w-44 h-32 rounded-xl overflow-hidden border border-gray-600 bg-black">
        <video
          ref={localVideo}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
        {!camOn && (
          <div className="absolute inset-0 bg-black flex items-center justify-center text-sm">
            Camera Off
          </div>
        )}
      </div>
    </div>
  );
}