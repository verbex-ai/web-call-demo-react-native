// LiveKit's WebRTC globals must be registered before any other module touches
// `navigator.mediaDevices` or constructs a Room — so this import stays first and
// above `expo-router/entry`, which is what boots the app.
import "./src/setup/livekitSetup";

import "expo-router/entry";
