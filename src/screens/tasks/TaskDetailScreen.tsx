import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTaskStore } from '../../services/taskStore';
import { useAuthStore } from '../../services/authStore';
import { colors, fontSizes, fontWeights, spacing } from '../../theme/tokens';
import { AppIcon } from '../../components/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { ProofModal } from '../../components/ProofModal';
import { QRCodeModal } from '../../components/QRCodeModal';
import { ReviewModal } from '../../components/ReviewModal';
import { TaskLiveTrackingModal } from '../../components/TaskLiveTrackingModal';
import { getMobileSocket } from '../../services/socket';
import API from '../../services/api';

export default function TaskDetailScreen({ route, navigation }: any) {
  const { taskId } = route.params;
  const {
    currentTask,
    fetchTaskById,
    acceptBid,
    rejectBid,
    cancelAssignment,
    startTask,
    submitBid,
    approveCompletion,
    deleteTask,
    isLoading,
  } = useTaskStore();
  const { user } = useAuthStore();

  const [bidAmount, setBidAmount] = useState('350');
  const [bidMessage, setBidMessage] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPasscodePlain, setShowPasscodePlain] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [taskRatings, setTaskRatings] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showLiveTrackingModal, setShowLiveTrackingModal] = useState(false);
  const [isRefreshingOffers, setIsRefreshingOffers] = useState(false);

  const loadTaskRatings = async () => {
    try {
      if (taskId) {
        const res = await API.get(`/ratings/task/${taskId}`);
        if (res.data?.success) {
          setTaskRatings(res.data.data);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (taskId) {
      fetchTaskById(taskId);
      loadTaskRatings();

      const socket = getMobileSocket();
      if (socket) {
        socket.emit('join_task_room', taskId);

        const onTaskUpdated = (updated: any) => {
          if (updated && updated._id === taskId) {
            fetchTaskById(taskId);
          }
        };

        const onBidReceived = () => {
          fetchTaskById(taskId);
        };

        socket.on('task_updated', onTaskUpdated);
        socket.on('bid_received', onBidReceived);
        socket.on('bid_updated', onBidReceived);

        return () => {
          socket.emit('leave_task_room', taskId);
          socket.off('task_updated', onTaskUpdated);
          socket.off('bid_received', onBidReceived);
          socket.off('bid_updated', onBidReceived);
        };
      }
    }
  }, [taskId]);

  // Robust ID comparisons supporting both populated Objects and raw ID strings
  const custId = currentTask?.customerId?._id || currentTask?.customerId;
  const isTaskCreator = !user?._id || !custId ? false : custId.toString() === user._id.toString();
  const isCustomer = isTaskCreator || user?.activeRole === 'customer';

  const helperId = currentTask?.helperId?._id || currentTask?.helperId;
  const isAssignedHelper = !helperId || !user?._id ? false : helperId.toString() === user._id.toString();

  const hasUserBid = currentTask?.bids?.some((b: any) => {
    const bHelperId = b.helperId?._id || b.helperId;
    return bHelperId && user?._id && bHelperId.toString() === user._id.toString();
  });

  // Stream helper live GPS location to customer when assigned
  useEffect(() => {
    if (isAssignedHelper && currentTask && ['assigned', 'in_progress'].includes(currentTask.status)) {
      const socket = getMobileSocket();
      if (!socket) return;

      const streamLocation = () => {
        const latestUser = useAuthStore.getState().user;
        const coords = latestUser?.location?.coordinates;
        if (coords && coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0)) {
          socket.emit('send_helper_location', {
            taskId: currentTask._id,
            coordinates: coords,
          });
        }
      };

      streamLocation();
      const interval = setInterval(streamLocation, 6000);
      return () => clearInterval(interval);
    }
  }, [isAssignedHelper, currentTask?.status, currentTask?._id]);

  if (isLoading || !currentTask) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  const handleRefreshOffers = async () => {
    setIsRefreshingOffers(true);
    await fetchTaskById(currentTask._id);
    setIsRefreshingOffers(false);
  };

  const handleChatWithBidder = (bid: any) => {
    const bHelperId = bid.helperId?._id || bid.helperId;
    const helperName = bid.helperId?.name || 'Helper';
    navigation.navigate('Chat', {
      taskId: currentTask._id,
      receiverId: bHelperId,
      receiverName: helperName,
    });
  };

  const handleDeleteTask = () => {
    Alert.alert(
      'Permanently Delete Task? 🗑️',
      'Are you sure you want to permanently delete this task? All helper proposals and records will be deleted. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setIsActionLoading(true);
            const res = await deleteTask(currentTask._id);
            setIsActionLoading(false);
            if (res.success) {
              Alert.alert('Task Deleted', 'Your task was permanently removed.');
              navigation.goBack();
            } else {
              Alert.alert('Error', res.message || 'Failed to delete task.');
            }
          },
        },
      ]
    );
  };

  const handleAcceptBid = async (bidId: string, helperName = 'this helper') => {
    Alert.alert(
      'Assign Helper',
      `Assign ${helperName} to your task and lock in the agreed price?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Assign',
          onPress: async () => {
            setIsActionLoading(true);
            const res = await acceptBid(currentTask._id, bidId);
            setIsActionLoading(false);
            if (res.success) {
              Alert.alert('Helper Assigned! 🎉', 'The helper has been assigned. You can now chat and track progress.');
              await fetchTaskById(currentTask._id);
            } else {
              Alert.alert('Assignment Error', res.message || 'Failed to assign helper.');
            }
          },
        },
      ]
    );
  };

  const handleRejectBid = async (bidId: string, helperName = 'this helper') => {
    Alert.alert(
      'Decline Offer',
      `Decline the offer from ${helperName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline Offer',
          style: 'destructive',
          onPress: async () => {
            setIsActionLoading(true);
            const res = await rejectBid(currentTask._id, bidId);
            setIsActionLoading(false);
            if (res.success) {
              Alert.alert('Offer Declined', 'The helper offer has been removed.');
              await fetchTaskById(currentTask._id);
            } else {
              Alert.alert('Error', res.message || 'Failed to decline offer');
            }
          },
        },
      ]
    );
  };

  const handleCancelAssignment = async () => {
    Alert.alert(
      'Cancel Assignment & Reopen Task',
      'Are you sure you want to unassign this helper and reopen your task to find another helper?',
      [
        { text: 'Keep Helper', style: 'cancel' },
        {
          text: 'Cancel Assignment',
          style: 'destructive',
          onPress: async () => {
            setIsActionLoading(true);
            const res = await cancelAssignment(currentTask._id);
            setIsActionLoading(false);
            if (res.success) {
              Alert.alert('Task Reopened 📡', 'The assignment has been cancelled and your task is back open on the radar.');
              await fetchTaskById(currentTask._id);
            } else {
              Alert.alert('Error', res.message || 'Failed to cancel assignment');
            }
          },
        },
      ]
    );
  };

  const handleStartTask = async () => {
    setIsActionLoading(true);
    const res = await startTask(currentTask._id);
    setIsActionLoading(false);
    if (res.success) {
      Alert.alert('Task In Progress 🚀', 'You have started the task. Complete the work and ask the customer for the 4-digit completion passcode.');
      await fetchTaskById(currentTask._id);
    } else {
      Alert.alert('Error', res.message || 'Failed to start task');
    }
  };

  const handleApproveCompletion = async () => {
    Alert.alert('Approve & Release Payment', 'Are you satisfied with the work done? This will finalize the task and release the helper payment.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve & Release',
        onPress: async () => {
          setIsActionLoading(true);
          const res = await approveCompletion(currentTask._id);
          setIsActionLoading(false);
          if (res.success) {
            await fetchTaskById(currentTask._id);
            await loadTaskRatings();
            Alert.alert(
              'Success 🎉',
              'Payment approved and released! Would you like to rate and review the helper?',
              [
                { text: 'Later' },
                {
                  text: 'Rate Helper ⭐',
                  onPress: () => setShowReviewModal(true),
                },
              ]
            );
          } else {
            Alert.alert('Error', res.message || 'Failed to approve completion');
          }
        },
      },
    ]);
  };

  const handleSendOffer = async () => {
    if (!bidAmount) {
      Alert.alert('Required', 'Please enter your offer amount.');
      return;
    }
    setIsActionLoading(true);
    const res = await submitBid(currentTask._id, {
      proposedAmount: Number(bidAmount),
      message: bidMessage || 'Ready to assist!',
      estimatedTime: '30 mins',
    });
    setIsActionLoading(false);

    if (res.success) {
      Alert.alert('Offer Submitted! 🚀', 'The customer has been notified of your offer.');
      setShowBidForm(false);
      await fetchTaskById(currentTask._id);
    } else {
      Alert.alert('Offer Error', res.message || 'Failed to submit offer.');
    }
  };

  const targetUser = isCustomer
    ? {
        _id: currentTask.helperId?._id || currentTask.helperId || '',
        name: currentTask.helperId?.name || 'Assigned Helper',
        avatar: currentTask.helperId?.avatar,
        role: 'helper' as const,
      }
    : {
        _id: currentTask.customerId?._id || currentTask.customerId || '',
        name: currentTask.customerId?.name || 'Customer',
        avatar: currentTask.customerId?.avatar,
        role: 'customer' as const,
      };

  const myRating = taskRatings.find((r: any) => {
    const rater = r.raterId?._id || r.raterId;
    return rater && user?._id && rater.toString() === user._id.toString();
  });

  const otherRating = taskRatings.find((r: any) => {
    const rater = r.raterId?._id || r.raterId;
    return rater && user?._id && rater.toString() !== user._id.toString();
  });

  const otp = currentTask.completionOtp || '0000';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header Card */}
        <View style={styles.headerBox}>
          <View style={styles.topMeta}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{currentTask.category?.toUpperCase()}</Text>
            </View>

            <View style={[
              styles.statusPillBox,
              currentTask.status === 'completed' && styles.statusCompleted,
              currentTask.status === 'in_progress' && styles.statusInProgress,
              currentTask.status === 'assigned' && styles.statusAssigned,
            ]}>
              <Text style={styles.statusPillText}>
                {currentTask.status === 'completed' ? '✅ COMPLETED' :
                 currentTask.status === 'assigned' ? '🤝 HELPER ASSIGNED' :
                 currentTask.status === 'in_progress' ? '⚡ IN PROGRESS' : `STATUS: ${currentTask.status?.toUpperCase()}`}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{currentTask.title}</Text>
          <Text style={styles.budgetAmount}>₹{currentTask.budget?.amount}</Text>

          <View style={styles.addressRow}>
            <AppIcon name="map-pin" width={14} height={14} color={colors.brandPrimary} />
            <Text style={styles.addressText}>{currentTask.location?.address}</Text>
          </View>

          {(currentTask.location?.landmark || currentTask.recipient?.landmark) ? (
            <View style={styles.landmarkBanner}>
              <Text style={styles.landmarkText}>
                🚩 Landmark: {currentTask.location?.landmark || currentTask.recipient?.landmark}
              </Text>
            </View>
          ) : null}

          {currentTask.recipient?.forSelf === false && currentTask.recipient?.name ? (
            <View style={styles.recipientBanner}>
              <Text style={styles.recipientText}>
                👥 Helping: {currentTask.recipient.name} {currentTask.recipient.phone ? `(${currentTask.recipient.phone})` : ''}
              </Text>
            </View>
          ) : null}

          {currentTask.timeline?.scheduledText ? (
            <View style={styles.scheduleBanner}>
              <Text style={styles.scheduleText}>
                ⏰ Target Schedule: {currentTask.timeline.scheduledText}
              </Text>
            </View>
          ) : null}
        </View>

        {/* CUSTOMER COMPLETION PASSCODE CARD */}
        {isCustomer && ['assigned', 'in_progress'].includes(currentTask.status) && (
          <View style={styles.passcodeCard}>
            <View style={styles.passcodeHeader}>
              <View style={styles.passcodeTitleRow}>
                <AppIcon name="lock" width={18} height={18} color="#f59e0b" />
                <Text style={styles.passcodeTitle}>Customer Completion Passcode</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPasscodePlain(!showPasscodePlain)}>
                <Text style={styles.showPasscodeText}>
                  {showPasscodePlain ? 'Hide' : 'Show Code'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.passcodeDesc}>
              Share this 4-digit code with your helper <Text style={styles.boldWhite}>ONLY</Text> after they finish the work.
            </Text>

            <View style={styles.passcodeDigitsBox}>
              <Text style={styles.passcodeDigits}>
                {showPasscodePlain ? otp.split('').join('  ') : '•  •  •  •'}
              </Text>
            </View>

            <View style={styles.passcodeActionRow}>
              <TouchableOpacity
                style={styles.qrBtn}
                onPress={() => setShowQrModal(true)}
              >
                <Text style={styles.qrBtnText}>📱 Touchless QR Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.approveBtn}
                onPress={handleApproveCompletion}
              >
                <Text style={styles.approveBtnText}>Approve & Release</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* LIVE HELPER TRACKING BUTTON (For Customer when Helper is Assigned/In Progress) */}
        {isCustomer && currentTask.helperId && ['assigned', 'in_progress'].includes(currentTask.status) && (
          <TouchableOpacity
            style={styles.liveTrackingBtn}
            onPress={() => setShowLiveTrackingModal(true)}
          >
            <LinearGradient
              colors={['#059669', '#10b981']}
              style={styles.liveTrackingGradient}
            >
              <View style={styles.liveTrackingIconRow}>
                <Text style={styles.liveTrackingIcon}>🛵</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.liveTrackingTitle}>Track Helper Live on Map</Text>
                  <Text style={styles.liveTrackingSub}>View real-time GPS stream, distance & ETA</Text>
                </View>
              </View>
              <Text style={styles.liveTrackingArrow}>➔</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* IN-TASK LIVE CHAT BUTTON */}
        {(isCustomer || isAssignedHelper) && currentTask.status !== 'open' && (
          <TouchableOpacity
            style={styles.chatActionBtn}
            onPress={() => navigation.navigate('Chat', { taskId: currentTask._id })}
          >
            <LinearGradient
              colors={[colors.brandPrimary, colors.accentIndigo]}
              style={styles.chatGradient}
            >
              <AppIcon name="message-square" width={18} height={18} color="#fff" />
              <Text style={styles.chatActionBtnText}>Open In-Task Live Chat</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Description */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Task Description</Text>
          <Text style={styles.descriptionText}>{currentTask.description}</Text>
        </View>

        {/* Customer Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Customer Details</Text>
          <Text style={styles.personName}>{currentTask.customerId?.name || 'Customer'}</Text>
          <Text style={styles.personRating}>
            ⭐ {currentTask.customerId?.stats?.avgRatingAsCustomer || '5.0'} Customer Rating
          </Text>
        </View>

        {/* Helper Assigned Card */}
        {currentTask.helperId && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Assigned Helper</Text>
            <Text style={styles.personName}>{currentTask.helperId?.name || 'Assigned Helper'}</Text>
            <Text style={styles.personRating}>
              ⭐ {currentTask.helperId?.stats?.avgRatingAsHelper || '5.0'} Helper Rating
            </Text>

            {/* Cancel Assignment Button (After Offer is Accepted) */}
            {(isCustomer || isAssignedHelper) && ['assigned', 'in_progress'].includes(currentTask.status) && (
              <TouchableOpacity
                style={styles.cancelAssignmentBtn}
                onPress={handleCancelAssignment}
                disabled={isActionLoading}
              >
                <Text style={styles.cancelAssignmentBtnText}>
                  ✕ Cancel Assignment & Reopen Task
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* HELPER WORKFLOW ACTIONS */}
        {!isCustomer && (
          <View style={styles.actionsSection}>
            {['open', 'broadcasted'].includes(currentTask.status) && (
              <>
                {showBidForm ? (
                  <View style={styles.bidFormCard}>
                    <Text style={styles.bidFormTitle}>Submit Offer Amount (INR ₹)</Text>
                    
                    {/* Quick price presets */}
                    <View style={styles.quickPresetRow}>
                      {['300', '400', '500', '750'].map(p => (
                        <TouchableOpacity
                          key={p}
                          style={[styles.presetBtn, bidAmount === p && styles.presetBtnActive]}
                          onPress={() => setBidAmount(p)}
                        >
                          <Text style={[styles.presetBtnText, bidAmount === p && styles.presetBtnTextActive]}>
                            ₹{p}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput
                      style={styles.input}
                      placeholder="Enter amount (₹)"
                      placeholderTextColor={colors.textTertiary}
                      value={bidAmount}
                      onChangeText={setBidAmount}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.input, { marginTop: spacing.sm }]}
                      placeholder="Optional message (e.g. Nearby & ready to start!)"
                      placeholderTextColor={colors.textTertiary}
                      value={bidMessage}
                      onChangeText={setBidMessage}
                    />
                    <TouchableOpacity
                      style={styles.sendBidBtn}
                      onPress={handleSendOffer}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.sendBidBtnText}>Confirm & Send Offer 🚀</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() => setShowBidForm(true)}
                  >
                    <Text style={styles.primaryActionBtnText}>
                      {hasUserBid ? '📝 Update My Offer' : '🤝 Make an Offer to Assist'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* HELPER LIVE ROUTE & GPS NAVIGATION BUTTON */}
            {isAssignedHelper && ['assigned', 'in_progress'].includes(currentTask.status) && (
              <TouchableOpacity
                style={styles.liveRouteBtn}
                onPress={() => setShowLiveTrackingModal(true)}
              >
                <LinearGradient
                  colors={['#2563eb', '#3b82f6']}
                  style={styles.liveTrackingGradient}
                >
                  <View style={styles.liveTrackingIconRow}>
                    <Text style={styles.liveTrackingIcon}>🗺️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.liveTrackingTitle}>Live Route & GPS Navigation</Text>
                      <Text style={styles.liveTrackingSub}>View route on map, live distance & turn-by-turn navigation</Text>
                    </View>
                  </View>
                  <Text style={styles.liveTrackingArrow}>➔</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isAssignedHelper && currentTask.status === 'assigned' && (
              <TouchableOpacity
                style={styles.startTaskBtn}
                onPress={handleStartTask}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.startTaskBtnText}>▶ Start Working on Task</Text>
                )}
              </TouchableOpacity>
            )}

            {isAssignedHelper && currentTask.status === 'in_progress' && (
              <TouchableOpacity
                style={styles.otpVerifyBtn}
                onPress={() => setShowOtpModal(true)}
              >
                <Text style={styles.otpVerifyBtnText}>🔐 Enter Customer Completion OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* CUSTOMER BIDS REVIEW (Assign Helper, Reject Offer & Chat/Negotiate) */}
        {(isTaskCreator || isCustomer) && ['open', 'broadcasted'].includes(currentTask.status) && (
          <View style={styles.sectionCard}>
            <View style={styles.bidsHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionHeading}>
                  Helper Offers Received ({currentTask.bids?.length || 0})
                </Text>
                <Text style={styles.bidsSubHeading}>
                  Review proposals, negotiate via chat, or accept & assign
                </Text>
              </View>
              <TouchableOpacity
                style={styles.refreshOffersBtn}
                onPress={handleRefreshOffers}
                disabled={isRefreshingOffers}
              >
                {isRefreshingOffers ? (
                  <ActivityIndicator size="small" color={colors.brandPrimary} />
                ) : (
                  <Text style={styles.refreshOffersText}>🔄 Refresh</Text>
                )}
              </TouchableOpacity>
            </View>

            {(!currentTask.bids || currentTask.bids.length === 0) ? (
              <View style={styles.emptyBidsBox}>
                <Text style={styles.emptyBidsIcon}>📡</Text>
                <Text style={styles.noBidsText}>Waiting for nearby helpers to place offers...</Text>
                <Text style={styles.noBidsSub}>Your task has been broadcasted to helpers in range. Tap Refresh to check for new proposals.</Text>
                <TouchableOpacity
                  style={styles.checkBidsBtn}
                  onPress={handleRefreshOffers}
                >
                  <Text style={styles.checkBidsBtnText}>🔄 Check for New Offers</Text>
                </TouchableOpacity>
              </View>
            ) : (
              currentTask.bids.map((bid: any) => {
                const helperName = bid.helperId?.name || 'Local Helper';
                const helperAvatar = bid.helperId?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop';
                const helperRating = bid.helperId?.stats?.avgRatingAsHelper || '5.0';
                const estTime = bid.estimatedTime || '1 hour';
                const isRejected = bid.status === 'rejected';

                return (
                  <View key={bid._id} style={[styles.bidCard, isRejected && styles.rejectedBidCard]}>
                    <View style={styles.bidHeader}>
                      <Image source={{ uri: helperAvatar }} style={styles.bidHelperAvatar} />
                      <View style={styles.bidHelperMeta}>
                        <View style={styles.bidHelperTitleRow}>
                          <Text style={styles.bidHelperName}>{helperName}</Text>
                          {bid.helperId?.isVerified && (
                            <Text style={styles.verifiedBadgeIcon}>✓</Text>
                          )}
                        </View>
                        <Text style={styles.bidRating}>
                          ⭐ {helperRating} Rating • ⏳ Est: {estTime}
                        </Text>
                      </View>
                      <Text style={styles.bidPrice}>₹{bid.proposedAmount}</Text>
                    </View>

                    {bid.message ? (
                      <View style={styles.bidMsgBox}>
                        <Text style={styles.bidMsg}>"{bid.message}"</Text>
                      </View>
                    ) : null}

                    {/* Action Buttons: Chat / Negotiate, Reject, Accept */}
                    {!isRejected ? (
                      <View style={styles.bidActionRow}>
                        <TouchableOpacity
                          style={styles.negotiateBidBtn}
                          onPress={() => handleChatWithBidder(bid)}
                        >
                          <AppIcon name="message-square" width={13} height={13} color={colors.brandPrimary} />
                          <Text style={styles.negotiateBidBtnText}>Chat</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.rejectBidBtn}
                          onPress={() => handleRejectBid(bid._id, helperName)}
                          disabled={isActionLoading}
                        >
                          <Text style={styles.rejectBidBtnText}>Reject ✕</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.acceptBidBtn}
                          onPress={() => handleAcceptBid(bid._id, helperName)}
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={styles.acceptBidBtnText}>Accept & Assign ➔</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.rejectedTag}>
                        <Text style={styles.rejectedTagText}>✕ Offer Declined</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* COMPLETED TASK REVIEWS & RATINGS (For both Customer and Helper) */}
        {currentTask.status === 'completed' && (
          <View style={styles.reviewSectionCard}>
            <Text style={styles.reviewSectionTitle}>⭐ Task Experience & Reviews</Text>
            <Text style={styles.reviewSectionSubtitle}>
              Both customer and helper can submit a review with or without an optional photo.
            </Text>

            {/* User's Own Review Status */}
            {myRating ? (
              <View style={styles.myReviewCard}>
                <View style={styles.reviewCardTop}>
                  <Text style={styles.reviewBadge}>Your Submitted Review</Text>
                  <Text style={styles.starText}>
                    {'★'.repeat(myRating.score)}
                    <Text style={styles.starEmptyText}>{'★'.repeat(Math.max(0, 5 - myRating.score))}</Text>
                  </Text>
                </View>
                {myRating.review ? (
                  <Text style={styles.reviewCommentText}>"{myRating.review}"</Text>
                ) : null}
                {myRating.tags && myRating.tags.length > 0 && (
                  <View style={styles.reviewTagsRow}>
                    {myRating.tags.map((t: string) => (
                      <Text key={t} style={styles.reviewTagPill}>{t}</Text>
                    ))}
                  </View>
                )}
                {myRating.photoUrl && (
                  <View style={styles.attachedWorkPhotoContainer}>
                    <Text style={styles.attachedPhotoLabel}>📸 Attached Work / Experience Photo:</Text>
                    <Image source={{ uri: myRating.photoUrl }} style={styles.attachedWorkImage} />
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.pendingReviewBanner}>
                <Text style={styles.pendingReviewIcon}>✍️</Text>
                <View style={styles.pendingReviewTextContainer}>
                  <Text style={styles.pendingReviewTitle}>
                    Rate {targetUser.name}
                  </Text>
                  <Text style={styles.pendingReviewSub}>
                    {isCustomer
                      ? 'Leave a review for the helper. You can optionally attach a photo of the completed work.'
                      : 'Leave a review for the customer. Uploading a photo is optional.'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.openReviewBtn}
                  onPress={() => setShowReviewModal(true)}
                >
                  <LinearGradient
                    colors={[colors.brandPrimary, colors.accentIndigo]}
                    style={styles.openReviewGradient}
                  >
                    <Text style={styles.openReviewBtnText}>⭐ Write a Review</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Partner's Review (if already submitted) */}
            {otherRating && (
              <View style={styles.otherReviewCard}>
                <View style={styles.reviewCardTop}>
                  <Text style={styles.otherReviewName}>
                    {otherRating.raterId?.name || (isCustomer ? 'Helper' : 'Customer')}'s Feedback
                  </Text>
                  <Text style={styles.starText}>
                    {'★'.repeat(otherRating.score)}
                    <Text style={styles.starEmptyText}>{'★'.repeat(Math.max(0, 5 - otherRating.score))}</Text>
                  </Text>
                </View>
                {otherRating.review ? (
                  <Text style={styles.reviewCommentText}>"{otherRating.review}"</Text>
                ) : null}
                {otherRating.tags && otherRating.tags.length > 0 && (
                  <View style={styles.reviewTagsRow}>
                    {otherRating.tags.map((t: string) => (
                      <Text key={t} style={styles.reviewTagPill}>{t}</Text>
                    ))}
                  </View>
                )}
                {otherRating.photoUrl && (
                  <View style={styles.attachedWorkPhotoContainer}>
                    <Text style={styles.attachedPhotoLabel}>📸 Attached Photo:</Text>
                    <Image source={{ uri: otherRating.photoUrl }} style={styles.attachedWorkImage} />
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* PERMANENT DELETE TASK BUTTON (Customer only, for uncompleted tasks) */}
        {(isTaskCreator || isCustomer) && currentTask.status !== 'completed' && (
          <TouchableOpacity
            style={styles.deleteTaskBtn}
            onPress={handleDeleteTask}
            disabled={isActionLoading}
          >
            <AppIcon name="trash-2" width={16} height={16} color="#ef4444" />
            <Text style={styles.deleteTaskBtnText}>Permanently Delete This Task</Text>
          </TouchableOpacity>
        )}

        {/* MODALS */}
        <TaskLiveTrackingModal
          visible={showLiveTrackingModal}
          onClose={() => setShowLiveTrackingModal(false)}
          taskId={currentTask._id}
          taskTitle={currentTask.title}
          taskAddress={currentTask.location?.address || 'Task Destination'}
          taskCoords={currentTask.location?.coordinates || [77.5946, 12.9716]}
          helper={currentTask.helperId}
          customer={currentTask.customerId}
          recipient={currentTask.recipient}
          isHelperView={!isCustomer}
          taskStatus={currentTask.status}
          onOpenChat={() => {
            setShowLiveTrackingModal(false);
            navigation.navigate('Chat', { taskId: currentTask._id });
          }}
        />

        <ProofModal
          visible={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          task={currentTask}
          onSuccess={() => {
            fetchTaskById(currentTask._id);
            loadTaskRatings();
            setShowReviewModal(true);
          }}
        />

        <QRCodeModal
          visible={showQrModal}
          onClose={() => setShowQrModal(false)}
          task={currentTask}
        />

        <ReviewModal
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          taskId={currentTask._id}
          targetUser={targetUser}
          isCustomer={isCustomer}
          onSuccess={() => {
            loadTaskRatings();
            fetchTaskById(currentTask._id);
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCanvas,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgCanvas,
  },
  headerBox: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  topMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.bgElevated,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  categoryText: {
    color: colors.brandPrimary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  statusPillBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusInProgress: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusAssigned: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  statusPillText: {
    color: colors.brandPrimary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.black,
    marginBottom: spacing.xs,
  },
  budgetAmount: {
    color: '#10b981',
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.black,
    marginBottom: spacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    flex: 1,
  },
  landmarkBanner: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  landmarkText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  recipientBanner: {
    marginTop: spacing.xs,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  recipientText: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  scheduleBanner: {
    marginTop: spacing.xs,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  scheduleText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  completedCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  completedIcon: {
    fontSize: 24,
  },
  completedTitle: {
    color: '#10b981',
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
  completedSub: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  verifiedBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  passcodeCard: {
    backgroundColor: '#17142b',
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  passcodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  passcodeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passcodeTitle: {
    color: '#f59e0b',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  showPasscodeText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  passcodeDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  boldWhite: {
    color: '#fff',
    fontWeight: fontWeights.bold,
  },
  passcodeDigitsBox: {
    backgroundColor: '#0c0a1a',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  passcodeDigits: {
    color: '#f59e0b',
    fontSize: 28,
    fontWeight: fontWeights.black,
    letterSpacing: 4,
  },
  passcodeActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  qrBtn: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  qrBtnText: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  chatActionBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  chatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  chatActionBtnText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  sectionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sectionHeading: {
    color: colors.textTertiary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  descriptionText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  personName: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
  personRating: {
    color: '#fbbf24',
    fontSize: 11,
    marginTop: 2,
  },
  actionsSection: {
    marginBottom: spacing.md,
  },
  primaryActionBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryActionBtnText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  bidFormCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
  },
  bidFormTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.sm,
  },
  quickPresetRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  presetBtnActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  presetBtnText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  presetBtnTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sendBidBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  sendBidBtnText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  startTaskBtn: {
    backgroundColor: '#059669',
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
  },
  startTaskBtnText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  otpVerifyBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
  },
  otpVerifyBtnText: {
    color: '#000',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  emptyBidsBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  emptyBidsIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  noBidsText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  noBidsSub: {
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: 2,
  },
  bidCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bidHelperName: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  bidRating: {
    color: '#fbbf24',
    fontSize: 10,
    marginTop: 1,
  },
  bidPrice: {
    color: '#10b981',
    fontSize: fontSizes.base,
    fontWeight: fontWeights.black,
  },
  bidMsg: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  cancelAssignmentBtn: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelAssignmentBtnText: {
    color: '#ef4444',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  bidActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  rejectBidBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBidBtnText: {
    color: '#ef4444',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  acceptBidBtn: {
    flex: 2,
    backgroundColor: '#10b981',
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBidBtnText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  reviewSectionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  reviewSectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  reviewSectionSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  pendingReviewBanner: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: spacing.md,
  },
  pendingReviewIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  pendingReviewTextContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pendingReviewTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  pendingReviewSub: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  openReviewBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  openReviewGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  openReviewBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  myReviewCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  otherReviewCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  reviewCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reviewBadge: {
    color: colors.brandPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  otherReviewName: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  starText: {
    color: '#FBBF24',
    fontSize: fontSizes.md,
  },
  starEmptyText: {
    color: 'rgba(255, 255, 255, 0.2)',
  },
  reviewCommentText: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontStyle: 'italic',
    marginVertical: spacing.xs,
    lineHeight: 18,
  },
  reviewTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  reviewTagPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: colors.brandPrimary,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  attachedWorkPhotoContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  attachedPhotoLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginBottom: spacing.xs,
    fontWeight: fontWeights.semibold,
  },
  attachedWorkImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: colors.bgCanvas,
  },
  bidsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bidsSubHeading: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  refreshOffersBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  refreshOffersText: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  checkBidsBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  checkBidsBtnText: {
    color: colors.brandPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  bidHelperAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
    backgroundColor: colors.bgCanvas,
  },
  bidHelperMeta: {
    flex: 1,
  },
  bidHelperTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedBadgeIcon: {
    backgroundColor: '#10b981',
    color: '#fff',
    fontSize: 9,
    fontWeight: fontWeights.black,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  bidMsgBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: spacing.xs,
    marginVertical: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: colors.brandPrimary,
  },
  negotiateBidBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingVertical: spacing.sm,
    borderRadius: 10,
    gap: 4,
  },
  negotiateBidBtnText: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  rejectedBidCard: {
    opacity: 0.5,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  rejectedTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  rejectedTagText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  liveTrackingBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  liveRouteBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  liveTrackingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  liveTrackingIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  liveTrackingIcon: {
    fontSize: 26,
  },
  liveTrackingTitle: {
    color: '#ffffff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  liveTrackingSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  liveTrackingArrow: {
    color: '#ffffff',
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    marginLeft: spacing.sm,
  },
  deleteTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingVertical: spacing.md,
    borderRadius: 14,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  deleteTaskBtnText: {
    color: '#ef4444',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
});
