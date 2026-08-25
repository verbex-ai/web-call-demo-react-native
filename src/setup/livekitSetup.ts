import { registerGlobals } from "@livekit/react-native";

// Installs the WebRTC globals (`navigator.mediaDevices`, `RTCPeerConnection`,
// `TextEncoder`/`TextDecoder`, stream polyfills) that `livekit-client` expects to
// find on a browser. Without this, constructing a Room throws.
//
// Since @livekit/react-native 2.x this also wires up automatic iOS audio-session
// management (the old `useIOSAudioManagement` hook is deprecated), so playback
// routes to the speaker during a call without any per-screen setup.
registerGlobals();
