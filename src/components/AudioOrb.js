import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { theme } from '../theme';

function AudioOrb({ audioUrl, isPlaying, onToggle, audioElementRef, isThinking = false, language = 'en' }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const pulseRef = useRef(0);

  // Initialize audio analyser
  useEffect(() => {
    if (!audioUrl || !audioElementRef?.current) return;

    const audio = audioElementRef.current;
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

        if (sourceRef.current) {
          try {
            sourceRef.current.disconnect();
          } catch (e) {}
        }

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        try {
          const source = audioContext.createMediaElementSource(audio);
          source.connect(analyser);
          analyser.connect(audioContext.destination);
          sourceRef.current = source;
        } catch (error) {
          console.log('Audio element already connected');
        }

        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        if (!audio.src || audio.src !== audioUrl) {
          audio.src = audioUrl;
          audio.load();
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

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

    const draw = (timestamp = 0) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.4;

      // Pulse animation for thinking state
      if (isThinking) {
        pulseRef.current = (Math.sin(timestamp / 500) + 1) / 2; // 0 to 1
        const pulseScale = 0.9 + pulseRef.current * 0.1;
        const pulseRadius = radius * pulseScale;
        const pulseOpacity = 0.6 + pulseRef.current * 0.4;
        
        // Draw pulsing circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = theme.colors.primary;
        ctx.globalAlpha = pulseOpacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Draw "Good question..." text (localized)
        const thinkingText = language === 'fr' ? 'Bonne question...' : 'Good question...';
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(thinkingText, centerX, centerY);
        
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      // Draw circle background (no background color - transparent)
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = theme.colors.primary;
      ctx.fill();

      // Draw waveform bars in center - real-time visualization with centered effect
      const barCount = 6;
      const totalBarWidth = radius * 0.5;
      const barWidth = totalBarWidth / barCount;
      const spacing = barWidth * 0.8;
      
      // Center bars should be close to max height (with padding)
      const maxCenterBarHeight = radius * 0.75; // Center bars can be up to 75% of radius
      const padding = radius * 0.1; // 10% padding from edge
      const centerMaxHeight = radius - padding; // Maximum height for center bars
      
      // Check refs directly in the draw function
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      
      if (isPlaying && analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        
        // Map frequencies so center bars are most reactive (real-time)
        // Center bars (2, 3) get mid-range frequencies (most prominent)
        // Outer bars (0, 1, 4, 5) get lower/higher frequencies (less reactive)
        const centerFrequencyIndex = Math.floor(dataArray.length * 0.35); // Mid-range frequencies (most prominent)
        const frequencyRange = Math.floor(dataArray.length * 0.4); // Range to sample from
        
        // Get center bar audio value for reference
        const centerValue = dataArray[centerFrequencyIndex] / 255;
        
        for (let i = 0; i < barCount; i++) {
          // Calculate distance from center (0 = center, 2.5 = edge)
          const distanceFromCenter = Math.abs(i - (barCount - 1) / 2);
          const isCenterBar = distanceFromCenter <= 0.5; // Bars 2 and 3 are center bars
          
          // Map bars to frequencies: center bars get center frequencies (most reactive)
          // Create a symmetric mapping around the center frequency
          const normalizedPosition = (i - (barCount - 1) / 2) / ((barCount - 1) / 2); // -1 to 1
          const frequencyOffset = Math.floor(normalizedPosition * frequencyRange / 2);
          let frequencyIndex = centerFrequencyIndex + frequencyOffset;
          
          // Clamp to valid range
          frequencyIndex = Math.max(0, Math.min(dataArray.length - 1, frequencyIndex));
          
          const normalizedValue = dataArray[frequencyIndex] / 255;
          
          let finalHeight;
          if (isCenterBar) {
            // Center bars: always close to max height, with dynamic variation
            // Base height is 85% of max, plus up to 15% based on audio
            const baseHeight = centerMaxHeight * 0.85;
            const dynamicHeight = centerMaxHeight * 0.15 * normalizedValue;
            finalHeight = baseHeight + dynamicHeight;
          } else {
            // Outer bars: relative to center bars, scaled by distance
            // They should be 30-60% of center bar height
            const centerBarHeight = centerMaxHeight * 0.85 + centerMaxHeight * 0.15 * centerValue;
            const distanceFactor = 1 - (distanceFromCenter / ((barCount - 1) / 2)) * 0.5; // 0.5 to 1.0
            const outerMaxHeight = centerBarHeight * (0.3 + distanceFactor * 0.3); // 30-60% of center
            finalHeight = normalizedValue * outerMaxHeight;
            // Ensure minimum height for visibility
            const minHeight = centerMaxHeight * 0.15;
            finalHeight = Math.max(finalHeight, minHeight);
          }
          
          // Center the bars horizontally - ensure perfect centering
          const totalWidth = (barCount - 1) * (barWidth + spacing) + barWidth;
          const startX = centerX - totalWidth / 2;
          const x = startX + i * (barWidth + spacing) + barWidth / 2;
          const y = centerY;
          
          // Draw rounded rectangle
          const cornerRadius = barWidth * 0.3;
          ctx.fillStyle = 'white';
          roundRect(ctx, x - barWidth / 2, y - finalHeight / 2, barWidth, finalHeight, cornerRadius);
          ctx.fill();
        }
      } else {
        // Static bars when not playing
        const staticHeight = radius * 0.15;
        
        for (let i = 0; i < barCount; i++) {
          const totalWidth = (barCount - 1) * (barWidth + spacing) + barWidth;
          const startX = centerX - totalWidth / 2;
          const x = startX + i * (barWidth + spacing) + barWidth / 2;
          const y = centerY;
          
          // Draw rounded rectangle
          const cornerRadius = barWidth * 0.3;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          roundRect(ctx, x - barWidth / 2, y - staticHeight / 2, barWidth, staticHeight, cornerRadius);
          ctx.fill();
        }
      }

      // Always continue animation if playing or thinking
      if (isPlaying || isThinking) {
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    };

    // Helper function to draw rounded rectangles
    const roundRect = (ctx, x, y, width, height, radius) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    // Start animation loop - always draw at least once, then continue if playing/thinking
    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, isThinking, audioUrl, language]);

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
        width: { xs: '120px', sm: '150px', md: '180px' },
        height: { xs: '120px', sm: '150px', md: '180px' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        backgroundColor: 'transparent',
        padding: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        width={180}
        height={180}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          backgroundColor: 'transparent',
        }}
      />
    </Box>
  );
}

export default AudioOrb;
