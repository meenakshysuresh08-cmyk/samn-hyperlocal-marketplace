import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useMobileChatStore, ChatMessage, ChatConversation } from '../../services/chatStore';
import { useAuthStore } from '../../services/authStore';
import { colors, fontSizes, fontWeights, spacing } from '../../theme/tokens';
import { AppIcon } from '../../components/AppIcon';

export const ChatScreen = ({ route, navigation }: any) => {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(route?.params?.taskId || null);
  const { user } = useAuthStore();
  const {
    messages,
    conversations,
    loadConversations,
    loadMessages,
    leaveRoom,
    sendMessage,
    typingUser,
    isLoading,
    isLoadingConversations,
    bindMobileChatEvents,
  } = useMobileChatStore();

  const [inputContent, setInputContent] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversations();
    bindMobileChatEvents();
  }, []);

  useEffect(() => {
    if (route?.params?.taskId) {
      setActiveTaskId(route.params.taskId);
    }
  }, [route?.params?.taskId]);

  useEffect(() => {
    if (activeTaskId) {
      loadMessages(activeTaskId);
    }
    return () => {
      if (activeTaskId) leaveRoom(activeTaskId);
    };
  }, [activeTaskId]);

  const handleSend = async () => {
    if (!inputContent.trim() || !activeTaskId) return;
    const text = inputContent.trim();
    setInputContent('');
    await sendMessage(activeTaskId, text);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const selectedConv = conversations.find((c) => c.taskId === activeTaskId);

  // Render individual chat message
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMine = item.senderId?._id?.toString() === user?._id?.toString();
    return (
      <View style={[styles.msgWrapper, isMine ? styles.msgWrapperRight : styles.msgWrapperLeft]}>
        <View style={[styles.msgBubble, isMine ? styles.msgBubbleRight : styles.msgBubbleLeft]}>
          <Text style={[styles.msgText, isMine ? styles.msgTextRight : styles.msgTextLeft]}>
            {item.content}
          </Text>
        </View>
        <Text style={styles.timeText}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  // Render conversation row
  const renderConversation = ({ item }: { item: ChatConversation }) => {
    return (
      <TouchableOpacity
        style={styles.convCard}
        onPress={() => setActiveTaskId(item.taskId)}
      >
        <Image
          source={{
            uri:
              item.participant?.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
          }}
          style={styles.avatar}
        />
        <View style={styles.convInfo}>
          <View style={styles.convTopRow}>
            <Text style={styles.convName} numberOfLines={1}>
              {item.participant?.name || 'Task User'}
            </Text>
            <Text style={styles.convTime}>
              {item.lastMessage?.createdAt
                ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </Text>
          </View>
          <Text style={styles.convTaskTitle} numberOfLines={1}>
            📋 {item.taskTitle}
          </Text>
          <View style={styles.convBottomRow}>
            <Text style={styles.convSnippet} numberOfLines={1}>
              {item.lastMessage?.content || 'Tap to coordinate...'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // If no task is selected, show the conversations list
  if (!activeTaskId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat Sessions</Text>
          <Text style={styles.headerSub}>Active task conversations</Text>
        </View>

        {isLoadingConversations && conversations.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.brandPrimary} />
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.taskId}
            renderItem={renderConversation}
            contentContainerStyle={styles.convList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No active chat sessions</Text>
                <Text style={styles.emptyText}>
                  When you post a task or accept an assignment, live chats with helpers and customers will appear here!
                </Text>
              </View>
            }
          />
        )}
      </View>
    );
  }

  // Live Task Chat Room
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.chatHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setActiveTaskId(null)}
        >
          <AppIcon name="arrowLeft" width={20} height={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.chatHeaderInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selectedConv?.participant?.name || 'Task Live Chat'}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {selectedConv?.taskTitle || 'Coordinating task'}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Say hello to coordinate!</Text>
            </View>
          }
        />
      )}

      {typingUser && (
        <Text style={styles.typingIndicator}>{typingUser} is typing...</Text>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor={colors.textTertiary}
          value={inputContent}
          onChangeText={setInputContent}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <AppIcon name="send" width={16} height={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCanvas,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.xl,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.xl,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  backBtn: {
    padding: spacing.xs,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
  headerSub: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
  },
  convInfo: {
    flex: 1,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convName: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    flex: 1,
  },
  convTime: {
    color: colors.textTertiary,
    fontSize: 10,
  },
  convTaskTitle: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    marginTop: 2,
  },
  convBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
  },
  convSnippet: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  messagesList: {
    padding: spacing.md,
  },
  msgWrapper: {
    marginBottom: spacing.sm,
    maxWidth: '80%',
  },
  msgWrapperRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  msgWrapperLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  msgBubble: {
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  msgBubbleRight: {
    backgroundColor: colors.brandPrimary,
    borderBottomRightRadius: 2,
  },
  msgBubbleLeft: {
    backgroundColor: colors.bgCard,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  msgText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
  },
  msgTextRight: {
    color: '#fff',
  },
  msgTextLeft: {
    color: colors.textPrimary,
  },
  timeText: {
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: 2,
  },
  typingIndicator: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontStyle: 'italic',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
  },
  sendBtn: {
    backgroundColor: colors.brandPrimary,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    marginBottom: 4,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});

