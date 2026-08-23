import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff, 
  Volume2, VolumeX, Shield, User, Camera, SwitchCamera, Sparkles,
  Maximize2, Minimize2, AlertCircle
} from 'lucide-react';
import { doc, setDoc, onSnapshot, updateDoc, collection, addDoc, getDoc } from 'firebase/firestore';

export interface CallSession {
  id: string;
  type: 'voice' | 'video';
  status: 'dialing' | 'ringing' | 'connected' | 'ended' | 'declined';
  isIncoming: boolean;
  partnerUsername: string;
  partnerName: string;
  partnerAvatarSeed: string;
  partnerAvatarUrl?: string;
}

interface CallModalProps {
  session: CallSession;
  userUsername: string;
  userDisplayName: string;
  db: any; // Firestore instance
  isFirebaseConfigured: boolean;
  onEndCall: (duration: number, reason: string) => void;
  onAnswerCall: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  session,
  userUsername,
  userDisplayName,
  db,
  isFirebaseConfigured,
  onEndCall,
  onAnswerCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(session.type === 'voice');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [callDuration, setCallDuration] = useState(0);
  const [micVolume, setMicVolume] = useState(0);
  const [hasMediaError, setHasMediaError] = useState<string | null>(null);

  // Refs for media streams and elements
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioIntervalRef = useRef<any>(null);
  const remoteCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synthesized Sound Generator Refs
  const ringtoneIntervalRef = useRef<any>(null);
  const oscillatorSource1 = useRef<OscillatorNode | null>(null);
  const oscillatorSource2 = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Synthesize dialing/ringing tones so it works flawlessly offline without assets
  const startAudioTone = (mode: 'dialing' | 'ringing') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;
      gainNode.gain.setValueAtTime(0, ctx.currentTime);

      const playTone = () => {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);

        if (mode === 'dialing') {
          // Standard US Dial Tone: 350Hz + 440Hz
          osc1.frequency.setValueAtTime(350, ctx.currentTime);
          osc2.frequency.setValueAtTime(440, ctx.currentTime);
        } else {
          // Ringing Tone: 440Hz + 480Hz
          osc1.frequency.setValueAtTime(440, ctx.currentTime);
          osc2.frequency.setValueAtTime(480, ctx.currentTime);
        }

        osc1.start();
        osc2.start();

        oscillatorSource1.current = osc1;
        oscillatorSource2.current = osc2;

