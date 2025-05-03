import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';

// Theme color constants
export const THEME_COLOR = '#FF6B00';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1, // Ensure camera fills the space above controls
    position: 'relative', // Needed for absolute positioning of markers/UI
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight || 20 + 10 : 50, // Adjust for status bar
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    zIndex: 10,
  },
  topBarButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 10, // Space between right buttons
  },
  statusBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight || 20 + 60 : 100, // Below top bar
    left: 15,
    right: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 5,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  debugInfo: {
    position: 'absolute',
    bottom: 120, // Adjust position as needed
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 5,
    zIndex: 10,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
  },
  debugErrorText: {
    color: 'red',
    fontSize: 10,
    fontWeight: 'bold',
  },
  processingContainer: {
    position: 'absolute',
    top: 10, // Example position
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 15,
    zIndex: 10,
  },
  detectionMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5, // Ensure markers are above camera view but below UI elements if needed
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME_COLOR, // Use theme color
    borderWidth: 2,
    borderColor: 'white',
  },
  controls: {
    height: 100, // Fixed height for control bar
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'black', // Or a dark semi-transparent color
    paddingBottom: Platform.OS === 'ios' ? 20 : 10, // Padding for home indicator etc.
  },
  controlButton: {
    alignItems: 'center',
    padding: 10,
  },
  controlText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  detectionButton: {
    backgroundColor: THEME_COLOR, // Use theme color
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  stopButton: {
    backgroundColor: '#FF3B30', // Red color for stop
  },
  detectionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30, // More padding at the bottom
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 20, // Ensure bottom sheet is on top
    maxHeight: '45%', // Limit height
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bottomSheetContent: {
    // Removed fixed height, let content determine size up to maxHeight
  },
  translationItem: {
    marginBottom: 10,
  },
  translationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  translationText: {
    fontSize: 16,
    color: '#333',
  },
  bottomSheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Space out buttons
    marginTop: 20, // Add margin above buttons
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25, // Rounded corners
    minWidth: 120, // Ensure buttons have a minimum width
    justifyContent: 'center', // Center content within button
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
     backgroundColor: THEME_COLOR, // Theme color for save
  },
  learnMoreButton: {
     backgroundColor: '#007AFF', // Blue color for learn more
  },
  message: { // Style for permission message
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333', // Adjust color as needed
  },
  permissionButton: { // Style for grant permission button
    backgroundColor: THEME_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  permissionButtonText: { // Style for grant permission button text
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default styles;
