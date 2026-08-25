const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * Points `buildTypes.release` at a real keystore instead of the Android debug key.
 *
 * This has to be a config plugin rather than a hand edit: `expo prebuild` deletes and
 * regenerates android/ from the template every run, so any manual change to
 * app/build.gradle is silently reverted on the next prebuild — including right before a
 * release build, which is the worst possible moment to lose it.
 *
 * Credentials live in <project>/credentials/keystore.properties, outside android/ so
 * prebuild can't delete them, and gitignored. If that file is absent the release config
 * is left empty and Gradle fails loudly rather than quietly falling back to the debug
 * key and producing an APK that looks signed but isn't.
 */
const LOADER = `
// Injected by plugins/withReleaseSigning.js — see that file for why.
def verbexKeystorePropsFile = rootProject.file("../credentials/keystore.properties")
def verbexKeystoreProps = new Properties()
if (verbexKeystorePropsFile.exists()) {
    verbexKeystoreProps.load(new FileInputStream(verbexKeystorePropsFile))
}
`;

const DEBUG_SIGNING = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

const WITH_RELEASE = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (verbexKeystorePropsFile.exists()) {
                storeFile rootProject.file("../credentials/" + verbexKeystoreProps['VERBEX_RELEASE_STORE_FILE'])
                storePassword verbexKeystoreProps['VERBEX_RELEASE_STORE_PASSWORD']
                keyAlias verbexKeystoreProps['VERBEX_RELEASE_KEY_ALIAS']
                keyPassword verbexKeystoreProps['VERBEX_RELEASE_KEY_PASSWORD']
            }
        }
    }`;

// Only the release buildType's line — the debug buildType keeps the debug config.
const RELEASE_USES_DEBUG = `        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`;

const RELEASE_USES_RELEASE = `        release {
            signingConfig signingConfigs.release`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;

    for (const [find, label] of [
      [DEBUG_SIGNING, "signingConfigs block"],
      [RELEASE_USES_DEBUG, "release buildType signingConfig"],
    ]) {
      if (!src.includes(find)) {
        throw new Error(
          `withReleaseSigning: could not find the ${label} in app/build.gradle. ` +
            `The Expo template changed — update plugins/withReleaseSigning.js to match.`,
        );
      }
    }

    if (!src.includes("verbexKeystorePropsFile")) {
      src = src.replace("android {", `${LOADER}\nandroid {`);
    }
    src = src.replace(DEBUG_SIGNING, WITH_RELEASE);
    src = src.replace(RELEASE_USES_DEBUG, RELEASE_USES_RELEASE);

    cfg.modResults.contents = src;
    return cfg;
  });
};