        // Fade in
        gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1);

        // Ring for 1.2s then fade out
        setTimeout(() => {
          try {
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
            setTimeout(() => {
              osc1.stop();
              osc2.stop();
            }, 300);
          } catch (e) {}
        }, 1200);
      };

      // Play immediately
      playTone();

      // Repeat ring cycle every 4 seconds
      ringtoneIntervalRef.current = setInterval(playTone, 4000);
    } catch (e) {
      console.warn("Audio tone synthesis error:", e);
    }
  };

  const stopAudioTone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    try {
      if (oscillatorSource1.current) {
        oscillatorSource1.current.stop();
        oscillatorSource1.current = null;
      }
      if (oscillatorSource2.current) {
        oscillatorSource2.current.stop();
        oscillatorSource2.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
    } catch (e) {}
  };

  // Capture user mic/camera stream
  const startLocalStream = async (overrideFacingMode?: 'user' | 'environment') => {
    try {
      setHasMediaError(null);
      const currentFacingMode = overrideFacingMode || facingMode;
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: session.type === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: currentFacingMode
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && session.type === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      // If we are switching cameras during a call, update the RTCPeerConnection sender
      if (overrideFacingMode && peerConnectionRef.current) {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      }

      // Voice level analyzer hook
      setupVoiceAnalyzer(stream);

      return stream;
    } catch (err: any) {
      console.error("Camera/Mic stream capture failed:", err);
      setHasMediaError(err.message || 'Permission denied or media hardware unavailable. Please verify browser settings.');
      
      // Safe fallback stream (empty fake track so UI doesn't freeze)
      try {
        const mockCanvas = document.createElement('canvas');
        mockCanvas.width = 160;
        mockCanvas.height = 120;
        const mockCtx = mockCanvas.getContext('2d');
        if (mockCtx) {
          mockCtx.fillStyle = '#171717';
          mockCtx.fillRect(0, 0, 160, 120);
        }
        const stream = (mockCanvas as any).captureStream ? (mockCanvas as any).captureStream() : new MediaStream();
        localStreamRef.current = stream;
        return stream;
      } catch (e) {
        return new MediaStream();
      }
    }
  };

  // Real-time Mic analyser using AudioContext API
  const setupVoiceAnalyzer = (stream: MediaStream) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      const audioCtx = new AudioCtxClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;

      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      audioAnalyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      audioIntervalRef.current = setInterval(() => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setMicVolume(Math.min(100, Math.floor((avg / 255) * 100)));
      }, 100);
    } catch (e) {
      console.warn("Analyser hook error:", e);
    }
  };

  // Render simulated companion canvas for interactive feedback if partner offline
  useEffect(() => {
    if (session.type === 'video' && remoteCanvasRef.current) {
      const canvas = remoteCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animId: number;
      let frame = 0;

      const draw = () => {
        frame++;
        ctx.fillStyle = '#0f172a'; // Deep slate
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw elegant particle animations
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
        
        // Dynamic circles
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60 + Math.sin(frame * 0.05) * 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 90 + Math.cos(frame * 0.03) * 12, 0, Math.PI * 2);
        ctx.stroke();

        // Waveform overlay
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let x = 0; x < canvas.width; x += 5) {
          const y = centerY + Math.sin(x * 0.03 + frame * 0.1) * 20 * Math.sin(frame * 0.02);
          ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Elegant indicator label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = 'bold 11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`Secure Live Sync Peer Node`, centerX, centerY + 140);

        animId = requestAnimationFrame(draw);
      };

      draw();
      return () => cancelAnimationFrame(animId);
    }
  }, [session.type, session.status]);

  // Handle call life cycle states
  useEffect(() => {
    // 1. Play sounds depending on state
    if (session.status === 'dialing') {
      startAudioTone('dialing');
    } else if (session.status === 'ringing') {
      startAudioTone('ringing');
    } else {
      stopAudioTone();
    }

    // 2. Start capturing local device camera
    (async () => {
      await startLocalStream();
    })();

    // 3. Setup call duration tracker
    let durationTimer: any = null;
    if (session.status === 'connected') {
      durationTimer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    let unsubscribeCallDoc: () => void = () => {};
    let unsubscribeCandidates: () => void = () => {};

    if (isFirebaseConfigured && db && session.id) {
      const callDocRef = doc(db, 'calls', session.id);
      
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      // Add local stream tracks to WebRTC
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Receive remote stream
      pc.ontrack = (event) => {
        console.log("Remote track received", event.streams[0]);
        if (remoteVideoRef.current) {
          // IMPORTANT: Set srcObject directly to the incoming stream
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Ice Candidates exchange
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateType = session.isIncoming ? 'calleeCandidates' : 'callerCandidates';
          const candidatesCollection = collection(callDocRef, candidateType);
          addDoc(candidatesCollection, event.candidate.toJSON()).catch(e => {
            console.warn("ICE candidate sync warning:", e);
          });
        }
      };

      // Create offer if caller
      if (!session.isIncoming && session.status === 'dialing') {
        pc.createOffer().then(offer => {
          pc.setLocalDescription(offer).then(() => {
            updateDoc(callDocRef, { offer: { type: offer.type, sdp: offer.sdp } });
          });
        });
      }

      unsubscribeCallDoc = onSnapshot(callDocRef, async (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        
        if (data.status === 'declined' || data.status === 'ended') {
          cleanupCall();
          onEndCall(callDuration, data.status);
        } else if (data.status === 'connected' && session.status !== 'connected') {
          onAnswerCall();
        }

        // Handle offer/answer
        if (session.isIncoming && data.offer && !pc.currentRemoteDescription) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await updateDoc(callDocRef, { answer: { type: answer.type, sdp: answer.sdp } });
          } catch (e) {
            console.warn("Failed handling offer:", e);
          }
        }

        if (!session.isIncoming && data.answer && !pc.currentRemoteDescription) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          } catch (e) {
            console.warn("Failed handling answer:", e);
          }
        }
      });

      // Subscribe to remote candidates
      const candidatesToListen = session.isIncoming ? 'callerCandidates' : 'calleeCandidates';
      const candidatesCollection = collection(callDocRef, candidatesToListen);
      unsubscribeCandidates = onSnapshot(candidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            try {
              const candidate = new RTCIceCandidate(change.doc.data());
              pc.addIceCandidate(candidate);
            } catch(e) {}
          }
        });
      });
    }

    return () => {
      stopAudioTone();
      clearInterval(durationTimer);
      unsubscribeCallDoc();
      unsubscribeCandidates();
      cleanupCall();
    };
  }, [session.status, session.id]);

  const cleanupCall = () => {
    stopAudioTone();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    try {
      if (audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        audioCtxRef.current = null;
        if (ctx.state !== 'closed') {
          ctx.close().catch(() => {});
        }
      }
    } catch (e) {}
  };

  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const handleToggleVideo = () => {
    if (localStreamRef.current && session.type === 'video') {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleSwitchCamera = async () => {
    if (session.type !== 'video') return;
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    
    // Stop current video track
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => track.stop());
    }
    
    // Request new stream
    await startLocalStream(nextMode);
  };

  // Format Duration seconds
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleHangUp = async () => {
    cleanupCall();
    
    // Update Firestore status to ended
    if (isFirebaseConfigured && db && session.id) {
      try {
        await updateDoc(doc(db, 'calls', session.id), {
          status: 'ended',
          ended_at: Date.now()
        });
      } catch (e) {
        console.warn("Failed to update call status on firestore:", e);
      }
    }
    
    onEndCall(callDuration, 'ended');
  };

  const handleAcceptIncoming = async () => {
    if (isFirebaseConfigured && db && session.id) {
      try {
        await updateDoc(doc(db, 'calls', session.id), {
          status: 'connected',
          answered_at: Date.now()
        });
      } catch (e) {
        console.warn("Firestore call update warning:", e);
      }
    }
    onAnswerCall();
  };

  const handleDeclineIncoming = async () => {
    cleanupCall();
    if (isFirebaseConfigured && db && session.id) {
      try {
        await updateDoc(doc(db, 'calls', session.id), {
          status: 'declined',
          ended_at: Date.now()
        });
      } catch (e) {
        console.warn("Firestore decline update warning:", e);
      }
    }
    onEndCall(0, 'declined');
  };

  // Avatar renderer helper
  const renderCallAvatar = (seed: string, initials: string, url?: string, sizeClass = 'h-24 w-24 text-2xl') => {
    if (url) {
      return (
        <img 
          src={url} 
          alt="Avatar" 
          referrerPolicy="no-referrer"
          className={`${sizeClass} rounded-full object-cover border-4 border-white/10 shadow-2xl`} 
        />
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-700 flex items-center justify-center font-bold text-white border-4 border-white/10 shadow-2xl relative overflow-hidden select-none`}>
        <img 
          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`} 
          alt="Avatar" 
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full p-2 scale-110 object-contain"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-neutral-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      
      {/* Top Banner Status Bar */}
      <div className="p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-50">
        <div className="flex items-center gap-2 text-xs font-bold bg-neutral-900/60 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">
          <Shield className="h-4 w-4 text-emerald-500" />
          <span className="text-[11px] tracking-wide text-neutral-300">Zenoa Encrypted Connection</span>
        </div>
        
        {session.status === 'connected' && (
          <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold font-mono text-xs rounded-full">
            {formatTime(callDuration)}
          </div>
        )}
      </div>

      {/* Main Calling / Stream Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center">
        {hasMediaError && (
          <div className="absolute top-20 max-w-sm mx-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-center z-50 flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6 text-rose-500" />
            <p className="text-xs font-bold text-rose-400">Media Stream Notice</p>
            <p className="text-[11px] text-neutral-300 leading-relaxed">{hasMediaError}</p>
          </div>
        )}

        {/* Video Mode Streams */}
        {session.type === 'video' ? (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-neutral-900">
            {/* Main Remote Video Stream Viewport */}
            <div className="absolute inset-0 w-full h-full">
              {session.status === 'connected' ? (
                <>
                  <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  {/* Local loopback canvas simulation overlays */}
                  <canvas 
                    ref={remoteCanvasRef} 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen pointer-events-none"
                    width={640}
                    height={480}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center space-y-4">
                  {renderCallAvatar(session.partnerAvatarSeed, session.partnerName[0], session.partnerAvatarUrl, 'h-28 w-28 text-3xl')}
                  <p className="text-sm font-bold text-neutral-400">Waiting for stream response...</p>
                </div>
              )}
            </div>

            {/* Small Floating Picture-in-Picture Local Camera View */}
            <AnimatePresence>
              {!isVideoOff && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-4 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black z-40"
                >
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover" 
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 rounded-md text-[9px] font-bold border border-white/5">
                    You
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Voice Mode Layout with Dynamic Oscillating Microphone Waveform */
          <div className="flex flex-col items-center justify-center space-y-8 z-10 p-6">
            
            {/* Pulsing Central Profile Circle */}
            <div className="relative">
              {session.status === 'connected' && (
                <div 
                  className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" 
                  style={{ animationDuration: '3s' }}
                />
              )}
              {renderCallAvatar(session.partnerAvatarSeed, session.partnerName[0], session.partnerAvatarUrl, 'h-32 w-32 text-4xl relative z-10')}
            </div>

            {/* Partner Details */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-extrabold tracking-wide">{session.partnerName}</h2>
              <p className="text-xs text-neutral-400 font-mono">@{session.partnerUsername}</p>
              
              <div className="pt-2">
                {session.status === 'dialing' && (
                  <span className="text-xs font-bold text-indigo-400 animate-pulse flex items-center justify-center gap-1.5">
                    Dialing secure line...
                  </span>
                )}
                {session.status === 'ringing' && (
                  <span className="text-xs font-bold text-emerald-400 animate-pulse flex items-center justify-center gap-1.5">
                    Line ringing...
                  </span>
                )}
                {session.status === 'connected' && (
                  <span className="text-xs font-bold text-neutral-400 flex items-center justify-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping mr-1" />
                    Connected • Safe End-to-End Encrypted
                  </span>
                )}
              </div>
            </div>

            {/* Microscopic real mic volume level visualizer waveform */}
            {session.status === 'connected' && (
              <div className="flex items-center gap-1.5 h-12 w-64 justify-center bg-neutral-900/40 border border-white/5 rounded-2xl px-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => {
                  const factor = Math.sin((i / 12) * Math.PI);
                  const dynamicHeight = Math.max(12, (micVolume * factor * 0.6) + Math.random() * 8);
                  return (
                    <div 
                      key={i} 
                      className="w-1 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-400 transition-all duration-75"
                      style={{ height: `${isMuted ? 4 : dynamicHeight}px` }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Command Center Control Bar */}
      <div className="p-8 bg-gradient-to-t from-black to-transparent z-50 flex flex-col items-center gap-6">
        
        {/* Incoming Call Dialog Controls overlay */}
        {session.isIncoming && session.status === 'ringing' ? (
          <div className="flex flex-col items-center gap-4 animate-bounce">
            <p className="text-xs font-bold text-emerald-400">Incoming Secure {session.type === 'video' ? 'Video' : 'Audio'} Call...</p>
            <div className="flex items-center gap-6">
              {/* Decline Button */}
              <button 
                onClick={handleDeclineIncoming}
                className="p-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-transform active:scale-90 shadow-xl cursor-pointer"
                title="Decline Call"
              >
                <PhoneOff className="h-6 w-6" />
              </button>

              {/* Accept Button */}
              <button 
                onClick={handleAcceptIncoming}
                className="p-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-transform active:scale-90 shadow-xl cursor-pointer"
                title="Answer Call"
              >
                <Phone className="h-6 w-6" />
              </button>
            </div>
          </div>
        ) : (
          /* Ongoing / Dialing Call Control buttons */
          <div className="flex items-center gap-4 sm:gap-6 bg-neutral-900/80 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-xl shadow-2xl">
            {/* Mute Mic button */}
            <button 
              onClick={handleToggleMute}
              className={`p-3.5 rounded-full transition-all cursor-pointer ${isMuted ? 'bg-rose-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'}`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* Video Toggle button (only in video mode) */}
            {session.type === 'video' && (
              <>
                <button 
                  onClick={handleToggleVideo}
                  className={`p-3.5 rounded-full transition-all cursor-pointer ${isVideoOff ? 'bg-rose-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'}`}
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </button>
                <button 
                  onClick={handleSwitchCamera}
                  className="p-3.5 rounded-full transition-all cursor-pointer bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  title="Switch Camera"
                >
                  <SwitchCamera className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Audio speaker trigger */}
            <button 
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3.5 rounded-full transition-all cursor-pointer ${isSpeakerOn ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'}`}
              title="Toggle Speakerphone"
            >
              {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>

            {/* Red End Call Button */}
            <button 
              onClick={handleHangUp}
              className="p-3.5 bg-rose-600 hover:bg-rose-700 hover:scale-105 text-white rounded-full transition-all active:scale-95 shadow-lg shadow-rose-600/30 cursor-pointer"
              title="End Call"
            >
              <PhoneOff className="h-5.5 w-5.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-medium">
          <Shield className="h-3 w-3" />
          <span>AES-GCM Secure Encrypted Direct Media Session</span>
        </div>
      </div>
    </div>
  );
};
