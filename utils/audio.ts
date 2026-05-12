import { Audio } from 'expo-av';
import { DeviceEventEmitter } from 'react-native';

export const CHUNK_DURATION_MS = 7000;

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MAX,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export async function startRecording(): Promise<Audio.Recording> {
  await Audio.requestPermissionsAsync();
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
  
  // Update meter frequently for smooth animation
  recording.setProgressUpdateInterval(50);
  recording.setOnRecordingStatusUpdate((status) => {
    if (status.isRecording && status.metering !== undefined) {
      DeviceEventEmitter.emit('audio_metering', status.metering);
    }
  });

  return recording;
}

export async function stopRecording(recording: Audio.Recording): Promise<string> {
  recording.setOnRecordingStatusUpdate(null);
  await recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  const uri = recording.getURI();
  if (!uri) throw new Error('Recording URI is null after stopping');
  return uri;
}
