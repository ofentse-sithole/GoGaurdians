import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';

const ReportsScreen = () => {
  const [incidents] = useState([
    {
      id: 1,
      type: 'Crime Alert',
      severity: 'high',
      location: 'Park Avenue & 5th Street',
      date: 'Today, 3:45 PM',
      description: 'Suspicious activity reported',
      status: 'Responded',
      responders: 2,
    },
    {
      id: 2,
      type: 'Community Report',
      severity: 'medium',
      location: 'Downtown District',
      date: 'Yesterday, 8:20 PM',
      description: 'Traffic incident',
      status: 'Resolved',
      responders: 1,
    },
    {
      id: 3,
      type: 'Safety Concern',
      severity: 'low',
      location: 'Main Street',
      date: '2 days ago',
      description: 'Broken streetlight reported',
      status: 'Reported',
      responders: 0,
    },
  ]);

  const [stats] = useState({
    total: 12,
    thisMonth: 3,
    active: 1,
    resolved: 11,
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons name="assessment" size={24} color="#00D9FF" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Incident Reports</Text>
            <Text style={styles.headerSubtitle}>Your safety history</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
      </ScrollView>
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
});

export default ReportsScreen;
