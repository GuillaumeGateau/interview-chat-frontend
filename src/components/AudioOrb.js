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
  const isInitializedRef = useRef(false);

  // Expose resume function on audio element for external use
  useEffect(() => {
    if (audioElementRef?.current && audioContextRef.current) {
      audioElementRef.current.resumeAudioContext = async () => {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      };
    }
  }, [audioElementRef, audioContextRef.current]);

  // Initialize audio analyser - set up once when audio element is available
  useEffect(() => {
    if (!audioElementRef?.current) {
      isInitializedRef.current = false;
      return;
    }

    const audio = audioElementRef.current;
    
    const initAudio = async () => {
      try {
        // Create or reuse AudioContext
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        let audioContext = audioContextRef.current;
        
        if (!audioContext || audioContext.state === 'closed') {
          audioContext = new AudioContext();
          audioContextRef.current = audioContext;
        }

        // Resume if suspended (required for autoplay)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        // Create analyser with optimal settings for visualization
        // Only create if we don't have one yet
        if (!analyserRef.current) {
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256; // Good balance between detail and performance
          analyser.smoothingTimeConstant = 0.7; // Slightly less smoothing for more responsive visualization
          analyserRef.current = analyser;

          // Create data array for frequency data
          const bufferLength = analyser.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
        }

        // Connect audio element to analyser (only once per audio element)
        // An audio element can only have one MediaElementSource
        // IMPORTANT: Once connected, audio MUST play through Web Audio API
        if (!sourceRef.current && !audio.__audioSource) {
          try {
            const source = audioContext.createMediaElementSource(audio);
            // Connect: source -> analyser -> destination
            // This allows us to analyze AND hear the audio
            source.connect(analyserRef.current);
            analyserRef.current.connect(audioContext.destination);
            sourceRef.current = source;
            audio.__audioSource = source; // Mark as connected to prevent reconnection
            
            // Ensure audio context is running
            if (audioContext.state === 'suspended') {
              await audioContext.resume();
            }
          } catch (error) {
            console.error('Error connecting audio source:', error);
            // Audio element already connected - reuse existing connection
            if (audio.__audioSource) {
              sourceRef.current = audio.__audioSource;
            }
          }
        } else if (audio.__audioSource) {
          // Reuse existing connection
          sourceRef.current = audio.__audioSource;
          
          // Ensure audio context is running
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }
        }

        isInitializedRef.current = true;
      } catch (error) {
        console.error('Error initializing audio analyser:', error);
        isInitializedRef.current = false;
      }
    };

    // Initialize when audio element is ready
    initAudio();

    return () => {
      // Don't disconnect - we want to keep the connection for reuse
    };
  }, [audioElementRef]);

  // Main animation loop - this is the critical part
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId = null;

    const draw = (timestamp = 0) => {
      // Always clear the canvas first
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
        
        // Continue animation
        animationId = requestAnimationFrame(draw);
        return;
      }

      // Draw circle background
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = theme.colors.primary;
      ctx.fill();

      // Waveform visualization
      const barCount = 6;
      const totalBarWidth = radius * 0.5;
      const barWidth = totalBarWidth / barCount;
      const spacing = barWidth * 0.8;
      const padding = radius * 0.1;
      const centerMaxHeight = radius - padding; // Maximum height for center bars

      // Get analyser and data array
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;

      // Draw waveform if playing and analyser is ready
      if (isPlaying && isInitializedRef.current && analyser && dataArray) {
        // Get fresh frequency data
        analyser.getByteFrequencyData(dataArray);

        // Verify we have valid data (not all zeros)
        const hasData = dataArray.some(value => value > 0);
        
        if (hasData) {
          // Map frequencies for centered visualization
          const centerFrequencyIndex = Math.floor(dataArray.length * 0.35);
          const frequencyRange = Math.floor(dataArray.length * 0.4);
          const centerValue = dataArray[centerFrequencyIndex] / 255;

          for (let i = 0; i < barCount; i++) {
            const distanceFromCenter = Math.abs(i - (barCount - 1) / 2);
            const isCenterBar = distanceFromCenter <= 0.5;

            // Map bars to frequencies symmetrically around center
            const normalizedPosition = (i - (barCount - 1) / 2) / ((barCount - 1) / 2);
            const frequencyOffset = Math.floor(normalizedPosition * frequencyRange / 2);
            let frequencyIndex = centerFrequencyIndex + frequencyOffset;
            frequencyIndex = Math.max(0, Math.min(dataArray.length - 1, frequencyIndex));

            const normalizedValue = dataArray[frequencyIndex] / 255;

            let finalHeight;
            if (isCenterBar) {
              // Center bars: 85-100% of max height for dramatic effect
              const baseHeight = centerMaxHeight * 0.85;
              const dynamicHeight = centerMaxHeight * 0.15 * normalizedValue;
              finalHeight = baseHeight + dynamicHeight;
            } else {
              // Outer bars: 30-60% of center bar height, relative to distance
              const centerBarHeight = centerMaxHeight * 0.85 + centerMaxHeight * 0.15 * centerValue;
              const distanceFactor = 1 - (distanceFromCenter / ((barCount - 1) / 2)) * 0.5;
              const outerMaxHeight = centerBarHeight * (0.3 + distanceFactor * 0.3);
              finalHeight = normalizedValue * outerMaxHeight;
              const minHeight = centerMaxHeight * 0.15;
              finalHeight = Math.max(finalHeight, minHeight);
            }

            // Calculate bar position (centered)
            const totalWidth = (barCount - 1) * (barWidth + spacing) + barWidth;
            const startX = centerX - totalWidth / 2;
            const x = startX + i * (barWidth + spacing) + barWidth / 2;
            const y = centerY;

            // Draw rounded rectangle bar
            const cornerRadius = barWidth * 0.3;
            ctx.fillStyle = 'white';
            roundRect(ctx, x - barWidth / 2, y - finalHeight / 2, barWidth, finalHeight, cornerRadius);
            ctx.fill();
          }
        } else {
          // No data yet - draw static bars
          drawStaticBars(ctx, centerX, centerY, barCount, barWidth, spacing, radius * 0.15);
        }
      } else {
        // Not playing or not initialized - draw static bars
        drawStaticBars(ctx, centerX, centerY, barCount, barWidth, spacing, radius * 0.15);
      }

      // Continue animation loop if playing or thinking
      if (isPlaying || isThinking) {
        animationId = requestAnimationFrame(draw);
      }
    };

    // Helper function to draw static bars
    const drawStaticBars = (ctx, centerX, centerY, barCount, barWidth, spacing, staticHeight) => {
      const totalWidth = (barCount - 1) * (barWidth + spacing) + barWidth;
      const startX = centerX - totalWidth / 2;

      for (let i = 0; i < barCount; i++) {
        const x = startX + i * (barWidth + spacing) + barWidth / 2;
        const y = centerY;
        const cornerRadius = barWidth * 0.3;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        roundRect(ctx, x - barWidth / 2, y - staticHeight / 2, barWidth, staticHeight, cornerRadius);
        ctx.fill();
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

    // Start animation loop
    // Always start the loop - it will continue if playing/thinking
    draw();

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      animationFrameRef.current = null;
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
