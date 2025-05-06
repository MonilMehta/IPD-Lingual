import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView, Modal, Pressable, SafeAreaView } from 'react-native';
import { getToken } from '../../services/Auth';
import { FloatingTabBar } from '../../components/Navigation/FloatingTabBar';
import { Feather } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
const SERVER = process.env.EXPO_PUBLIC_SERVER || 'https://lingual-yn5c.onrender.com';

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Gujarati', value: 'gu' },
  { label: 'Kannada', value: 'kn' },
  { label: 'Marathi', value: 'mr' },
  { label: 'French', value: 'fr' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Spanish', value: 'es' },
  { label: 'Russian', value: 'ru' },
];

export default function ProfileScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [editPassword2, setEditPassword2] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [editLang, setEditLang] = useState('');
  const [langDropdown, setLangDropdown] = useState(false);
  const [langChanging, setLangChanging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      fetch(`${SERVER}/api/homepage`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setStats(data);
          setEditName(data.name);
          setEditLang(data.target_language);
        })
        .catch(() => Alert.alert('Error', 'Failed to load profile'))
        .finally(() => setLoading(false));
    })();
  }, []);

  const handleSaveName = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation', 'Name cannot be empty');
      return;
    }
    setSaving(true);
    const token = await getToken();
    fetch(`${SERVER}/user_update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: editName }),
    })
      .then(res => {
        if (!res.ok) throw new Error();
        Alert.alert('Success', 'Name updated!');
        setEditMode(false);
      })
      .catch(() => Alert.alert('Error', 'Failed to update name'))
      .finally(() => setSaving(false));
  };

  const handleSavePassword = async () => {
    if (!editPassword || !editPassword2) {
      Alert.alert('Validation', 'Please enter and repeat your new password');
      return;
    }
    if (editPassword !== editPassword2) {
      Alert.alert('Validation', 'Passwords do not match');
      return;
    }
    setSaving(true);
    const token = await getToken();
    fetch(`${SERVER}/user_update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ password: editPassword }),
    })
      .then(res => {
        if (!res.ok) throw new Error();
        Alert.alert('Success', 'Password updated!');
        setEditPassword('');
        setEditPassword2('');
        setShowPasswordFields(false);
      })
      .catch(() => Alert.alert('Error', 'Failed to update password'))
      .finally(() => setSaving(false));
  };

  const handleLanguageChange = async (lang) => {
    if (lang === stats.target_language) {
      setLangDropdown(false);
      return;
    }
    Alert.alert(
      'Change Language',
      'Changing your learning language will reset your progress and it may not be recovered. Continue?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setLangDropdown(false) },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            setLangChanging(true);
            const token = await getToken();
            fetch(`${SERVER}/api/set_language`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ target_language: lang }),
            })
              .then(res => {
                if (!res.ok) throw new Error();
                setEditLang(lang);
                Alert.alert('Language Changed', 'Your learning language has been updated.');
              })
              .catch(() => Alert.alert('Error', 'Failed to change language'))
              .finally(() => {
                setLangChanging(false);
                setLangDropdown(false);
              });
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    setLogoutModal(false);
    const token = await getToken();
    fetch(`${SERVER}/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
      .then(() => {
        Alert.alert('Logged out', 'You have been logged out.');
      })
      .catch(() => Alert.alert('Error', 'Failed to logout'));
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: '#FFF' }]}> 
        <ActivityIndicator size="large" color="#FF6B00" />
      </SafeAreaView>
    );
  }

  const quizPercent = stats && stats.quiz_total ? Math.round((stats.quiz_completed / stats.quiz_total) * 100) : 0;
  const currentLangLabel = LANGUAGES.find(l => l.value === editLang)?.label || editLang;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top mascot and logout */}
        <View style={styles.topRow}>
          <View style={styles.avatarShadow}>
            <View style={styles.avatarCircle}>
              <Image source={require('../../assets/images/cat-sayinghi.png')} style={styles.avatarImg} />
            </View>
          </View>
          <TouchableOpacity style={styles.logoutIcon} onPress={() => setLogoutModal(true)}>
            <Feather name="log-out" size={26} color="#FF6B00" />
          </TouchableOpacity>
        </View>
        {/* Username and level */}
        <Text style={styles.profileName}>{editName}</Text>
        <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>Level {stats.current_level}</Text></View>
        {/* Streak and language cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Daily Streak</Text>
            <Text style={styles.stat1Value}>{stats.daily_challenge_streak} <Ionicons name="flame" size={24} color="#FF6B00" /></Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Learning</Text>
            <Text style={styles.statValue}>{currentLangLabel}</Text>
          </View>
        </View>
        {/* Quiz progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Quiz Progress</Text>
          <View style={styles.progressBarRow}>
            <ProgressBar progress={quizPercent/100} color="#FF6B00" style={styles.progressBar} />
            <Text style={styles.progressPercent}>{quizPercent}%</Text>
          </View>
          <Text style={styles.progressText}>{stats.quiz_completed} of {stats.quiz_total} quizzes completed</Text>
        </View>
        {/* Account Settings */}
        <Text style={styles.settingsHeader}>Account Settings</Text>
        {/* Username Card */}
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Username</Text>
              {editMode ? (
                <TextInput
                  style={styles.settingInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Name"
                  placeholderTextColor="#888"
                />
              ) : (
                <Text style={styles.settingValue}>{editName}</Text>
              )}
            </View>
            {editMode ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={handleSaveName} disabled={saving}>
                  <Feather name="check" size={20} color="#FF6B00" style={{ marginRight: 12 }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditMode(false)}>
                  <Feather name="x" size={20} color="#888" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditMode(true)}>
                <Feather name="edit-2" size={18} color="#FF6B00" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* Password Card */}
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Password</Text>
              {showPasswordFields ? (
                <>
                  <TextInput
                    style={styles.settingInput}
                    value={editPassword}
                    onChangeText={setEditPassword}
                    placeholder="New Password"
                    placeholderTextColor="#888"
                    secureTextEntry
                  />
                  <TextInput
                    style={styles.settingInput}
                    value={editPassword2}
                    onChangeText={setEditPassword2}
                    placeholder="Repeat New Password"
                    placeholderTextColor="#888"
                    secureTextEntry
                  />
                </>
              ) : (
                <Text style={styles.settingValue}>••••••••</Text>
              )}
            </View>
            {showPasswordFields ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={handleSavePassword} disabled={saving}>
                  <Feather name="check" size={20} color="#FF6B00" style={{ marginRight: 12 }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPasswordFields(false)}>
                  <Feather name="x" size={20} color="#888" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowPasswordFields(true)}>
                <Feather name="lock" size={18} color="#FF6B00" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* Language Card */}
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Learning Language</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setLangDropdown(!langDropdown)}>
            <Text style={styles.settingValue}>{currentLangLabel}</Text>
            <Feather name={langDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#FF6B00" />
          </TouchableOpacity>
          {langDropdown && (
            <View style={styles.dropdownList}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.value}
                  style={[styles.dropdownItem, editLang === lang.value && styles.dropdownItemActive]}
                  onPress={() => handleLanguageChange(lang.value)}
                  disabled={langChanging}
                >
                  <Text style={{ color: editLang === lang.value ? '#FFF' : '#FF6B00', fontWeight: 'bold' }}>{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.warningRow}>
            <Feather name="alert-triangle" size={16} color="#FF6B00" style={{ marginRight: 6 }} />
            <Text style={styles.warningText}>Changing language will reset your learning progress and it may not be recovered.</Text>
          </View>
        </View>
        <Text style={styles.lastLogin}>Last login: {new Date(stats.last_login).toLocaleString()}</Text>
        <View style={{ height: 120 }} />
      </ScrollView>
      {/* Logout Modal */}
      {logoutModal && (
        <Modal visible={logoutModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FF6B00', marginBottom: 12 }}>Logout?</Text>
              <Text style={{ color: '#444', marginBottom: 20 }}>Are you sure you want to logout?</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Pressable style={styles.modalBtn} onPress={() => setLogoutModal(false)}>
                  <Text style={{ color: '#FF6B00', fontWeight: 'bold' }}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.modalBtn, { backgroundColor: '#FF6B00' }]} onPress={handleLogout}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Logout</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <FloatingTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFF',
    // paddingBottom: 40,
    marginTop: 60,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: 10,
    position: 'relative',
  },
  avatarShadow: {
    position: 'absolute',
    left: '50%',
    top: -40,
    marginLeft: -48,
    zIndex: 2,
    shadowColor: '#FF6B00',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderRadius: 48,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFF3E6',
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoutIcon: {
    marginLeft: 'auto',
    marginTop: 8,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF3E6',
    borderWidth: 1,
    borderColor: '#FF6B00',
    zIndex: 3,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },
  levelBadge: {
    alignSelf: 'center',
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginTop: 6,
    marginBottom: 18,
  },
  levelBadgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF3E6',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  statLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    color: '#FF6B00',
    fontWeight: 'bold',
    fontSize: 32,
  },
  stat1Value: {
    color: '#FF6B00',
    fontWeight: 'bold',
    fontSize: 32,

  },
  progressCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#F3E6D6',
  },
  progressLabel: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#F3E6D6',
  },
  progressPercent: {
    color: '#FF6B00',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 8,
  },
  progressText: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  settingsHeader: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 10,
  },
  settingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F3E6D6',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  settingLabel: {
    color: '#888',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  settingValue: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    backgroundColor: '#FFF',
    color: '#222',
    fontSize: 16,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B00',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#FFF3E6',
    justifyContent: 'space-between',
  },
  dropdownList: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B00',
    marginTop: 2,
    marginBottom: 8,
    width: '100%',
    zIndex: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF3E6',
    backgroundColor: '#FFF',
  },
  dropdownItemActive: {
    backgroundColor: '#FF6B00',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FFF3E6',
    borderRadius: 8,
    padding: 8,
    marginBottom: 2,
  },
  warningText: {
    color: '#FF6B00',
    fontSize: 13,
    flex: 1,
    fontWeight: 'bold',
  },
  lastLogin: {
    fontSize: 12,
    color: '#888',
    marginTop: 10,
    alignSelf: 'center',
    marginBottom:60,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
    backgroundColor: '#FFF',
  },
});
