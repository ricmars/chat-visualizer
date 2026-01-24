"use client";

import styled from "styled-components";
import { useState, useRef, useCallback, KeyboardEvent, ChangeEvent } from "react";
import { Icon } from "@pega/cosmos-react-core";

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
}

interface MessageInputProps {
  onSendMessage: (message: string, attachments: AttachedFile[]) => void;
  disabled?: boolean;
  placeholder?: string;
  models?: { id: string; name: string }[];
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  ttsEnabled?: boolean;
  onTtsToggle?: (enabled: boolean) => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 24px 24px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
`;

const AttachmentsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const AttachmentChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  max-width: 200px;
`;

const AttachmentName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AttachmentIcon = styled.div`
  display: flex;
  align-items: center;
  color: #6b7280;
`;

const RemoveAttachment = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 4px;
  
  &:hover {
    color: #ef4444;
    background: #fee2e2;
  }
`;

const InputRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
`;

const TextAreaWrapper = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0 12px;
  
  &:focus-within {
    border-color: #3f57e4;
    box-shadow: 0 0 0 3px rgba(63, 87, 228, 0.1);
  }
`;

const TextArea = styled.textarea`
  flex: 1;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px 0;
  resize: none;
  min-height: 24px;
  max-height: 200px;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const IconButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: ${props => props.$active ? '#e0e7ff' : 'transparent'};
  color: ${props => props.$active ? '#3f57e4' : '#6b7280'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  
  &:hover {
    background: ${props => props.$active ? '#c7d2fe' : '#f3f4f6'};
    color: ${props => props.$active ? '#3f57e4' : '#374151'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: #3f57e4;
  color: #fff;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  
  &:hover {
    background: #2d41b8;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const LeftControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModelSelector = styled.div`
  position: relative;
`;

const ModelButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #d1d5db;
    background: #f9fafb;
  }
`;

const ModelDropdown = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 4px;
  min-width: 180px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: ${props => props.$visible ? 'block' : 'none'};
  z-index: 100;
  overflow: hidden;
`;

const ModelOption = styled.button<{ $selected?: boolean }>`
  display: block;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: ${props => props.$selected ? '#f3f4f6' : '#fff'};
  font-size: 13px;
  color: #374151;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const DEFAULT_MODELS = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
];

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  models = DEFAULT_MODELS,
  selectedModel,
  onModelChange,
  ttsEnabled = false,
  onTtsToggle,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentModel = selectedModel || models[0]?.id;
  const currentModelName = models.find(m => m.id === currentModel)?.name || currentModel;

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleSend = () => {
    if ((!message.trim() && attachments.length === 0) || disabled) return;
    onSendMessage(message.trim(), attachments);
    setMessage("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment: AttachedFile = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result as string,
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleModelSelect = (modelId: string) => {
    onModelChange?.(modelId);
    setShowModelDropdown(false);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <Icon name="picture" size="s" />;
    }
    return <Icon name="document" size="s" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Container>
      {attachments.length > 0 && (
        <AttachmentsRow>
          {attachments.map(attachment => (
            <AttachmentChip key={attachment.id}>
              <AttachmentIcon>{getFileIcon(attachment.type)}</AttachmentIcon>
              <AttachmentName title={attachment.name}>{attachment.name}</AttachmentName>
              <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                ({formatFileSize(attachment.size)})
              </span>
              <RemoveAttachment onClick={() => removeAttachment(attachment.id)}>
                <Icon name="times" size="s" />
              </RemoveAttachment>
            </AttachmentChip>
          ))}
        </AttachmentsRow>
      )}
      
      <InputRow>
        <TextAreaWrapper>
          <TextArea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
          />
        </TextAreaWrapper>
        <SendButton onClick={handleSend} disabled={disabled || (!message.trim() && attachments.length === 0)}>
          <Icon name="send" size="s" />
        </SendButton>
      </InputRow>
      
      <ControlsRow>
        <LeftControls>
          <ModelSelector>
            <ModelButton onClick={() => setShowModelDropdown(!showModelDropdown)}>
              {currentModelName}
              <Icon name="caret-down" size="s" />
            </ModelButton>
            <ModelDropdown $visible={showModelDropdown}>
              {models.map(model => (
                <ModelOption
                  key={model.id}
                  $selected={model.id === currentModel}
                  onClick={() => handleModelSelect(model.id)}
                >
                  {model.name}
                </ModelOption>
              ))}
            </ModelDropdown>
          </ModelSelector>
          
          <IconButton onClick={handleFileSelect} title="Attach file">
            <Icon name="paper-clip" size="s" />
          </IconButton>
          <HiddenFileInput
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.txt,.json,.csv"
          />
          
          <IconButton 
            $active={ttsEnabled} 
            onClick={() => onTtsToggle?.(!ttsEnabled)}
            title={ttsEnabled ? "Disable text-to-speech" : "Enable text-to-speech"}
          >
            {ttsEnabled ? <Icon name="speaker-on" size="s" /> : <Icon name="speaker-mute" size="s" />}
          </IconButton>
        </LeftControls>
      </ControlsRow>
    </Container>
  );
}
