import { useState, useRef, useCallback, useEffect } from "react";
import { Socket } from "socket.io-client";

const FPS = 5;
const QUALITY = 0.3;
const MAX_WIDTH = 640;
const WEBRTC_TIMEOUT = 5000;

const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useScreenShare(socket: Socket | null, userId: string, userName: string, otherUserId: string | null) {
  const [isSharing, setIsSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [frame, setFrame] = useState<string | null>(null);
  const [sharerId, setSharerId] = useState<string | null>(null);
  const [sharerName, setSharerName] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [transport, setTransport] = useState<"webrtc" | "socketio" | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const frameUrlRef = useRef<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const fallbackTimerRef = useRef<number>(0);
  const iceConnectedRef = useRef(false);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(fallbackTimerRef.current);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (frameUrlRef.current) {
      URL.revokeObjectURL(frameUrlRef.current);
      frameUrlRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const video = document.querySelector("video[data-screen-share]");
    if (video) video.remove();
    setIsSharing(false);
    setRemoteStream(null);
    setFrame(null);
    setLocalStream(null);
    setSharerId(null);
    setSharerName(null);
    setTransport(null);
    iceConnectedRef.current = false;
  }, []);

  const stopSharing = useCallback(() => {
    if (socket && otherUserId) {
      socket.emit("screen:end", { receiverId: otherUserId });
    }
    cleanup();
  }, [socket, otherUserId, cleanup]);

  const startSocketIOFallback = useCallback(() => {
    const stream = streamRef.current;
    const sock = socket;
    const targetId = otherUserId;
    if (!stream || !sock || !targetId) return;

    setTransport("socketio");
    const canvas = document.createElement("canvas");
    let stopped = false;

    const capture = () => {
      if (stopped) return;

      const track = stream.getVideoTracks()[0];
      if (!track || track.readyState === "ended") {
        stopSharing();
        return;
      }

      const videoEl = document.querySelector("video[data-screen-share]") as HTMLVideoElement;
      if (Date.now() - lastFrameRef.current >= 1000 / FPS && videoEl?.videoWidth) {
        const scale = Math.min(1, MAX_WIDTH / videoEl.videoWidth);
        canvas.width = Math.round(videoEl.videoWidth * scale);
        canvas.height = Math.round(videoEl.videoHeight * scale);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob && !stopped) {
              sock.emit("screen:frame", { receiverId: targetId, data: blob });
            }
          }, "image/jpeg", QUALITY);
        }
        lastFrameRef.current = Date.now();
      }
      rafRef.current = requestAnimationFrame(capture);
    };

    lastFrameRef.current = Date.now();
    rafRef.current = requestAnimationFrame(capture);

    stream.getVideoTracks()[0].onended = () => {
      stopped = true;
      stopSharing();
    };
  }, [socket, otherUserId, stopSharing]);

  const startSharing = useCallback(async () => {
    if (!socket || !otherUserId) return;
    try {
      cleanup();
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      setLocalStream(stream);

      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("data-screen-share", "");
      video.style.cssText = "position:fixed;opacity:0;pointer-events:none;z-index:-1";
      document.body.appendChild(video);
      video.play().catch(() => {});

      socket.emit("screen:offer", { receiverId: otherUserId, name: userName, sdp: null });
      setIsSharing(true);

      // Try WebRTC
      try {
        const pc = new RTCPeerConnection(STUN_SERVERS);
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("screen:ice-candidate", { receiverId: otherUserId, candidate: e.candidate });
          }
        };

        pc.ontrack = (e) => {
          setRemoteStream(e.streams[0]);
          setTransport("webrtc");
          iceConnectedRef.current = true;
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
            iceConnectedRef.current = true;
            setTransport("webrtc");
          }
          if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
            if (transport === "webrtc") {
              startSocketIOFallback();
            }
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("screen:offer", {
          receiverId: otherUserId,
          name: userName,
          sdp: { type: offer.type, sdp: offer.sdp },
        });

        // Fallback timer
        fallbackTimerRef.current = window.setTimeout(() => {
          if (!iceConnectedRef.current) {
            startSocketIOFallback();
          }
        }, WEBRTC_TIMEOUT);
      } catch {
        startSocketIOFallback();
      }

      stream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };
    } catch {
      // User cancelled
    }
  }, [socket, otherUserId, userName, cleanup, stopSharing, startSocketIOFallback, transport]);

  useEffect(() => {
    if (!socket) return;

    const handleOffer = async (data: { senderId: string; name?: string; sdp?: any }) => {
      if (data.sdp && data.sdp.type === "offer") {
        // WebRTC offer
        cleanup();
        setSharerId(data.senderId);
        setSharerName(data.name || null);

        try {
          const pc = new RTCPeerConnection(STUN_SERVERS);
          pcRef.current = pc;

          pc.onicecandidate = (e) => {
            if (e.candidate) {
              socket.emit("screen:ice-candidate", { receiverId: data.senderId, candidate: e.candidate });
            }
          };

          pc.ontrack = (e) => {
            setRemoteStream(e.streams[0]);
            setTransport("webrtc");
          };

          pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
              setTransport("webrtc");
            }
          };

          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("screen:answer", { receiverId: data.senderId, sdp: { type: answer.type, sdp: answer.sdp } });
        } catch {
          cleanup();
        }
      } else {
        // Socket.IO mode notification
        cleanup();
        setSharerId(data.senderId);
        setSharerName(data.name || null);
      }
    };

    const handleAnswer = async (data: { sdp: any }) => {
      const pc = pcRef.current;
      if (!pc || !data.sdp) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } catch {}
    };

    const handleIceCandidate = async (data: { candidate: any }) => {
      const pc = pcRef.current;
      if (!pc || !data.candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch {}
    };

    const handleFrame = (data: { data: ArrayBuffer }) => {
      if (frameUrlRef.current) {
        URL.revokeObjectURL(frameUrlRef.current);
      }
      const blob = new Blob([data.data], { type: "image/jpeg" });
      frameUrlRef.current = URL.createObjectURL(blob);
      setFrame(frameUrlRef.current);
    };

    const handleEnd = () => cleanup();

    socket.on("screen:offer", handleOffer);
    socket.on("screen:answer", handleAnswer);
    socket.on("screen:ice-candidate", handleIceCandidate);
    socket.on("screen:frame", handleFrame);
    socket.on("screen:end", handleEnd);

    return () => {
      socket.off("screen:offer", handleOffer);
      socket.off("screen:answer", handleAnswer);
      socket.off("screen:ice-candidate", handleIceCandidate);
      socket.off("screen:frame", handleFrame);
      socket.off("screen:end", handleEnd);
    };
  }, [socket, cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { isSharing, remoteStream, frame, localStream, sharerId, sharerName, transport, startSharing, stopSharing };
}
