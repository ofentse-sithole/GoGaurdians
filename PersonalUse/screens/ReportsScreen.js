import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firestore } from '../../firebaseConfig'; // Adjust path as needed
import * as Location from 'expo-location';

const ReportsScreen = () => {
  // User and authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    active: 0,
    resolved: 0,
  });

  // Location state
  const [currentLocation, setCurrentLocation] = useState({
    address: 'Getting location...',
    coordinates: null,
  });

  // Report form state
  const [isReporting, setIsReporting] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [reportData, setReportData] = useState({
    title: '',
    description: '',
    category: '',
    severity: 'medium',
    timeOfIncident: '',
    additionalInfo: '',
    needsImmediateAssistance: false,
  });
  
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initialize user authentication and location
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserReports(user.uid);
      } else {
        setCurrentUser(null);
        setIncidents([]);
        setLoading(false);
      }
    });

    getCurrentLocation();

    return () => unsubscribeAuth();
  }, []);

  // Fetch user-specific reports from Firestore
  const fetchUserReports = (userId) => {
    setLoading(true);
    
    const reportsQuery = query(
      collection(firestore, 'reports'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const userReports = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        userReports.push({
          id: doc.id,
          ...data,
          // Convert Firestore Timestamp to JavaScript Date
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      setIncidents(userReports);
      calculateStats(userReports);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to load your reports. Please try again.');
      setLoading(false);
    });

    return unsubscribe;
  };

  // Calculate statistics from user reports
  const calculateStats = (reports) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthReports = reports.filter(report => {
      const reportDate = report.createdAt;
      return reportDate.getMonth() === currentMonth && 
             reportDate.getFullYear() === currentYear;
    });

    const activeReports = reports.filter(report => 
      report.status === 'Reported' || report.status === 'Under Investigation'
    );

    const resolvedReports = reports.filter(report => 
      report.status === 'Resolved' || report.status === 'Closed'
    );

    setStats({
      total: reports.length,
      thisMonth: thisMonthReports.length,
      active: activeReports.length,
      resolved: resolvedReports.length,
    });
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentLocation({
          address: 'Location permission denied',
          coordinates: null,
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const formattedAddress = [
          address.street,
          address.city,
          address.region
        ].filter(Boolean).join(', ');

        setCurrentLocation({
          address: formattedAddress || 'Location detected',
          coordinates: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setCurrentLocation({
        address: 'Unable to get location',
        coordinates: null,
      });
    }
  };

  // Refresh reports
  const onRefresh = async () => {
    setRefreshing(true);
    if (currentUser) {
      await getCurrentLocation();
      // The onSnapshot listener will automatically update the reports
    }
    setRefreshing(false);
  };

  // Start reporting process
  const startReporting = (type) => {
    if (!currentUser) {
      Alert.alert('Authentication Required', 'Please log in to report incidents.');
      return;
    }

    setSelectedReportType(type);
    setIsReporting(true);
    setReportData({
      title: '',
      description: '',
      category: type,
      severity: 'medium',
      timeOfIncident: '',
      additionalInfo: '',
      needsImmediateAssistance: false,
    });

    // Animate form appearance
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Scroll to form
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Cancel reporting
  const cancelReporting = () => {
    Alert.alert(
      'Cancel Report',
      'Are you sure you want to cancel this report? All information will be lost.',
      [
        { text: 'Continue Reporting', style: 'cancel' },
        { 
          text: 'Cancel Report', 
          style: 'destructive',
          onPress: () => {
            setIsReporting(false);
            setSelectedReportType(null);
            setReportData({
              title: '',
              description: '',
              category: '',
              severity: 'medium',
              timeOfIncident: '',
              additionalInfo: '',
              needsImmediateAssistance: false,
            });
            fadeAnim.setValue(0);
          }
        }
      ]
    );
  };

  // Submit incident report
  const submitReport = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to submit a report.');
      return;
    }

    if (!reportData.title.trim() || !reportData.description.trim()) {
      Alert.alert('Error', 'Please fill in at least the title and description.');
      return;
    }

    setSubmittingReport(true);

    try {
      // Generate a unique report ID
      const reportId = `RPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const reportDoc = {
        reportId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        title: reportData.title,
        description: reportData.description,
        category: reportData.category,
        severity: reportData.severity,
        timeOfIncident: reportData.timeOfIncident,
        additionalInfo: reportData.additionalInfo,
        needsImmediateAssistance: reportData.needsImmediateAssistance,
        location: {
          address: currentLocation.address,
          coordinates: currentLocation.coordinates,
        },
        status: 'Reported',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'reports'), reportDoc);

      Alert.alert(
        'Report Submitted',
        `Your report has been submitted successfully. Report ID: ${reportId}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setIsReporting(false);
              setSelectedReportType(null);
              setReportData({
                title: '',
                description: '',
                category: '',
                severity: 'medium',
                timeOfIncident: '',
                additionalInfo: '',
                needsImmediateAssistance: false,
              });
              fadeAnim.setValue(0);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }

    setSubmittingReport(false);
  };

  // Utility functions
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Reported':
        return { bg: 'rgba(255, 184, 0, 0.15)', text: '#FFB800' };
      case 'Under Investigation':
        return { bg: 'rgba(0, 217, 255, 0.15)', text: '#00D9FF' };
      case 'Resolved':
        return { bg: 'rgba(76, 175, 80, 0.15)', text: '#4CAF50' };
      case 'Closed':
        return { bg: 'rgba(158, 158, 158, 0.15)', text: '#9E9E9E' };
      default:
        return { bg: 'rgba(160, 175, 187, 0.15)', text: '#A0AFBB' };
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 2) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatReportId = (id) => {
    return id.length > 12 ? `${id.substring(0, 12)}...` : id;
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authPrompt}>
          <MaterialIcons name="account-circle" size={80} color="#A0AFBB" />
          <Text style={styles.authPromptTitle}>Authentication Required</Text>
          <Text style={styles.authPromptText}>
            Please log in to view and submit incident reports.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Incident Reports</Text>
              <Text style={styles.headerSubtitle}>
                Report and track incidents in your area
              </Text>
            </View>
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconBox}>
                <MaterialIcons name="assignment" size={20} color="#00D9FF" />
              </View>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconBox}>
                <MaterialIcons name="today" size={20} color="#00D9FF" />
              </View>
              <Text style={styles.statValue}>{stats.thisMonth}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconBox}>
                <MaterialIcons name="pending" size={20} color="#00D9FF" />
              </View>
              <Text style={styles.statValue}>{stats.active}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconBox}>
                <MaterialIcons name="check-circle" size={20} color="#00D9FF" />
              </View>
              <Text style={styles.statValue}>{stats.resolved}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>

          {/* Location Card */}
          <View style={styles.locationCard}>
            <MaterialIcons name="location-on" size={24} color="#00D9FF" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Current Location</Text>
              <Text style={styles.locationText}>{currentLocation.address}</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={getCurrentLocation}>
              <MaterialIcons name="refresh" size={20} color="#00D9FF" />
            </TouchableOpacity>
          </View>

          {/* Report Type Buttons */}
          {!isReporting && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Report an Incident</Text>
              <View style={styles.reportTypeContainer}>
                <TouchableOpacity
                  style={[styles.reportTypeButton, styles.crimeButton]}
                  onPress={() => startReporting('Crime')}
                >
                  <MaterialIcons name="security" size={32} color="#FF6B6B" />
                  <Text style={[styles.reportTypeText, { color: '#FF6B6B' }]}>
                    Crime
                  </Text>
                  <Text style={styles.reportTypeSubtext}>
                    Theft, assault, vandalism
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reportTypeButton, styles.communityButton]}
                  onPress={() => startReporting('Community Issue')}
                >
                  <MaterialIcons name="groups" size={32} color="#FFB800" />
                  <Text style={[styles.reportTypeText, { color: '#FFB800' }]}>
                    Community
                  </Text>
                  <Text style={styles.reportTypeSubtext}>
                    Infrastructure, noise
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Report Form */}
          {isReporting && (
            <Animated.View style={[styles.reportForm, { opacity: fadeAnim }]}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  Report {selectedReportType}
                </Text>
                <TouchableOpacity onPress={cancelReporting}>
                  <MaterialIcons name="close" size={24} color="#A0AFBB" />
                </TouchableOpacity>
              </View>

              <View style={styles.formContent}>
                {/* Title */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Report Title *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Brief title for the incident"
                    placeholderTextColor="#A0AFBB"
                    value={reportData.title}
                    onChangeText={(text) => setReportData(prev => ({ ...prev, title: text }))}
                  />
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description *</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Describe what happened in detail"
                    placeholderTextColor="#A0AFBB"
                    multiline
                    numberOfLines={4}
                    value={reportData.description}
                    onChangeText={(text) => setReportData(prev => ({ ...prev, description: text }))}
                  />
                </View>

                {/* Severity */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Severity Level</Text>
                  <View style={styles.severityContainer}>
                    {['low', 'medium', 'high'].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.severityButton,
                          reportData.severity === level && styles.severityButtonActive,
                          { borderColor: getSeverityColor(level) }
                        ]}
                        onPress={() => setReportData(prev => ({ ...prev, severity: level }))}
                      >
                        <MaterialIcons 
                          name={getSeverityIcon(level)} 
                          size={20} 
                          color={reportData.severity === level ? getSeverityColor(level) : '#A0AFBB'} 
                        />
                        <Text style={[
                          styles.severityText,
                          reportData.severity === level && { color: getSeverityColor(level) }
                        ]}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Time of Incident */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Time of Incident</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="When did this happen? (e.g., 2 hours ago, this morning)"
                    placeholderTextColor="#A0AFBB"
                    value={reportData.timeOfIncident}
                    onChangeText={(text) => setReportData(prev => ({ ...prev, timeOfIncident: text }))}
                  />
                </View>

                {/* Additional Info */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Additional Information</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Any additional details, witnesses, or relevant information"
                    placeholderTextColor="#A0AFBB"
                    multiline
                    numberOfLines={3}
                    value={reportData.additionalInfo}
                    onChangeText={(text) => setReportData(prev => ({ ...prev, additionalInfo: text }))}
                  />
                </View>

                {/* Immediate Assistance */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setReportData(prev => ({ 
                    ...prev, 
                    needsImmediateAssistance: !prev.needsImmediateAssistance 
                  }))}
                >
                  <MaterialIcons 
                    name={reportData.needsImmediateAssistance ? "check-box" : "check-box-outline-blank"} 
                    size={24} 
                    color={reportData.needsImmediateAssistance ? "#00D9FF" : "#A0AFBB"} 
                  />
                  <Text style={styles.checkboxText}>
                    This incident requires immediate assistance
                  </Text>
                </TouchableOpacity>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    submittingReport && styles.submitButtonDisabled
                  ]}
                  onPress={submitReport}
                  disabled={submittingReport}
                >
                  {submittingReport ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <MaterialIcons name="send" size={20} color="#000000" />
                  )}
                  <Text style={styles.submitButtonText}>
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Recent Reports */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Recent Reports</Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00D9FF" />
                <Text style={styles.loadingText}>Loading reports...</Text>
              </View>
            ) : incidents.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="assignment" size={48} color="#A0AFBB" />
                <Text style={styles.emptyStateTitle}>No Reports Yet</Text>
                <Text style={styles.emptyStateText}>
                  You haven't submitted any incident reports. Tap one of the buttons above to report an incident.
                </Text>
              </View>
            ) : (
              <View style={styles.reportsContainer}>
                {incidents.map((incident) => (
                  <View key={incident.id} style={styles.incidentCard}>
                    <View 
                      style={[
                        styles.severityIndicator, 
                        { backgroundColor: getSeverityColor(incident.severity) }
                      ]} 
                    />
                    <View style={styles.incidentContent}>
                      <View style={styles.incidentHeader}>
                        <View style={styles.incidentTypeContainer}>
                          <MaterialIcons 
                            name={getSeverityIcon(incident.severity)} 
                            size={16} 
                            color={getSeverityColor(incident.severity)} 
                          />
                          <Text style={[
                            styles.incidentType, 
                            { color: getSeverityColor(incident.severity) }
                          ]}>
                            {incident.category}
                          </Text>
                        </View>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(incident.status).bg }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            { color: getStatusColor(incident.status).text }
                          ]}>
                            {incident.status}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={styles.incidentTitle} numberOfLines={1}>
                        {incident.title}
                      </Text>
                      
                      <Text style={styles.incidentDescription} numberOfLines={2}>
                        {incident.description}
                      </Text>
                      
                      <View style={styles.incidentMeta}>
                        <View style={styles.metaItem}>
                          <MaterialIcons name="schedule" size={12} color="#A0AFBB" />
                          <Text style={styles.metaText}>
                            {formatDate(incident.createdAt)}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <MaterialIcons name="location-on" size={12} color="#A0AFBB" />
                          <Text style={styles.metaText} numberOfLines={1}>
                            {incident.location?.address || 'Location not available'}
                          </Text>
                        </View>
                        <View style={styles.reportIdContainer}>
                          <MaterialIcons name="confirmation-number" size={12} color="#00D9FF" />
                          <Text style={styles.reportIdText}>
                            {formatReportId(incident.reportId)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  authPromptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  authPromptText: {
    fontSize: 14,
    color: '#A0AFBB',
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    paddingVertical: 20,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A0AFBB',
    textAlign: 'left',
    lineHeight: 20,
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
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D9FF',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  reportTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    gap: 8,
  },
  crimeButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.06)',
    borderColor: 'rgba(255, 107, 107, 0.15)',
  },
  communityButton: {
    backgroundColor: 'rgba(255, 184, 0, 0.06)',
    borderColor: 'rgba(255, 184, 0, 0.15)',
  },
  reportTypeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  reportTypeSubtext: {
    fontSize: 11,
    color: '#A0AFBB',
    textAlign: 'center',
  },
  reportForm: {
    backgroundColor: 'rgba(0, 217, 255, 0.04)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formContent: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  severityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
  },
  severityButtonActive: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0AFBB',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkboxText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#00D9FF',
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(0, 217, 255, 0.5)',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#A0AFBB',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#A0AFBB',
    textAlign: 'center',
    lineHeight: 20,
  },
  reportsContainer: {
    gap: 12,
  },
  incidentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 217, 255, 0.04)',
    borderRadius: 14,
    padding: 16,
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
    top: 0,
    bottom: 0,
  },
  incidentContent: {
    flex: 1,
    marginLeft: 8,
    gap: 8,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  incidentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  incidentDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  incidentMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#A0AFBB',
    flex: 1,
  },
  reportIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportIdText: {
    fontSize: 11,
    color: '#00D9FF',
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});

export default ReportsScreen;