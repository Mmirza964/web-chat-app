import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

const URL = 'http://localhost:3000';

export const Room = ({
  name,
  localAudioTrack,
  localVideoTrack,
}: {
  name: string;
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
}) => {
  const [searchParams] = useSearchParams();
  const paramName = searchParams.get('name') || name;
  const [lobby, setLobby] = useState(true);
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (socketRef.current) {
      return;
    }

    const socket = io(URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server, joining queue...');
      socket.emit('join-queue', { name: paramName });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server, cleaning up...');
      cleanupConnections();
    });

    socket.on('matched', async ({ roomId, isInitiator }) => {
      if (peerConnection) {
        console.warn('Already connected, ignoring new match event.');
        return;
      }
      console.log('Matched with another user. Room ID:', roomId);
      setLobby(false);
      const pc = new RTCPeerConnection();

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate');
          socket.emit('ice-candidate', {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = ({ track }) => {
        if (track.kind === 'video' && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = new MediaStream([track]);
          remoteVideoRef.current.play().catch((error) => {
            console.error('Error playing remote video:', error);
          });
        }
        console.log('Received track:', track.kind);
      };

      if (localAudioTrack) pc.addTrack(localAudioTrack);
      if (localVideoTrack) {
        pc.addTrack(localVideoTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
          localVideoRef.current.play().catch((error) => {
            console.error('Error playing local video:', error);
          });
        }
      }

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { roomId, sdp: offer.sdp });
      }

      setPeerConnection(pc);
    });

    socket.on('offer', async ({ roomId, sdp }) => {
      if (peerConnection) {
        await peerConnection.setRemoteDescription({ type: 'offer', sdp });
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', { roomId, sdp: answer.sdp });
      }
    });

    socket.on('answer', ({ sdp }) => {
      peerConnection?.setRemoteDescription({ type: 'answer', sdp });
    });

    socket.on('ice-candidate', ({ candidate }) => {
      peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    const cleanupConnections = () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (peerConnection) {
        peerConnection.close();
        setPeerConnection(null);
      }
    };

    return () => {
      cleanupConnections();
    };
  }, [paramName, localAudioTrack, localVideoTrack, peerConnection]);

  if (lobby) {
    return <div>Waiting for someone to connect...</div>;
  }

  return (
    <div>
      <h3>Connected as {paramName}</h3>
      <div>
        <video ref={localVideoRef} autoPlay muted width={400} height={400} />
        <video ref={remoteVideoRef} autoPlay width={400} height={400} />
      </div>
      <p>Check the console for connection logs and signaling steps.</p>
    </div>
  );
};
