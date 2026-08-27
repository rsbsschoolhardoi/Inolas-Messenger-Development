import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff, 
  Volume2, VolumeX, Shield, User, SwitchCamera, Sparkles,
  AlertCircle, Radio, Check, Activity
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
  startedAt?: number;
  startTimeStr?: string;
}

export interface CallEndMetadata {
  callId: string;
  callType: 'voice' | 'video';
  status: 'answered' | 'missed' | 'unanswered' | 'declined';
  startTime: string;
  endTime: string;
  durationSeconds: number;
  durationFormatted: string;
}

interface CallModalProps {
  session: CallSession;
  userUsername: string;
  userDisplayName: string;
  db: any; // Firestore instance
  isFirebaseConfigured: boolean;
  onEndCall: (meta: CallEndMetadata) => void;
  onAnswerCall: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

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
  const [remoteAudioVolume, setRemoteAudioVolume] = useState(0);
  const [hasMediaError, setHasMediaError] = useState<string | null>(null);
  const [isRemoteConnected, setIsRemoteConnected] = useState(session.status === 'connected');
  const [iceState, setIceState] = useState<string>('new');
  const [isSwapped, setIsSwapped] = useState(false); // WhatsApp-style tap to swap main/pip feeds

  // Track timestamps & refs
  const startTimeStrRef = useRef<string>(
    session.startTimeStr || new Date(session.startedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const wasConnectedRef = useRef<boolean>(session.status === 'connected');
  const durationTimerRef = useRef<any>(null);
  const callDurationRef = useRef<number>(0);

  // Stable Media Streams & Peer Connection Refs (Never swap DOM refs directly in JSX!)
  const mainVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const pipVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isPeerConnectionInitializedRef = useRef<boolean>(false);
  const isSettingRemoteDescriptionRef = useRef<boolean>(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Audio Analyzers
  const localAudioCtxRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAudioCtxRef = useRef<AudioContext | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioIntervalRef = useRef<any>(null);

  // Tone generation refs
  const ringtoneIntervalRef = useRef<any>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Keep duration ref in sync
  useEffect(() => {
    callDurationRef.current = callDuration;
  }, [callDuration]);

  // Synthesized tone generator for dialing / ringing
  const startAudioTone = useCallback((mode: 'dialing' | 'ringing') => {
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
          ctx.resume().catch(() => {});
        }

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);

        if (mode === 'dialing') {
          osc1.frequency.setValueAtTime(350, ctx.currentTime);
          osc2.frequency.setValueAtTime(440, ctx.currentTime);
        } else {
          osc1.frequency.setValueAtTime(440, ctx.currentTime);
          osc2.frequency.setValueAtTime(480, ctx.currentTime);
        }

        osc1.start();
        osc2.start();

        gainNode.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.1);

        setTimeout(() => {
          try {
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
            setTimeout(() => {
              osc1.stop();
              osc2.stop();
              osc1.disconnect();
              osc2.disconnect();
            }, 300);
          } catch (e) {}
        }, 1200);
      };

      playTone();
      ringtoneIntervalRef.current = setInterval(playTone, 3800);
    } catch (e) {
      console.warn("Audio tone generation warning:", e);
    }
  }, []);

  const stopAudioTone = useCallback(() => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    try {
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
    } catch (e) {}
  }, []);

  // Voice level analyzer for local & remote audio
  const setupVoiceAnalyzer = (localStream: MediaStream, remoteStream?: MediaStream) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      // Local analyzer
      if (localStream.getAudioTracks().length > 0 && !localAudioCtxRef.current) {
        const localCtx = new AudioCtxClass();
        const localSrc = localCtx.createMediaStreamSource(localStream);
        const localAnalyser = localCtx.createAnalyser();
        localAnalyser.fftSize = 32;
        localSrc.connect(localAnalyser);
        localAudioCtxRef.current = localCtx;
        localAnalyserRef.current = localAnalyser;
      }

      // Remote analyzer
      if (remoteStream && remoteStream.getAudioTracks().length > 0 && !remoteAudioCtxRef.current) {
        const remoteCtx = new AudioCtxClass();
        const remoteSrc = remoteCtx.createMediaStreamSource(remoteStream);
        const remoteAnalyser = remoteCtx.createAnalyser();
        remoteAnalyser.fftSize = 32;
        remoteSrc.connect(remoteAnalyser);
        remoteAudioCtxRef.current = remoteCtx;
        remoteAnalyserRef.current = remoteAnalyser;
      }

      if (!audioIntervalRef.current) {
        audioIntervalRef.current = setInterval(() => {
          if (localAnalyserRef.current) {
            const data = new Uint8Array(localAnalyserRef.current.frequencyBinCount);
            localAnalyserRef.current.getByteFrequencyData(data);
            const sum = data.reduce((acc, val) => acc + val, 0);
            const avg = sum / data.length;
            setMicVolume(Math.min(100, Math.floor((avg / 255) * 100)));
          }
          if (remoteAnalyserRef.current) {
            const data = new Uint8Array(remoteAnalyserRef.current.frequencyBinCount);
            remoteAnalyserRef.current.getByteFrequencyData(data);
            const sum = data.reduce((acc, val) => acc + val, 0);
            const avg = sum / data.length;
            setRemoteAudioVolume(Math.min(100, Math.floor((avg / 255) * 100)));
          }
        }, 100);
      }
    } catch (e) {
      console.warn("Audio analyser hook notice:", e);
    }
  };

  // High Quality Stream Capture with graceful fallback
  const getLocalMediaStream = async (targetFacingMode: 'user' | 'environment'): Promise<MediaStream> => {
    const isVideo = session.type === 'video';
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 2,
        sampleRate: 48000
      },
      video: isVideo ? {
        facingMode: targetFacingMode,
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30, min: 20 }
      } : false
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setHasMediaError(null);
      return stream;
    } catch (err: any) {
      console.warn("High-quality media capture failed, attempting standard constraints:", err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideo ? { facingMode: targetFacingMode } : false
        });
        setHasMediaError(null);
        return fallbackStream;
      } catch (fallbackErr: any) {
        console.error("Microphone/Camera permission error:", fallbackErr);
        setHasMediaError(fallbackErr.message || "Microphone/Camera permission is required for live voice and video.");
        
        // Generate a silent audio track fallback to prevent RTCPeerConnection initialization failure
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const dummyCtx = new AudioContextClass();
          const osc = dummyCtx.createOscillator();
          const gain = dummyCtx.createGain();
          gain.gain.value = 0; // Silent
          osc.connect(gain);
          const dst = gain.connect(dummyCtx.createMediaStreamDestination()) as any;
          osc.start();
          return dst.stream;
        } catch {
          return new MediaStream();
        }
      }
    }
  };

  // Attach streams to current video/audio DOM elements
  const attachStreamsToElements = useCallback(() => {
    const isVideo = session.type === 'video';
    const localStream = localStreamRef.current;
    const remoteStream = remoteStreamRef.current;

    if (isVideo) {
      // Main video element stream & PiP video element stream
      const mainStream = isSwapped ? localStream : (remoteStream && remoteStream.getVideoTracks().length > 0 ? remoteStream : null);
      const pipStream = isSwapped ? (remoteStream && remoteStream.getVideoTracks().length > 0 ? remoteStream : null) : localStream;

      if (mainVideoElementRef.current) {
        if (mainStream && mainVideoElementRef.current.srcObject !== mainStream) {
          mainVideoElementRef.current.srcObject = mainStream;
          mainVideoElementRef.current.play().catch(() => {});
        } else if (!mainStream && mainVideoElementRef.current.srcObject !== null) {
          mainVideoElementRef.current.srcObject = null;
        }
      }

      if (pipVideoElementRef.current) {
        if (pipStream && pipVideoElementRef.current.srcObject !== pipStream) {
          pipVideoElementRef.current.srcObject = pipStream;
          pipVideoElementRef.current.play().catch(() => {});
        } else if (!pipStream && pipVideoElementRef.current.srcObject !== null) {
          pipVideoElementRef.current.srcObject = null;
        }
      }

      // Ensure remote audio track plays if present
      if (remoteAudioRef.current && remoteStream && remoteStream.getAudioTracks().length > 0) {
        if (remoteAudioRef.current.srcObject !== remoteStream) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(() => {});
        }
      }
    } else {
      // Voice mode: Remote Audio element handles remote sound
      if (remoteAudioRef.current && remoteStream && remoteStream.getAudioTracks().length > 0) {
        if (remoteAudioRef.current.srcObject !== remoteStream) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(() => {});
        }
      }
    }
  }, [isSwapped, session.type]);

  // Re-attach streams whenever swap state or connection changes
  useEffect(() => {
    attachStreamsToElements();
  }, [isSwapped, isRemoteConnected, session.status, attachStreamsToElements]);

  // Add queued ICE candidates once remote description is set
  const processPendingCandidates = async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription || !pc.remoteDescription.type) return;
    const candidates = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];
    for (const candidate of candidates) {
      if (candidate && candidate.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Flushed queued ICE candidate successfully");
        } catch (e) {
          console.warn("Error adding queued ICE candidate:", e);
        }
      }
    }
  };

  // Safe helper to add candidate immediately or buffer if remote description not yet set
  const addOrBufferCandidate = async (pc: RTCPeerConnection, candidateData: any) => {
    if (!candidateData || !candidateData.candidate) return;
    if (pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidateData));
      } catch (err) {
        console.warn("ICE candidate add notice:", err);
      }
    } else {
      pendingCandidatesRef.current.push(candidateData);
    }
  };

  // Cleanup helper
  const cleanupCall = useCallback(() => {
    stopAudioTone();
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.close();
      broadcastChannelRef.current = null;
    }
    try {
      if (localAudioCtxRef.current && localAudioCtxRef.current.state !== 'closed') {
        localAudioCtxRef.current.close().catch(() => {});
        localAudioCtxRef.current = null;
      }
      if (remoteAudioCtxRef.current && remoteAudioCtxRef.current.state !== 'closed') {
        remoteAudioCtxRef.current.close().catch(() => {});
        remoteAudioCtxRef.current = null;
      }
    } catch (e) {}
  }, [stopAudioTone]);

  // Main WebRTC Lifecycle & Firestore + BroadcastChannel Signaling Engine
  useEffect(() => {
    let isCancelled = false;
    let unsubscribeCallDoc: () => void = () => {};
    let unsubscribeCandidates: () => void = () => {};

    // Tone feedback
    if (session.status === 'dialing') {
      startAudioTone('dialing');
    } else if (session.status === 'ringing') {
      startAudioTone('ringing');
    } else {
      stopAudioTone();
    }

    // Call duration timer
    if (session.status === 'connected' || isRemoteConnected) {
      wasConnectedRef.current = true;
      if (!durationTimerRef.current) {
        durationTimerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      }
    }

    // Initialize BroadcastChannel for ultra-fast local multi-tab signaling accelerator
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(`zenoa_call_${session.id}`);
        broadcastChannelRef.current = channel;
      }
    } catch (bcErr) {
      console.warn("BroadcastChannel not supported in current environment:", bcErr);
    }

    const initWebRTC = async () => {
      if (isPeerConnectionInitializedRef.current && peerConnectionRef.current) {
        return;
      }
      isPeerConnectionInitializedRef.current = true;

      const callDocRef = (isFirebaseConfigured && db && session.id) ? doc(db, 'calls', session.id) : null;

      // 1. Acquire Local Media Stream
      const localStream = await getLocalMediaStream(facingMode);
      if (isCancelled) {
        localStream.getTracks().forEach(t => t.stop());
        return;
      }
      localStreamRef.current = localStream;

      // Attach to preview immediately
      attachStreamsToElements();
      setupVoiceAnalyzer(localStream);

      // 2. Initialize RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // 3. Add all local media tracks to peer connection
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // 4. Handle incoming remote media tracks
      pc.ontrack = (event) => {
        console.log("WebRTC ontrack event received:", event.track.kind, event.streams);
        let remoteStream = remoteStreamRef.current;
        if (!remoteStream) {
          remoteStream = new MediaStream();
          remoteStreamRef.current = remoteStream;
        }

        // Add track to remoteStream if not already included
        if (!remoteStream.getTracks().some(t => t.id === event.track.id)) {
          remoteStream.addTrack(event.track);
        }

        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach(t => {
            if (!remoteStream!.getTracks().some(existing => existing.id === t.id)) {
              remoteStream!.addTrack(t);
            }
          });
        }

        // Bind streams to audio and video elements
        attachStreamsToElements();
        setupVoiceAnalyzer(localStream, remoteStream);

        setIsRemoteConnected(true);
        wasConnectedRef.current = true;
        stopAudioTone();
      };

      // 5. ICE Connection & Signaling State Monitoring
      pc.oniceconnectionstatechange = () => {
        console.log("ICE Connection State changed:", pc.iceConnectionState);
        setIceState(pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setIsRemoteConnected(true);
          wasConnectedRef.current = true;
          stopAudioTone();
          attachStreamsToElements();
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("Peer Connection State changed:", pc.connectionState);
        if (pc.connectionState === 'connected') {
          setIsRemoteConnected(true);
          wasConnectedRef.current = true;
          stopAudioTone();
          attachStreamsToElements();
        }
      };

      // 6. Handle local ICE candidates and dispatch to Firestore & BroadcastChannel
      pc.onicecandidate = (event) => {
        if (event.candidate && session.id) {
          const candidateData = event.candidate.toJSON();
          const candidateType = session.isIncoming ? 'calleeCandidates' : 'callerCandidates';
          
          // Dispatch via Firestore
          if (callDocRef) {
            const candidatesCol = collection(callDocRef, candidateType);
            addDoc(candidatesCol, candidateData).catch(e => console.warn("ICE candidate push notice:", e));
          }

          // Dispatch via local BroadcastChannel accelerator
          if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({
              type: 'ice-candidate',
              senderRole: session.isIncoming ? 'callee' : 'caller',
              candidate: candidateData
            });
          }
        }
      };

      // 7. Caller Flow: Create and push Offer
      if (!session.isIncoming) {
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: session.type === 'video'
          });
          await pc.setLocalDescription(offer);

          if (callDocRef) {
            await updateDoc(callDocRef, {
              offer: { type: offer.type, sdp: offer.sdp },
              status: 'dialing',
              created_at: session.startedAt || Date.now()
            });
          }

          if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({
              type: 'offer',
              offer: { type: offer.type, sdp: offer.sdp }
            });
          }
        } catch (offerErr) {
          console.error("Failed to create WebRTC offer:", offerErr);
        }
      }

      // 8. Callee Flow: If answered, handle existing offer or prepare answer
      if (session.isIncoming && (session.status === 'connected' || isRemoteConnected)) {
        if (callDocRef && !isSettingRemoteDescriptionRef.current) {
          try {
            const snap = await getDoc(callDocRef);
            if (snap.exists()) {
              const callData = snap.data();
              if (callData.offer && !pc.currentRemoteDescription && !isSettingRemoteDescriptionRef.current) {
                isSettingRemoteDescriptionRef.current = true;
                await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
                await processPendingCandidates(pc);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                await updateDoc(callDocRef, {
                  answer: { type: answer.type, sdp: answer.sdp },
                  status: 'connected',
                  answered_at: Date.now()
                });
                isSettingRemoteDescriptionRef.current = false;

                if (broadcastChannelRef.current) {
                  broadcastChannelRef.current.postMessage({
                    type: 'answer',
                    answer: { type: answer.type, sdp: answer.sdp }
                  });
                }
              }
            }
          } catch (calleeInitErr) {
            isSettingRemoteDescriptionRef.current = false;
            console.error("Callee answer initialization error:", calleeInitErr);
          }
        }
      }

      // 9. Listen to BroadcastChannel events
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.onmessage = async (e) => {
          const msg = e.data;
          if (!msg || !pc) return;

          if (msg.type === 'offer' && session.isIncoming && !pc.currentRemoteDescription && !isSettingRemoteDescriptionRef.current) {
            try {
              isSettingRemoteDescriptionRef.current = true;
              await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
              await processPendingCandidates(pc);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              isSettingRemoteDescriptionRef.current = false;
              if (broadcastChannelRef.current) {
                broadcastChannelRef.current.postMessage({
                  type: 'answer',
                  answer: { type: answer.type, sdp: answer.sdp }
                });
              }
            } catch (err) {
              isSettingRemoteDescriptionRef.current = false;
              console.warn("BC Offer handle notice:", err);
            }
          } else if (msg.type === 'answer' && !session.isIncoming && !pc.currentRemoteDescription && !isSettingRemoteDescriptionRef.current) {
            try {
              isSettingRemoteDescriptionRef.current = true;
              await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
              await processPendingCandidates(pc);
              isSettingRemoteDescriptionRef.current = false;
              setIsRemoteConnected(true);
              wasConnectedRef.current = true;
              stopAudioTone();
            } catch (err) {
              isSettingRemoteDescriptionRef.current = false;
              console.warn("BC Answer handle notice:", err);
            }
          } else if (msg.type === 'ice-candidate') {
            const expectedRole = session.isIncoming ? 'caller' : 'callee';
            if (msg.senderRole === expectedRole && msg.candidate) {
              addOrBufferCandidate(pc, msg.candidate);
            }
          }
        };
      }

      // 10. Subscribe to Firestore Call Document updates
      if (callDocRef) {
        unsubscribeCallDoc = onSnapshot(
          callDocRef,
          async (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();

            // Handle remote hang up or decline
            if (data.status === 'declined' || data.status === 'ended') {
              handleCallEndedRemotely(data.status);
              return;
            }

            // Caller detects Callee answered
            if (!session.isIncoming && data.status === 'connected') {
              setIsRemoteConnected(true);
              wasConnectedRef.current = true;
              stopAudioTone();
              if (session.status !== 'connected') {
                onAnswerCall();
              }
            }

            // Callee receives caller's offer
            if (session.isIncoming && data.offer && !pc.currentRemoteDescription && !isSettingRemoteDescriptionRef.current && (session.status === 'connected' || isRemoteConnected)) {
              try {
                isSettingRemoteDescriptionRef.current = true;
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                await processPendingCandidates(pc);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                await updateDoc(callDocRef, {
                  answer: { type: answer.type, sdp: answer.sdp },
                  status: 'connected',
                  answered_at: Date.now()
                });
                isSettingRemoteDescriptionRef.current = false;
              } catch (e) {
                isSettingRemoteDescriptionRef.current = false;
                console.warn("Offer handling notice:", e);
              }
            }

            // Caller receives callee's answer
            if (!session.isIncoming && data.answer && !pc.currentRemoteDescription && !isSettingRemoteDescriptionRef.current) {
              try {
                isSettingRemoteDescriptionRef.current = true;
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                await processPendingCandidates(pc);
                isSettingRemoteDescriptionRef.current = false;
                setIsRemoteConnected(true);
                wasConnectedRef.current = true;
                stopAudioTone();
              } catch (e) {
                isSettingRemoteDescriptionRef.current = false;
                console.warn("Answer handling notice:", e);
              }
            }
          },
          (err) => {
            console.warn("Call document listener notice:", err.message);
          }
        );

        // 11. Subscribe to Remote ICE Candidates from subcollection
        const candidatesToListen = session.isIncoming ? 'callerCandidates' : 'calleeCandidates';
        const candidatesCollection = collection(callDocRef, candidatesToListen);
        unsubscribeCandidates = onSnapshot(
          candidatesCollection,
          (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
              if (change.type === 'added') {
                const candidateData = change.doc.data();
                if (candidateData) {
                  addOrBufferCandidate(pc, candidateData);
                }
              }
            });
          },
          (err) => {
            console.warn("Call candidates listener notice:", err.message);
          }
        );
      }
    };

    // If caller or answering incoming call, run WebRTC initialization
    if (!session.isIncoming || session.status === 'connected') {
      initWebRTC();
    }

    return () => {
      isCancelled = true;
      stopAudioTone();
      unsubscribeCallDoc();
      unsubscribeCandidates();
      cleanupCall();
      isPeerConnectionInitializedRef.current = false;
      isSettingRemoteDescriptionRef.current = false;
    };
  }, [session.status, session.id, session.isIncoming, isRemoteConnected]);

  // Format Duration string MM:SS or HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper when remote ends call
  const handleCallEndedRemotely = (status: 'ended' | 'declined') => {
    const endTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const finalDuration = callDurationRef.current;
    const wasConnected = wasConnectedRef.current || isRemoteConnected || session.status === 'connected';
    
    let finalStatus: 'answered' | 'missed' | 'unanswered' | 'declined';
    if (wasConnected) {
      finalStatus = 'answered';
    } else {
      finalStatus = session.isIncoming ? 'missed' : (status === 'declined' ? 'declined' : 'unanswered');
    }

    cleanupCall();
    onEndCall({
      callId: session.id,
      callType: session.type,
      status: finalStatus,
      startTime: startTimeStrRef.current,
      endTime: endTimeStr,
      durationSeconds: finalDuration,
      durationFormatted: formatTime(finalDuration)
    });
  };

  // User manually clicks Hang Up
  const handleHangUp = async () => {
    const endTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const finalDuration = callDurationRef.current;
    const wasConnected = wasConnectedRef.current || isRemoteConnected || session.status === 'connected';
    
    let finalStatus: 'answered' | 'missed' | 'unanswered' | 'declined';
    if (wasConnected) {
      finalStatus = 'answered';
    } else {
      finalStatus = session.isIncoming ? 'declined' : 'unanswered';
    }

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'hangup' });
    }

    cleanupCall();

    if (isFirebaseConfigured && db && session.id) {
      try {
        await updateDoc(doc(db, 'calls', session.id), {
          status: wasConnected ? 'answered' : (session.isIncoming ? 'declined' : 'unanswered'),
          ended_at: Date.now(),
          duration: finalDuration,
          duration_seconds: finalDuration,
          duration_formatted: formatTime(finalDuration),
          end_time_str: endTimeStr
        });
      } catch (e) {
        console.warn("Firestore call termination update notice:", e);
      }
    }

    onEndCall({
      callId: session.id,
      callType: session.type,
      status: finalStatus,
      startTime: startTimeStrRef.current,
      endTime: endTimeStr,
      durationSeconds: finalDuration,
      durationFormatted: formatTime(finalDuration)
    });
  };

  // Callee clicks "Answer"
  const handleAcceptIncoming = async () => {
    stopAudioTone();
    wasConnectedRef.current = true;
    setIsRemoteConnected(true);

    if (isFirebaseConfigured && db && session.id) {
      try {
        await updateDoc(doc(db, 'calls', session.id), {
          status: 'connected',
          answered_at: Date.now()
        });
      } catch (e) {
        console.warn("Firestore accept call update notice:", e);
      }
    }
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'accept' });
    }
    onAnswerCall();
  };

  // Callee clicks "Decline"
  const handleDeclineIncoming = async () => {
    const endTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    cleanupCall();

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'decline' });
    }

    if (isFirebaseConfigured && db && session.id) {
      try {
        await updateDoc(doc(db, 'calls', session.id), {
          status: 'declined',
          ended_at: Date.now(),
          duration: 0,
          duration_seconds: 0,
          duration_formatted: '00:00',
          end_time_str: endTimeStr
        });
      } catch (e) {
        console.warn("Firestore decline call update notice:", e);
      }
    }

    onEndCall({
      callId: session.id,
      callType: session.type,
      status: 'missed',
      startTime: startTimeStrRef.current,
      endTime: endTimeStr,
      durationSeconds: 0,
      durationFormatted: '00:00'
    });
  };

  // Toggle Microphone
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !isMuted;
        audioTracks.forEach(t => { t.enabled = !nextState; });
        setIsMuted(nextState);
      }
    }
  };

  // Toggle Camera
  const handleToggleVideo = () => {
    if (localStreamRef.current && session.type === 'video') {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !isVideoOff;
        videoTracks.forEach(t => { t.enabled = !nextState; });
        setIsVideoOff(nextState);
      }
    }
  };

  // Switch Camera: Front ('user') <-> Rear ('environment')
  const handleSwitchCamera = async () => {
    if (session.type !== 'video') return;
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);

    try {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(t => t.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: nextMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 20 }
        }
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(t => localStreamRef.current!.removeTrack(t));
        localStreamRef.current.addTrack(newVideoTrack);
      }

      attachStreamsToElements();

      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }
    } catch (err) {
      console.warn("Camera switch notice:", err);
    }
  };

  // Avatar Renderer Helper - Professional Initials or User Photo (No cartoon emojis)
  const renderCallAvatar = (seed: string, initials: string, url?: string, sizeClass = 'h-28 w-28 text-3xl') => {
    if (url && url.trim().length > 5) {
      return (
        <img 
          src={url} 
          alt={initials || 'User Avatar'} 
          referrerPolicy="no-referrer"
          className={`${sizeClass} rounded-full object-cover border-4 border-white/20 shadow-2xl bg-neutral-900`} 
        />
      );
    }
    
    const raw = (initials || seed || 'User').trim();
    const cleanLetters = raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'U';

    const gradients = [
      'from-indigo-600 via-indigo-700 to-violet-800',
      'from-violet-600 via-purple-700 to-fuchsia-800',
      'from-rose-600 via-pink-700 to-red-800',
      'from-emerald-600 via-teal-700 to-cyan-800',
      'from-sky-600 via-blue-700 to-indigo-800'
    ];
    let hash = 0;
    for (let i = 0; i < raw.length; i++) hash += raw.charCodeAt(i);
    const grad = gradients[hash % gradients.length];

    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-tr ${grad} flex items-center justify-center font-black text-white border-4 border-white/20 shadow-2xl relative overflow-hidden select-none tracking-wider`}>
        <span>{cleanLetters}</span>
      </div>
    );
  };

  const isConnected = session.status === 'connected' || isRemoteConnected;

  return (
    <div 
      id="call_modal_root"
      className="fixed inset-0 z-[9999] bg-neutral-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* Remote Audio output (handles high fidelity sound for both Voice & Video calls) */}
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline 
        muted={!isSpeakerOn}
        className="hidden" 
      />

      {/* Prominent Zenoa Top Header Bar */}
      <div className="p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-black tracking-widest text-white uppercase font-sans drop-shadow-md">
            Zenoa
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 backdrop-blur-sm border border-white/10">
            {session.type === 'video' ? 'HD Video' : 'HD Voice'}
          </span>
        </div>
        
        <AnimatePresence mode="wait">
          {isConnected ? (
            <motion.div 
              key="connected-badge"
              initial={{ opacity: 0, scale: 0.8, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold font-mono text-xs sm:text-sm rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{formatTime(callDuration)}</span>
            </motion.div>
          ) : (
            <motion.div 
              key="connecting-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/25 text-amber-400 font-semibold text-xs rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse"
            >
              <Radio className="h-3.5 w-3.5 animate-spin" />
              <span>{session.isIncoming ? 'Incoming...' : 'Connecting...'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Stream / Center Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
        {hasMediaError && (
          <div className="absolute top-6 max-w-sm mx-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl p-4 text-center z-50 flex flex-col items-center gap-2 backdrop-blur-md">
            <AlertCircle className="h-6 w-6 text-rose-400" />
            <p className="text-xs font-bold text-rose-300">Media Device Notice</p>
            <p className="text-[11px] text-neutral-200 leading-relaxed">{hasMediaError}</p>
          </div>
        )}

        {/* Video Mode Layout */}
        {session.type === 'video' ? (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-neutral-950">
            
            {/* 1. Main View (Full Screen Video Feed) */}
            <div className="absolute inset-0 w-full h-full bg-neutral-900 flex items-center justify-center">
              <video 
                ref={mainVideoElementRef} 
                autoPlay 
                playsInline 
                muted={isSwapped} // mute if showing local camera in main view to avoid feedback loop
                className="w-full h-full object-cover"
                style={{ transform: isSwapped && facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />

              {/* Placeholder when remote stream is dialing / connecting */}
              <AnimatePresence>
                {!isConnected && !isSwapped && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.4 } }}
                    className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center space-y-6 p-6 z-20"
                  >
                    {/* Connecting Multi-Layer Ripples */}
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-48 h-48 rounded-full bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 blur-2xl animate-pulse" />
                      
                      <motion.div
                        animate={{ scale: [1, 1.8, 2.3], opacity: [0.7, 0.35, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0 }}
                        className="absolute inset-0 rounded-full border border-indigo-500/40 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.8, 2.3], opacity: [0.7, 0.35, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
                        className="absolute inset-0 rounded-full border border-violet-500/35 bg-violet-500/10 shadow-[0_0_25px_rgba(139,92,246,0.15)]"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.8, 2.3], opacity: [0.7, 0.35, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 1.6 }}
                        className="absolute inset-0 rounded-full border border-pink-500/30 bg-pink-500/5 shadow-[0_0_30px_rgba(236,72,153,0.1)]"
                      />
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-3 rounded-full border border-dashed border-indigo-400/30"
                      />

                      <div className="relative z-10">
                        {renderCallAvatar(session.partnerAvatarSeed, session.partnerName[0], session.partnerAvatarUrl, 'h-28 w-28 text-3xl')}
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <h3 className="text-xl font-bold tracking-tight">{session.partnerName}</h3>
                      <p className="text-xs text-neutral-400 font-mono">@{session.partnerUsername}</p>
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-semibold text-indigo-300 animate-pulse backdrop-blur-md">
                          <Radio className="h-3.5 w-3.5 animate-spin" />
                          <span>{session.isIncoming ? 'Incoming Video Call...' : 'Establishing encrypted video stream...'}</span>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Floating Picture-in-Picture Frame (Tap to Swap View) */}
            <AnimatePresence>
              {(!isVideoOff || isSwapped) && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setIsSwapped(!isSwapped)}
                  className="absolute top-4 right-4 w-28 h-40 sm:w-36 sm:h-52 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-neutral-900 z-40 cursor-pointer hover:border-white/40 transition-all active:scale-95"
                  title="Tap to swap main and mini camera view"
                >
                  <video 
                    ref={pipVideoElementRef} 
                    autoPlay 
                    muted={!isSwapped} // mute local camera when in PiP
                    playsInline 
                    className="w-full h-full object-cover pointer-events-none" 
                    style={{ transform: !isSwapped && facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                  <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white/90">
                    {isSwapped ? 'Remote' : 'You'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Voice Mode Layout */
          <div className="flex flex-col items-center justify-center space-y-8 z-10 p-6 max-w-sm text-center">
            
            {/* Pulsing Avatar with Seamless Transition Ripples */}
            <div className="relative flex items-center justify-center">
              <AnimatePresence mode="wait">
                {!isConnected ? (
                  <motion.div 
                    key="voice-connecting-ripples"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2, transition: { duration: 0.4 } }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    {/* Ambient Glow */}
                    <div className="absolute w-52 h-52 rounded-full bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 blur-2xl animate-pulse" />

                    {/* Ripple Ring 1 */}
                    <motion.div
                      animate={{ scale: [1, 1.85, 2.4], opacity: [0.75, 0.35, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0 }}
                      className="absolute inset-0 rounded-full border border-indigo-500/40 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                    />

                    {/* Ripple Ring 2 */}
                    <motion.div
                      animate={{ scale: [1, 1.85, 2.4], opacity: [0.75, 0.35, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
                      className="absolute inset-0 rounded-full border border-violet-500/35 bg-violet-500/10 shadow-[0_0_25px_rgba(139,92,246,0.15)]"
                    />

                    {/* Ripple Ring 3 */}
                    <motion.div
                      animate={{ scale: [1, 1.85, 2.4], opacity: [0.75, 0.35, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 1.6 }}
                      className="absolute inset-0 rounded-full border border-pink-500/30 bg-pink-500/5 shadow-[0_0_30px_rgba(236,72,153,0.1)]"
                    />

                    {/* Rotating Dashed Radar Orbit */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-4 rounded-full border border-dashed border-indigo-400/30"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="voice-connected-halo"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    {/* Connected Ambient Glow */}
                    <div className="absolute w-48 h-48 rounded-full bg-emerald-500/20 blur-2xl animate-pulse" />
                    
                    {/* Breathing Emerald Ring */}
                    <motion.div
                      animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0.65, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full border-2 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_35px_rgba(16,185,129,0.25)]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Avatar Center */}
              <motion.div 
                animate={isConnected ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                transition={{ duration: 2.5, repeat: isConnected ? Infinity : 0, ease: 'easeInOut' }}
                className="relative z-10"
              >
                {renderCallAvatar(session.partnerAvatarSeed, session.partnerName[0], session.partnerAvatarUrl, 'h-32 w-32 sm:h-36 sm:w-36 text-4xl')}
              </motion.div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-wide">{session.partnerName}</h2>
              <p className="text-xs text-neutral-400 font-mono">@{session.partnerUsername}</p>
              
              <div className="pt-2">
                <AnimatePresence mode="wait">
                  {!isConnected ? (
                    <motion.div
                      key="status-connecting"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center justify-center"
                    >
                      {session.status === 'dialing' && (
                        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-bold text-indigo-300 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                          <Radio className="h-3.5 w-3.5 animate-spin" />
                          <span>Calling...</span>
                        </span>
                      )}
                      {session.status === 'ringing' && (
                        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-300 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                          <Radio className="h-3.5 w-3.5 animate-spin" />
                          <span>Ringing...</span>
                        </span>
                      )}
                      {session.status !== 'dialing' && session.status !== 'ringing' && (
                        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-300 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                          <Radio className="h-3.5 w-3.5 animate-spin" />
                          <span>Connecting stream...</span>
                        </span>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="status-connected"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                      className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-4 py-1.5 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping mr-1" />
                      <span>Connected • Encrypted HD Voice</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Real Audio Waveform Visualizer for Speaking Activity */}
            {isConnected && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 h-12 w-64 justify-center bg-neutral-900/60 border border-white/10 rounded-2xl px-6 backdrop-blur-md">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => {
                    const factor = Math.sin((i / 14) * Math.PI);
                    const activeVol = Math.max(micVolume, remoteAudioVolume);
                    const dynamicHeight = Math.max(8, (activeVol * factor * 0.8) + (activeVol > 5 ? Math.random() * 6 : 0));
                    return (
                      <div 
                        key={i} 
                        className="w-1.5 rounded-full bg-gradient-to-t from-emerald-500 to-indigo-400 transition-all duration-75"
                        style={{ height: `${isMuted && micVolume === 0 ? 4 : dynamicHeight}px` }}
                      />
                    );
                  })}
                </div>
                <p className="text-[10px] text-neutral-400 font-medium flex items-center justify-center gap-1">
                  <Activity className="h-3 w-3 text-emerald-400" />
                  <span>Real-time voice stream active</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Command Center Control Bar */}
      <div className="p-6 sm:p-8 bg-gradient-to-t from-black via-black/80 to-transparent z-50 flex flex-col items-center">
        
        {/* Incoming Call Dialog Controls */}
        {session.isIncoming && !isConnected ? (
          <div className="flex flex-col items-center gap-4 animate-bounce">
            <div className="flex items-center gap-8">
              {/* Decline Button */}
              <button 
                id="btn_decline_call"
                onClick={handleDeclineIncoming}
                className="p-5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-full transition-all shadow-xl shadow-rose-600/30 cursor-pointer"
                title="Decline Call"
              >
                <PhoneOff className="h-7 w-7" />
              </button>

              {/* Accept Button */}
              <button 
                id="btn_accept_call"
                onClick={handleAcceptIncoming}
                className="p-5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-full transition-all shadow-xl shadow-emerald-500/30 cursor-pointer"
                title="Answer Call"
              >
                <Phone className="h-7 w-7" />
              </button>
            </div>
          </div>
        ) : (
          /* Ongoing / Dialing Call Control Bar */
          <div className="flex items-center gap-3 sm:gap-5 bg-neutral-900/90 border border-white/15 px-6 py-3.5 rounded-full backdrop-blur-2xl shadow-2xl">
            {/* Mute Mic button */}
            <button 
              id="btn_toggle_mute"
              onClick={handleToggleMute}
              className={`p-3.5 rounded-full transition-all cursor-pointer active:scale-90 ${isMuted ? 'bg-rose-600 text-white' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white'}`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* Video Toggle & Switch Camera (Video Mode Only) */}
            {session.type === 'video' && (
              <>
                <button 
                  id="btn_toggle_video"
                  onClick={handleToggleVideo}
                  className={`p-3.5 rounded-full transition-all cursor-pointer active:scale-90 ${isVideoOff ? 'bg-rose-600 text-white' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white'}`}
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </button>
                <button 
                  id="btn_switch_camera"
                  onClick={handleSwitchCamera}
                  className="p-3.5 rounded-full transition-all cursor-pointer active:scale-90 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white"
                  title="Switch Camera (Front/Back)"
                >
                  <SwitchCamera className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Speaker Toggle */}
            <button 
              id="btn_toggle_speaker"
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3.5 rounded-full transition-all cursor-pointer active:scale-90 ${isSpeakerOn ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white'}`}
              title={isSpeakerOn ? 'Mute Speaker' : 'Turn Speaker On'}
            >
              {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>

            {/* Hang Up Button */}
            <button 
              id="btn_hangup_call"
              onClick={handleHangUp}
              className="p-3.5 bg-rose-600 hover:bg-rose-700 hover:scale-105 active:scale-95 text-white rounded-full transition-all shadow-lg shadow-rose-600/40 cursor-pointer ml-1"
              title="End Call"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
