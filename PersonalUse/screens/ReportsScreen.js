import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Switch,
  Linking,
  FlatList,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '../../firebaseConfig';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import * as Location from 'expo-location';

const ReportsScreen = () => {
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addressCache, setAddressCache] = useState({}); // { [alertId]: '123 Main St, City' }

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'Community Report',
    severity: 'low',
    description: '',
    includeLocation: true,
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return '#FFB800';
      case 'low':
        return '#00D9FF';
      default:
        return '#A0AFBB';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };

  // Subscribe to community alerts
  useEffect(() => {
    try {
      const q = query(
        collection(firestore, 'communityAlerts'),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, (snap) => {
        const list = [];
        snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        setAlerts(list);
        setLoading(false);
      }, (err) => {
        console.error('Alerts subscription error:', err);
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      console.error('Failed to subscribe to alerts:', e);
      setLoading(false);
    }
  }, []);

  // Reverse geocode locations to human-readable street names
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        for (const a of alerts) {
          if (!a?.location?.latitude || !a?.location?.longitude) continue;
          if (addressCache[a.id]) continue;
          try {
            const results = await Location.reverseGeocodeAsync({
              latitude: a.location.latitude,
              longitude: a.location.longitude,
            });
            if (cancelled) return;
            const addrObj = results && results[0];
            const format = (o) => {
              if (!o) return null;
              const streetLine = [o.streetNumber, o.street || o.name].filter(Boolean).join(' ');
              const cityLine = [o.city || o.subregion, o.region].filter(Boolean).join(', ');
              return [streetLine || null, cityLine || null].filter(Boolean).join(', ');
            };
            const pretty = format(addrObj) || 'Location';
            setAddressCache((prev) => ({ ...prev, [a.id]: pretty }));
          } catch (e) {
            // Non-fatal; skip this address
          }
        }
      } catch (e) {
        // ignore batch error
      }
    })();
    return () => { cancelled = true; };
  }, [alerts]);


  const onRefresh = async () => {
    setRefreshing(true);
    // Snapshot is real-time; just end refresh quickly
    setTimeout(() => setRefreshing(false), 400);
  };

  const timeAgo = (ts) => {
    const t = typeof ts?.toMillis === 'function' ? ts.toMillis() : (typeof ts === 'number' ? ts : Date.parse(ts));
    if (!t) return '';
    const diffMs = Date.now() - t;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const computedStats = useMemo(() => {
    const total = alerts.length;
    const now = new Date();
    const thisMonth = alerts.filter(a => {
      const dt = a.createdAt && typeof a.createdAt.toMillis === 'function' ? new Date(a.createdAt.toMillis()) : (a.createdAt ? new Date(a.createdAt) : null);
      return dt && dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length;
    const resolved = alerts.filter(a => (a.status || 'Reported') === 'Resolved').length;
    const active = Math.max(0, total - resolved);
    return { total, thisMonth, active, resolved };
  }, [alerts]);

  // Filters removed: show all alerts with no radius or ownership filtering

  const openInMaps = (location) => {
    if (location?.latitude && location?.longitude) {
      const { latitude, longitude } = location;
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      Linking.openURL(url);
    }
  };

  const resetForm = () => setForm({ title: '', type: 'Community Report', severity: 'low', description: '', includeLocation: true });
  const closeModal = () => { setShowReportModal(false); resetForm(); };

  const submitReport = async () => {
    try {
      if (!form.title.trim() || !form.description.trim()) {
        Alert.alert('Missing info', 'Please provide a title and description.');
        return;
      }
      setSubmitting(true);
      let loc = null;
      if (form.includeLocation) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          loc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? null,
          };
        }
      }
      const payload = {
        title: form.title.trim(),
        type: form.type,
        severity: form.severity,
        description: form.description.trim(),
        status: 'Reported',
        location: loc,
        createdBy: {
          uid: auth?.currentUser?.uid || null,
          displayName: auth?.currentUser?.displayName || null,
          email: auth?.currentUser?.email || null,
        },
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(firestore, 'communityAlerts'), payload);
      setSubmitting(false);
      closeModal();
      Alert.alert('Reported', 'Your incident report has been submitted.');
    } catch (e) {
      console.error('Failed to submit report:', e);
      setSubmitting(false);
      Alert.alert('Error', 'Could not submit the report.');
    }
  };

  const updateStatus = async (alertId, newStatus) => {
    try {
      await updateDoc(doc(firestore, 'communityAlerts', alertId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Failed to update status:', e);
      Alert.alert('Error', 'Could not update status.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons name="assessment" size={24} color="#00D9FF" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Community Alerts</Text>
            <Text style={styles.headerSubtitle}>Stay informed and report incidents</Text>
          </View>
        </View>
      </View>

      <FlatList
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 20 }}
        data={alerts}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <>
            {/* Statistics */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <View style={styles.statIconBox}>
                  <MaterialIcons name="summarize" size={24} color="#00D9FF" />
                </View>
                <Text style={styles.statValue}>{computedStats.total}</Text>
                <Text style={styles.statLabel}>Total Reports</Text>
              </View>

              <View style={styles.statItem}>
                <View style={styles.statIconBox}>
                  <MaterialIcons name="calendar-today" size={24} color="#00D9FF" />
                </View>
                <Text style={styles.statValue}>{computedStats.thisMonth}</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>

              <View style={styles.statItem}>
                <View style={styles.statIconBox}>
                  <MaterialIcons name="trending-up" size={24} color="#00D9FF" />
                </View>
                <Text style={styles.statValue}>{computedStats.resolved}</Text>
                <Text style={styles.statLabel}>Resolved</Text>
              </View>

              <View style={styles.statItem}>
                <View style={styles.statIconBox}>
                  <MaterialIcons name="update" size={24} color="#FFB800" />
                </View>
                <Text style={styles.statValue}>{computedStats.active}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </View>

            {/* Section title */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Reports</Text>
              {loading && <Text style={{ color: '#A0AFBB' }}>Loading…</Text>}
            </View>
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={[styles.section, { paddingHorizontal: 16 }]}>
              <View style={styles.emptyState}>
                <MaterialIcons name="report" size={48} color="#A0AFBB" />
                <Text style={styles.emptyStateTitle}>No alerts yet</Text>
                <Text style={styles.emptyStateText}>Be the first to report an incident to help your community.</Text>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.incidentCard}
            onPress={() => {
              const hasLoc = !!item.location?.latitude;
              Alert.alert(
                `${item.type || 'Report'} - ${item.status || 'Reported'}`,
                `${item.title ? item.title + '\n' : ''}${item.description || ''}` + (hasLoc ? `\n\nTap OK to open map.` : ''),
                [
                  { text: 'Close', style: 'cancel' },
                  ...(hasLoc ? [{ text: 'Open Map', onPress: () => openInMaps(item.location) }] : []),
                ]
              );
            }}
          >
            <View
              style={[
                styles.severityIndicator,
                { backgroundColor: getSeverityColor(item.severity) },
              ]}
            />

            <View style={styles.incidentContent}>
              <View style={styles.incidentHeader}>
                <View style={styles.incidentTypeContainer}>
                  <MaterialIcons
                    name={getSeverityIcon(item.severity)}
                    size={16}
                    color={getSeverityColor(item.severity)}
                  />
                  <Text
                    style={[styles.incidentType, { color: getSeverityColor(item.severity) }]}
                  >
                    {item.type || 'Report'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        (item.status || 'Reported') === 'Resolved'
                          ? 'rgba(0, 217, 255, 0.15)'
                          : (item.status || 'Reported') === 'Responded'
                          ? 'rgba(255, 184, 0, 0.15)'
                          : 'rgba(255, 107, 107, 0.15)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          (item.status || 'Reported') === 'Resolved'
                            ? '#00D9FF'
                            : (item.status || 'Reported') === 'Responded'
                            ? '#FFB800'
                            : '#FF6B6B',
                      },
                    ]}
                  >
                    {item.status || 'Reported'}
                  </Text>
                </View>
              </View>

              {!!item.title && (
                <Text style={styles.incidentTitle}>{item.title}</Text>
              )}
              {!!item.description && (
                <Text style={styles.incidentDescription}>{item.description}</Text>
              )}

              <View style={styles.incidentMeta}>
                {item.location?.latitude && (
                  <TouchableOpacity style={styles.metaItem} onPress={() => openInMaps(item.location)}>
                    <MaterialIcons name="location-on" size={14} color="#A0AFBB" />
                    <Text style={styles.metaText}>{addressCache[item.id] || 'Location attached'}</Text>
                  </TouchableOpacity>
                )}
                {item.createdAt && (
                  <View style={styles.metaItem}>
                    <MaterialIcons name="schedule" size={14} color="#A0AFBB" />
                    <Text style={styles.metaText}>{timeAgo(item.createdAt)}</Text>
                  </View>
                )}
              </View>

              {/* Actions (creator-only for now) */}
              {auth?.currentUser?.uid && item.createdBy?.uid === auth.currentUser.uid && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={[styles.actionPill, { borderColor: '#FFB800' }]} onPress={() => updateStatus(item.id, 'Responded')}>
                    <MaterialIcons name="task-alt" size={14} color="#FFB800" />
                    <Text style={[styles.actionPillText, { color: '#FFB800' }]}>Mark Responded</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionPill, { borderColor: '#00D9FF' }]} onPress={() => updateStatus(item.id, 'Resolved')}>
                    <MaterialIcons name="done-all" size={14} color="#00D9FF" />
                    <Text style={[styles.actionPillText, { color: '#00D9FF' }]}>Mark Resolved</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <MaterialIcons name="chevron-right" size={24} color="#A0AFBB" />
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <>
            {/* Report Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Safety Profile</Text>

              <View style={styles.profileCard}>
                <View style={styles.profileMetric}>
                  <Text style={styles.profileLabel}>Response Rate</Text>
                  <Text style={styles.profileValue}>98%</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.profileMetric}>
                  <Text style={styles.profileLabel}>Avg Response Time</Text>
                  <Text style={styles.profileValue}>4 min</Text>
                </View>
              </View>

              <View style={styles.infoBox}>
                <AntDesign name="infocirlce" size={20} color="#00D9FF" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Report Details</Text>
                  <Text style={styles.infoText}>
                    All reports are confidential and encrypted. Your data helps improve community safety.
                  </Text>
                </View>
              </View>
            </View>

            {/* Export Section */}
            <View style={styles.section}>
              <TouchableOpacity style={styles.exportButton}>
                <MaterialIcons name="download" size={20} color="#000000" />
                <Text style={styles.exportButtonText}>Export Report History</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.spacer} />
          </>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Report Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowReportModal(true)}>
        <MaterialIcons name="report" size={22} color="#000" />
        <Text style={styles.fabText}>Report</Text>
      </TouchableOpacity>

      {/* Report Incident Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowReportModal(false)}
      >
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.sheet}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Report Incident</Text>
                  <TouchableOpacity onPress={() => setShowReportModal(false)}>
                    <MaterialIcons name="close" size={22} color="#0F1419" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Title *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Short title"
                      value={form.title}
                      onChangeText={(t) => setForm({ ...form, title: t })}
                    />
                  </View>

                  <View style={styles.rowChips}>
                    {['Community Report', 'Safety Concern', 'Crime Alert', 'Hazard'].map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setForm({ ...form, type: t })}
                        style={[styles.chip, form.type === t && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, form.type === t && styles.chipTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.rowChips}>
                    {['low', 'medium', 'high'].map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setForm({ ...form, severity: s })}
                        style={[styles.chip, form.severity === s && styles.chipActive]}
                      >
                        <MaterialIcons name={getSeverityIcon(s)} size={14} color={form.severity === s ? '#000' : '#A0AFBB'} />
                        <Text style={[styles.chipText, form.severity === s && styles.chipTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description *</Text>
                    <TextInput
                      style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                      placeholder="Describe what happened"
                      value={form.description}
                      onChangeText={(t) => setForm({ ...form, description: t })}
                      multiline
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.switchRow]}>
                    <Text style={styles.inputLabel}>Attach my current location</Text>
                    <Switch
                      value={form.includeLocation}
                      onValueChange={(v) => setForm({ ...form, includeLocation: v })}
                      trackColor={{ false: '#374151', true: '#00D9FF' }}
                      thumbColor={form.includeLocation ? '#FFFFFF' : '#9CA3AF'}
                    />
                  </View>

                  <Text style={styles.requiredNote}>* Required fields</Text>
                </ScrollView>

                <View style={styles.sheetFooter}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowReportModal(false)} disabled={submitting}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitBtn, (submitting || !form.title.trim() || !form.description.trim()) && styles.submitBtnDisabled]}
                    disabled={submitting || !form.title.trim() || !form.description.trim()}
                    onPress={submitReport}
                  >
                    <Text style={[styles.submitBtnText, (submitting || !form.title.trim() || !form.description.trim()) && styles.submitBtnTextDisabled]}>
                      {submitting ? 'Submitting…' : 'Submit Report'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 217, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 217, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A0AFBB',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00D9FF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#A0AFBB',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  emptyState: {
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
    borderStyle: 'dashed',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#A0AFBB',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  incidentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 217, 255, 0.04)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.1)',
    gap: 12,
  },
  severityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
  },
  incidentContent: {
    flex: 1,
    marginLeft: 8,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  incidentTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  incidentType: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  incidentDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  incidentMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#A0AFBB',
  },
  respondersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 217, 255, 0.1)',
  },
  respondersText: {
    fontSize: 11,
    color: '#00D9FF',
    fontWeight: '600',
  },
  incidentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
  },
  profileMetric: {
    flex: 1,
    alignItems: 'center',
  },
  profileLabel: {
    fontSize: 12,
    color: '#A0AFBB',
    marginBottom: 6,
  },
  profileValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00D9FF',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    marginHorizontal: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#A0AFBB',
    lineHeight: 18,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#00D9FF',
    borderRadius: 12,
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  spacer: {
    height: 20,
  },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  actionPillText: { fontSize: 12, fontWeight: '700' },
  // FAB
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: '#00D9FF',
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  // Modal styles
  kav: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '55%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#0F1419' },
  inputGroup: { marginVertical: 10 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#0F1419', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F1419',
    backgroundColor: '#F9FAFB',
  },
  rowChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#00D9FF', borderColor: '#00D9FF' },
  chipText: { color: '#0F1419', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#000' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  requiredNote: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginTop: 6 },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#fff',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#0F1419' },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#00D9FF',
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#E5E7EB' },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  submitBtnTextDisabled: { color: '#9CA3AF' },
});

export default ReportsScreen;
