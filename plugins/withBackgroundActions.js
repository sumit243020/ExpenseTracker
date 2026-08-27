const {
  withAndroidManifest,
  AndroidConfig,
} = require('@expo/config-plugins');

/**
 * Declares react-native-background-actions Foreground Service so shake
 * detection can continue on the Android home screen.
 */
function withBackgroundActions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    AndroidConfig.Permissions.ensurePermissions(manifest, [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
      'android.permission.WAKE_LOCK',
      'android.permission.POST_NOTIFICATIONS',
    ]);

    if (!app.service) app.service = [];
    const serviceName = 'com.asterinet.react.bgactions.RNBackgroundActionsTask';
    const existing = app.service.find(
      (s) => s.$?.['android:name'] === serviceName,
    );

    if (!existing) {
      app.service.push({
        $: {
          'android:name': serviceName,
          'android:foregroundServiceType': 'dataSync',
          'android:exported': 'false',
        },
      });
    } else {
      existing.$['android:foregroundServiceType'] = 'dataSync';
      delete existing.property;
    }

    return config;
  });
}

module.exports = withBackgroundActions;
