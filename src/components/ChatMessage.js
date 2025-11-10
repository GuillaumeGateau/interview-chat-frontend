import React from 'react';
import { Box, Typography } from '@mui/material';
import AudioOrb from './AudioOrb';
import { theme } from '../theme';

function ChatMessage({ message, isUser, voiceEnabled, isCurrentlyPlaying, onAudioToggle, audioElementRef, language = 'en' }) {
  const isThinking = message.thinking;
  const hasAudio = voiceEnabled && message.audio;
  const showOrb = isThinking || hasAudio;

  return (
    <Box
      role={isUser ? 'user-message' : 'bot-message'}
      aria-label={isUser ? 'Your message' : 'Bot response'}
      sx={{
        maxWidth: { xs: '85%', sm: '75%' },
        minWidth: 0, // Allow shrinking
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        backgroundColor: isUser ? theme.colors.userMessage : (showOrb ? 'transparent !important' : theme.colors.botMessage),
        color: isUser ? 'white' : theme.colors.text,
        borderRadius: isUser ? '18px 18px 4px 18px' : (showOrb ? '0' : '18px 18px 18px 4px'),
        padding: isUser ? '12px 16px' : showOrb ? '0 !important' : '12px 16px',
        marginY: '8px',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        boxShadow: showOrb ? 'none !important' : theme.shadows.sm,
        transition: showOrb ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: showOrb ? 'none' : 'translateY(-1px)',
          boxShadow: showOrb ? 'none !important' : theme.shadows.md,
        },
      }}
      className="message-enter"
    >
      {isUser && message.text && (
        <Typography 
          sx={{ 
            fontSize: '0.95rem', 
            lineHeight: 1.5, 
            fontWeight: 500,
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            width: '100%',
            minWidth: 0,
          }}
        >
          {message.text}
        </Typography>
      )}

      {!isUser && (
        <>
          {isThinking ? (
            <AudioOrb
              isThinking={true}
              audioElementRef={audioElementRef}
              language={language}
            />
          ) : hasAudio ? (
            <AudioOrb
              audioUrl={message.audio}
              isPlaying={isCurrentlyPlaying}
              onToggle={() => onAudioToggle(message.audio)}
              audioElementRef={audioElementRef}
              language={language}
            />
          ) : (
            <Typography 
              sx={{ 
                fontSize: '0.95rem', 
                lineHeight: 1.5, 
                color: theme.colors.text,
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                width: '100%',
                minWidth: 0,
              }}
            >
              {message.text}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}

export default ChatMessage;

