// ==============================================================================
// KRONOS PHASE 4: AI MISSION CONTROL - FULL DEDICATED SCREEN ROUTE
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  ArrowLeft,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAiStore } from '../../store/useAiStore';
import { useAuthStore } from '../../store/useAuthStore';
import { radii, spacing, typography } from '../../constants/theme';
import { ChatMessage } from '../../features/ai/aiTypes';

const SUGGESTED_PROMPTS = [
  "What's my mission today?",
  "Optimize my schedule",
  "Schedule deep work tomorrow at 10 AM",
  "Add task: Review DBMS Assignment high priority",
  "Analyze my fitness progress",
  "Which habits are at risk?",
  "How am I progressing on goals?",
];

export default function MissionControlChatScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { isDemoMode } = useAuthStore();
  const {
    messages,
    isLoading,
    pendingAction,
    sendMessage,
    retryLastMessage,
    confirmPendingAction,
    cancelPendingAction,
    startNewConversation,
  } = useAiStore();

  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    sendMessage(text);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 1. TOP HEADER */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={[styles.backButton, { borderColor: theme.border }]}
          >
            <ArrowLeft size={18} color={theme.textPrimary} />
          </TouchableOpacity>

          <View style={[styles.brandIconDot, { backgroundColor: `${theme.aiIntelligence}25` }]}>
            <Sparkles size={16} color={theme.aiIntelligence} />
          </View>
          <View>
            <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>MISSION CONTROL</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.statusText, { color: theme.textMuted }]}>
                {isDemoMode ? 'OFFLINE COGNITION ACTIVE' : 'EXECUTIVE AGENT ONLINE'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={startNewConversation}
          style={[styles.iconButton, { borderColor: theme.border }]}
          accessibilityLabel="Reset chat"
        >
          <RotateCcw size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* 2. SUGGESTED CHIPS */}
      <View style={[styles.promptChipsContainer, { backgroundColor: theme.surfaceSubtle }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptChipsScroll}>
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              onPress={() => !isLoading && sendMessage(prompt)}
              disabled={isLoading}
              style={[
                styles.promptChip,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.promptChipText, { color: theme.textSecondary }]}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3. THREAD */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.bubbleWrapper, msg.role === 'user' ? styles.userBubbleWrapper : styles.aiBubbleWrapper]}
          >
            {msg.role !== 'user' && (
              <View style={[styles.avatarCircle, { backgroundColor: `${theme.aiIntelligence}25` }]}>
                <Sparkles size={13} color={theme.aiIntelligence} />
              </View>
            )}

            <View
              style={[
                styles.bubble,
                msg.role === 'user'
                  ? [styles.userBubble, { backgroundColor: theme.primary }]
                  : [styles.aiBubble, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }],
              ]}
            >
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <View style={styles.toolCallsContainer}>
                  {msg.toolCalls.map((tc, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.toolBadge,
                        { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}40` },
                      ]}
                    >
                      <CheckCircle2 size={11} color={theme.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.toolBadgeText, { color: theme.primary }]}>
                        Executed: {tc.name.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={[styles.messageText, { color: msg.role === 'user' ? '#FFFFFF' : theme.textPrimary }]}>
                {msg.content}
              </Text>

              {msg.isConfirmationPrompt && msg.pendingAction && Boolean(pendingAction) && (
                <View style={[styles.confirmationCard, { backgroundColor: theme.surface, borderColor: theme.warning }]}>
                  <View style={styles.confirmationHeader}>
                    <AlertTriangle size={14} color={theme.warning} style={{ marginRight: 6 }} />
                    <Text style={[styles.confirmationTitle, { color: theme.warning }]}>
                      CONFIRMATION REQUIRED
                    </Text>
                  </View>
                  <Text style={[styles.confirmationDescription, { color: theme.textSecondary }]}>
                    {msg.pendingAction.description}
                  </Text>

                  <View style={styles.confirmationActions}>
                    <TouchableOpacity
                      onPress={cancelPendingAction}
                      style={[styles.confirmButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                    >
                      <Text style={[styles.confirmButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={confirmPendingAction}
                      style={[styles.confirmButton, { backgroundColor: theme.danger }]}
                    >
                      <Text style={[styles.confirmButtonText, { color: '#FFFFFF' }]}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {msg.status === 'error' && (
                <TouchableOpacity onPress={retryLastMessage} style={[styles.retryRow, { borderColor: theme.danger }]}>
                  <RotateCcw size={12} color={theme.danger} style={{ marginRight: 4 }} />
                  <Text style={[styles.retryText, { color: theme.danger }]}>Tap to Retry</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={[styles.loadingBubble, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <ActivityIndicator size="small" color={theme.aiIntelligence} style={{ marginRight: 8 }} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Mission Control is analyzing...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 4. INPUT */}
      <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
              color: theme.textPrimary,
            },
          ]}
          placeholder="Direct Mission Control (e.g. Schedule run at 6 PM)..."
          placeholderTextColor={theme.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
          style={[
            styles.sendButton,
            {
              backgroundColor: input.trim() && !isLoading ? theme.primary : theme.surfaceHigherElevated,
            },
          ]}
        >
          <Send size={16} color={input.trim() && !isLoading ? '#FFFFFF' : theme.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandIconDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: typography.letterSpacing.wider,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.wide,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptChipsContainer: {
    paddingVertical: 8,
  },
  promptChipsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  promptChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  promptChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  thread: {
    flex: 1,
  },
  threadContent: {
    padding: 16,
    paddingBottom: 24,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '88%',
  },
  userBubbleWrapper: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  aiBubbleWrapper: {
    alignSelf: 'flex-start',
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubble: {
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    borderBottomRightRadius: radii.xs,
  },
  aiBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: radii.xs,
  },
  toolCallsContainer: {
    marginBottom: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  toolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  toolBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  messageText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginLeft: 34,
  },
  loadingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  confirmationCard: {
    marginTop: 10,
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  confirmationTitle: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
  },
  confirmationDescription: {
    fontSize: typography.fontSize.xs,
    marginBottom: 8,
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  retryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: typography.fontSize.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
