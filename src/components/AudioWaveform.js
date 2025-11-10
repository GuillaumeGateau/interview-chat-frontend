import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { theme } from '../theme';

function AudioWaveform({ audioUrl, isPlaying, onToggle, audioElementRef }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const [progress, setProgress] = useState(0);

  // Initialize audio context and analyser
  useEffect(() => {
    if (!audioUrl || !audioElementRef?.current) return;

    const audio = audioElementRef.current;
    
    // Only initialize if this is the current audio
    if (audio.src !== audioUrl && audio.src) return;

    const initAudio = async () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        let audioContext = audioContextRef.current;
        
        if (!audioContext || audioContext.state === 'closed') {
          audioContext = new AudioContext();
          audioContextRef.current = audioContext;
        }

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        // Disconnect previous source
        if (sourceRef.current) {
          try {
            sourceRef.current.disconnect();
          } catch (e) {}
        }

        // Create analyser
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.6;
        analyserRef.current = analyser;

        // Connect to audio element
        try {
          const source = audioContext.createMediaElementSource(audio);
          source.connect(analyser);
          analyser.connect(audioContext.destination);
          sourceRef.current = source;
        } catch (error) {
          // Audio element already has a source
          console.log('Audio element already connected');
        }

        // Setup data array
        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        // Track progress
        const updateProgress = () => {
          if (audio.duration) {
            setProgress(audio.currentTime / audio.duration);
          }
        };

        audio.addEventListener('timeupdate', updateProgress);

        return () => {
          audio.removeEventListener('timeupdate', updateProgress);
        };
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    // Set audio source if needed
    if (!audio.src || audio.src !== audioUrl) {
      audio.src = audioUrl;
      audio.load();
    }

    initAudio();

    return () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (e) {}
        sourceRef.current = null;
      }
    };
  }, [audioUrl, audioElementRef]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 50;
      const barWidth = canvas.width / barCount;
      const barGap = 3;
      const maxBarHeight = canvas.height * 0.7;
      const minBarHeight = canvas.height * 0.15;

      // Calculate how many bars should be active based on progress
      const activeBarCount = Math.floor(progress * barCount);

      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth + barGap;
        const barWidthActual = barWidth - barGap * 2;
        
        let barHeight;
        let barColor;

        if (i < activeBarCount && isPlaying && analyser && dataArray) {
          // Active bars - use audio data for dynamic height
          analyser.getByteFrequencyData(dataArray);
          const dataIndex = Math.floor((i / activeBarCount) * dataArray.length);
          const normalizedValue = dataArray[dataIndex] / 255;
          barHeight = minBarHeight + (normalizedValue * (maxBarHeight - minBarHeight));
          
          // Vibrant blue-purple gradient
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
          gradient.addColorStop(0, theme.colors.primary);
          gradient.addColorStop(0.5, theme.colors.secondary);
          gradient.addColorStop(1, theme.colors.secondaryLight);
          barColor = gradient;
        } else if (i < activeBarCount) {
          // Active bars but not playing - static height
          barHeight = minBarHeight + (maxBarHeight - minBarHeight) * 0.6;
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
          gradient.addColorStop(0, theme.colors.primary);
          gradient.addColorStop(0.5, theme.colors.secondary);
          gradient.addColorStop(1, theme.colors.secondaryLight);
          barColor = gradient;
        } else {
          // Inactive bars - faint grey
          barHeight = minBarHeight;
          barColor = '#e2e8f0';
        }

        ctx.fillStyle = barColor;
        ctx.fillRect(
          x,
          canvas.height - barHeight,
          barWidthActual,
          barHeight
        );
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, progress, audioUrl]);

  // Update progress from audio element
  useEffect(() => {
    const audio = audioElementRef?.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration && audio.src === audioUrl) {
        setProgress(audio.currentTime / audio.duration);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
    };
  }, [audioElementRef, audioUrl]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle();
    }
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        cursor: 'pointer',
        width: '100%',
        height: '60px',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#f8fafc',
        padding: '8px',
        transition: 'background-color 0.2s ease',
        '&:hover': {
          backgroundColor: '#f1f5f9',
        },
      }}
    >
      <canvas
        ref={canvasRef}
        width={400}
        height={60}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </Box>
  );
}

export default AudioWaveform;
