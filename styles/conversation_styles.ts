import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  languageButton: {
    padding: 8,
  },
  languageInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  languageCard: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 110,
    alignItems: 'center',
    marginVertical: 6,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    transitionProperty: 'background-color',
    transitionDuration: '0.2s',
  },
  speakerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 2,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  conversationContainer: {
    flex: 1,
    padding: 16,
  },
  conversationContent: {
    paddingBottom: 24,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  processingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  controlsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 12,
  },
  recordingActive: {
    backgroundColor: '#F44336',
  },
  recordingStatus: {
    fontSize: 14,
    color: '#666',
  },
  languagePickerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  languagePickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    paddingHorizontal: 10,
    minHeight: 320,
  },
  languagePicker: {
    width: '100%',
    height: 200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B00',
    textAlign: 'center',
    paddingVertical: 18,
    letterSpacing: 0.5,
  },
  pickerButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  pickerButton: {
    padding: 12,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  pickerButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  pickerButtonConfirm: {
    backgroundColor: '#FF6B00',
  },
  pickerButtonTextConfirm: {
    color: '#fff',
    fontWeight: '600',
  },
  pickerButtonDisabled: {
    opacity: 0.5,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B00',
    marginLeft: 0,
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  utteranceContainer: {
    marginVertical: 6,
    maxWidth: '80%',
  },
  utteranceContent: {
    padding: 12,
  },
  utteranceSpeaker: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 4,
  },
  utteranceText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  translationText: {
    fontSize: 17, // Increased from 14 to 17
    color: '#444', // Made slightly darker for better readability
    fontWeight: '500', // Added medium font weight for emphasis
    fontStyle: 'italic',
    marginTop: 6, // Increased from 4 to 6
    marginBottom: 6, // Increased from 4 to 6
  },
  playButton: {
    marginTop: 8,
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tapToChange: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  connected: {
    backgroundColor: '#4CAF50', // Green
  },
  disconnected: {
    backgroundColor: '#F44336', // Red
  },
  connectionText: {
    fontSize: 12,
    color: '#666',
  },
  person1Bubble: {
    backgroundColor: '#E3F2FD', // Light blue for person 1
    borderRadius: 12,
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  person2Bubble: {
    backgroundColor: '#E8F5E9', // Light green for person 2
    borderRadius: 12,
    borderTopRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  waveAnimationContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.1)',
  },
  waveContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 30,
    width: 40,
  },
  waveLine: {
    width: 3,
    backgroundColor: '#FF6B00',
    borderRadius: 3,
    marginHorizontal: 1,
  },
  waitingText: {
    fontSize: 14,
    color: '#FF6B00',
    marginLeft: 6,
    fontWeight: '500',
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    padding: 10,
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
    borderRadius: 20,
  },
  recordButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  // Enhance existing styles
  translationSection: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    marginLeft: 8,
  },
  activeButton: {
    backgroundColor: 'rgba(255, 107, 0, 0.25)',
  },
  
  // New typing indicator styles
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    marginHorizontal: 10,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B00',
    marginHorizontal: 3,
  },
  
  // Waiting container with improved styling
  
  // Pulsing animation styles
  pulsingCircle: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  
  // Wave animation container with better visibility
  
  languageGrid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImage: {
    width: 60,
    height: 60,
    marginHorizontal: 12,
    alignSelf: 'center',
  },
  selectedCard: {
    backgroundColor: '#FFEDD5',
    borderColor: '#FF6B00',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
    transform: [{ scale: 1.06 }],
  },
});

export default styles;