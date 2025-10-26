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

  // Chat-related state
  const [chatMessages, setChatMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportData, setReportData] = useState({
    description: '',
    timeOfIncident: '',
    additionalInfo: '',
    needsImmediateAssistance: false,
  });
  
  const scrollViewRef = useRef();
  const chatScrollRef = useRef();
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

  // Chat animation effect
  useEffect(() => {
    if (chatMessages.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [chatMessages]);

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

  // Chat and reporting functions
  const startReporting = (type) => {
    if (!currentUser) {
      Alert.alert('Authentication Required', 'Please log in to report incidents.');
      return;
    }

    setSelectedReportType(type);
    setIsReporting(true);
    const welcomeMessage = {
      id: Date.now(),
      text: `You're reporting a ${type}. Please describe what happened at your current location: ${currentLocation.address}`,
      isBot: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages([welcomeMessage]);
    
    // Scroll to bottom to show chat
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      isBot: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMessage]);
    
    // Store user responses in report data
    if (chatMessages.length === 1) {
      setReportData(prev => ({ ...prev, description: inputText }));
    } else if (chatMessages.length === 3) {
      setReportData(prev => ({ ...prev, timeOfIncident: inputText }));
    } else if (chatMessages.length === 5) {
      setReportData(prev => ({ 
        ...prev, 
        needsImmediateAssistance: inputText.toLowerCase().includes('immediate') || inputText.toLowerCase().includes('urgent'),
        additionalInfo: prev.additionalInfo + ' ' + inputText
      }));
    } else {
      setReportData(prev => ({ 
        ...prev, 
        additionalInfo: prev.additionalInfo + ' ' + inputText
      }));
    }
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: generateBotResponse(inputText, chatMessages.length),
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, botResponse]);
      
      // Auto scroll to bottom
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1000);

    setInputText('');
    
    // Auto scroll to bottom
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const generateBotResponse = (userInput, messageCount) => {
    if (messageCount === 1) {
      return "Thank you for providing details. Can you tell me when this incident occurred and if anyone else was involved?";
    } else if (messageCount === 3) {
      return "I understand. Do you need immediate assistance, or is this for documentation purposes?";
    } else if (messageCount === 5) {
      return "I've gathered the essential information. Is there anything else you'd like to add about this incident?";
    } else if (messageCount === 7) {
      return "Thank you for the additional details. Your report is ready to be submitted. Please review and submit when ready.";
    } else {
      return "I've noted that information. Please continue with any additional details.";
    }
  };

  const submitReport = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to submit a report.');
      return;
    }

    if (chatMessages.length < 2) {
      Alert.alert('Incomplete Report', 'Please provide more details about the incident.');
      return;
    }

    setSubmittingReport(true);

    try {
      // Determine severity based on report type and content
      const severity = selectedReportType === 'Crime Alert' ? 'high' : 
                     reportData.needsImmediateAssistance ? 'medium' : 'low';

      // Create report document
      const reportDoc = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        type: selectedReportType,
        severity: severity,
        status: 'Reported',
        description: reportData.description,
        timeOfIncident: reportData.timeOfIncident,
        additionalInfo: reportData.additionalInfo,
        needsImmediateAssistance: reportData.needsImmediateAssistance,
        location: {
          address: currentLocation.address,
          coordinates: currentLocation.coordinates,
        },
        chatHistory: chatMessages,
        responders: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add report to Firestore
      const docRef = await addDoc(collection(firestore, 'reports'), reportDoc);
      
      Alert.alert(
        'Report Submitted',
        `Your ${selectedReportType.toLowerCase()} has been successfully submitted with ID: ${docRef.id.substring(0, 8).toUpperCase()}`,
        [
          {
            text: 'OK',
            onPress: () => {
              resetReportingState();
            },
          },
        ]
      );

    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert(
        'Submission Failed',
        'There was an error submitting your report. Please try again.',
        [
          { text: 'Retry', onPress: submitReport },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setSubmittingReport(false);
    }
  };

  const resetReportingState = () => {
    setIsReporting(false);
    setSelectedReportType(null);
    setChatMessages([]);
    setInputText('');
    setReportData({
      description: '',
      timeOfIncident: '',
      additionalInfo: '',
      needsImmediateAssistance: false,
    });
  };

  const cancelReport = () => {
    Alert.alert(
      'Cancel Report',
      'Are you sure you want to cancel this report?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: resetReportingState,
        },
      ]
    );
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D9FF" />
          <Text style={styles.loadingText}>Loading your reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show login required state
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginRequiredContainer}>
          <MaterialIcons name="account-circle" size={64} color="#A0AFBB" />
          <Text style={styles.loginRequiredTitle}>Login Required</Text>
          <Text style={styles.loginRequiredText}>
            Please log in to view and submit incident reports.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons name="assessment" size={24} color="#00D9FF" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Your Reports</Text>
            <Text style={styles.headerSubtitle}>Safety incidents you've reported</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconBox}>
                <MaterialIcons name="summarize" size={24} color="#00D9FF" />
              </View>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIconBox}>
                <MaterialIcons name="calendar-today" size={24} color="#00D9FF" />
              </View>
              <Text style={styles.statValue}>{stats.thisMonth}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIconBox}>
                <MaterialIcons name="trending-up" size={24} color="#00D9FF" />
              </View>
              <Text style={styles.statValue}>{stats.resolved}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIconBox}>
                <MaterialIcons name="update" size={24} color="#FFB800" />
              </View>
              <Text style={styles.statValue}>{stats.active}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>

          {/* Location Info */}
          <View style={styles.locationCard}>
            <MaterialIcons name="location-on" size={20} color="#00D9FF" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Current Location</Text>
              <Text style={styles.locationText}>{currentLocation.address}</Text>
            </View>
            <TouchableOpacity onPress={getCurrentLocation} style={styles.refreshButton}>
              <MaterialIcons name="refresh" size={18} color="#00D9FF" />
            </TouchableOpacity>
          </View>

          {/* Report Type Selection (when not reporting) */}
          {!isReporting && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Report New Incident</Text>
              <View style={styles.reportTypeContainer}>
                <TouchableOpacity
                  style={[styles.reportTypeButton, styles.crimeButton]}
                  onPress={() => startReporting('Crime Alert')}
                >
                  <MaterialIcons name="security" size={24} color="#FF6B6B" />
                  <Text style={styles.reportTypeText}>Crime Alert</Text>
                  <Text style={styles.reportTypeSubtext}>Report criminal activity</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reportTypeButton, styles.communityButton]}
                  onPress={() => startReporting('Community Report')}
                >
                  <MaterialIcons name="group" size={24} color="#FFB800" />
                  <Text style={styles.reportTypeText}>Community Report</Text>
                  <Text style={styles.reportTypeSubtext}>Report community issues</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Active Incidents Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>

            {incidents.map((incident) => (
              <TouchableOpacity
                key={incident.id}
                style={styles.incidentCard}
                onPress={() =>
                  Alert.alert(
                    `${incident.type} - ${incident.status}`,
                    `Location: ${incident.location}\nDescription: ${incident.description}\nResponders: ${incident.responders}`
                  )
                }
              >
                {/* Severity Indicator */}
                <View
                  style={[
                    styles.severityIndicator,
                    { backgroundColor: getSeverityColor(incident.severity) },
                  ]}
                />

                {/* Main Content */}
                <View style={styles.incidentContent}>
                  <View style={styles.incidentHeader}>
                    <View style={styles.incidentTypeContainer}>
                      <MaterialIcons
                        name={getSeverityIcon(incident.severity)}
                        size={16}
                        color={getSeverityColor(incident.severity)}
                      />
                      <Text
                        style={[
                          styles.incidentType,
                          { color: getSeverityColor(incident.severity) },
                        ]}
                      >
                        {incident.type}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            incident.status === 'Resolved'
                              ? 'rgba(0, 217, 255, 0.15)'
                              : incident.status === 'Responded'
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
                              incident.status === 'Resolved'
                                ? '#00D9FF'
                                : incident.status === 'Responded'
                                ? '#FFB800'
                                : '#FF6B6B',
                          },
                        ]}
                      >
                        {incident.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.incidentDescription}>{incident.description}</Text>

                  <View style={styles.incidentMeta}>
                    <View style={styles.metaItem}>
                      <MaterialIcons name="location-on" size={14} color="#A0AFBB" />
                      <Text style={styles.metaText}>{incident.location}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialIcons name="schedule" size={14} color="#A0AFBB" />
                      <Text style={styles.metaText}>{incident.date}</Text>
                    </View>
                  </View>

                  {incident.responders > 0 && (
                    <View style={styles.respondersInfo}>
                      <MaterialIcons name="groups" size={14} color="#00D9FF" />
                      <Text style={styles.respondersText}>
                        {incident.responders} responder{incident.responders !== 1 ? 's' : ''} assigned
                      </Text>
                    </View>
                  )}
                </View>

                {/* Arrow */}
                <MaterialIcons name="chevron-right" size={24} color="#A0AFBB" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Report Summary */}
          {!isReporting && (
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
          )}

          {/* Export Section */}
          {!isReporting && (
            <View style={styles.section}>
              <TouchableOpacity style={styles.exportButton}>
                <MaterialIcons name="download" size={20} color="#000000" />
                <Text style={styles.exportButtonText}>Export Report History</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.spacer} />
        </ScrollView>

        {/* Chat Interface */}
        {isReporting && (
          <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <MaterialIcons 
                  name={selectedReportType === 'Crime Alert' ? 'security' : 'group'} 
                  size={20} 
                  color={selectedReportType === 'Crime Alert' ? '#FF6B6B' : '#FFB800'} 
                />
                <Text style={styles.chatHeaderTitle}>Reporting {selectedReportType}</Text>
              </View>
              <TouchableOpacity onPress={cancelReport} style={styles.cancelButton}>
                <MaterialIcons name="close" size={20} color="#A0AFBB" />
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <ScrollView 
              ref={chatScrollRef}
              style={styles.chatMessages}
              showsVerticalScrollIndicator={false}
            >
              {chatMessages.map((message) => (
                <View key={message.id} style={[
                  styles.messageContainer,
                  message.isBot ? styles.botMessage : styles.userMessage
                ]}>
                  <Text style={[
                    styles.messageText,
                    message.isBot ? styles.botMessageText : styles.userMessageText
                  ]}>
                    {message.text}
                  </Text>
                  <Text style={[
                    styles.messageTimestamp,
                    message.isBot ? styles.botTimestamp : styles.userTimestamp
                  ]}>
                    {message.timestamp}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Chat Input */}
            <View style={styles.chatInputContainer}>
              <View style={styles.chatInputWrapper}>
                <TextInput
                  style={styles.chatInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Describe the incident..."
                  placeholderTextColor="#A0AFBB"
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity 
                  style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                  onPress={sendMessage}
                  disabled={!inputText.trim()}
                >
                  <MaterialIcons 
                    name="send" 
                    size={20} 
                    color={inputText.trim() ? "#000000" : "#A0AFBB"} 
                  />
                </TouchableOpacity>
              </View>
              
              {chatMessages.length >= 4 && (
                <TouchableOpacity 
                  style={[styles.submitButton, submittingReport && styles.submitButtonDisabled]} 
                  onPress={submitReport}
                  disabled={submittingReport}
                >
                  {submittingReport ? (
                    <ActivityIndicator color="#000000" size="small" />
                  ) : (
                    <MaterialIcons name="check" size={20} color="#000000" />
                  )}
                  <Text style={styles.submitButtonText}>
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  keyboardContainer: {
    flex: 1,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#A0AFBB',
  },
  loginRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  loginRequiredTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loginRequiredText: {
    fontSize: 14,
    color: '#A0AFBB',
    textAlign: 'center',
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
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
  // Chat Styles
  chatContainer: {
    backgroundColor: 'rgba(0, 217, 255, 0.04)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 217, 255, 0.15)',
    maxHeight: '50%',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 217, 255, 0.1)',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    padding: 4,
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 200,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
    padding: 12,
    borderRadius: 12,
  },
  botMessageText: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    color: '#FFFFFF',
  },
  userMessageText: {
    backgroundColor: '#00D9FF',
    color: '#000000',
  },
  messageTimestamp: {
    fontSize: 10,
    marginTop: 4,
    marginHorizontal: 4,
  },
  botTimestamp: {
    color: '#A0AFBB',
    textAlign: 'left',
  },
  userTimestamp: {
    color: '#A0AFBB',
    textAlign: 'right',
  },
  chatInputContainer: {
    padding: 16,
    gap: 12,
  },
  chatInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(0, 217, 255, 0.3)',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#00D9FF',
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(0, 217, 255, 0.5)',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
});

export default ReportsScreen;