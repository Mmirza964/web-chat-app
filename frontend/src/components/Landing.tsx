import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Room } from './Room';

export const Landing = () => {
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<MediaStreamTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<MediaStreamTrack | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getCam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];
    setLocalAudioTrack(audioTrack);
    setLocalVideoTrack(videoTrack);

    if (videoRef.current) {
      videoRef.current.srcObject = new MediaStream([videoTrack]);
      videoRef.current.play().catch((error) => {
        console.error('Error playing local video:', error);
      });
    }
  };

  useEffect(() => {
    getCam();
  }, []);

  if (!joined) {
    return (
      <div>
        <video autoPlay ref={videoRef} muted width={400} height={400} />
        <input
          type="text"
          placeholder="Enter your name"
          onChange={(e) => setName(e.target.value)}
        />
        <Link to={`/room/?name=${name}`} onClick={() => setJoined(true)}>
          Join
        </Link>
      </div>
    );
  }

  return (
    <Room
      name={name}
      localAudioTrack={localAudioTrack}
      localVideoTrack={localVideoTrack}
    />
  );
};
