const {
  withAndroidManifest,
  AndroidConfig,
} = require('@expo/config-plugins');

/**
 * Ensures react-native-background-actions Foreground Service is declared
 * so shake detection can keep running on the Android home screen.
 */
function withBackgroundActions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    // Permissions
    AndroidConfig.Permissions.ensurePermissions(manifest, [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
      'android.permission.WAKE_LOCK',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
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
          'android:foregroundServiceType': 'specialUse',
          'android:exported': 'false',
        },
        'property': [
          {
            $: {
              'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
              'android:value':
                'Continuous shake detection to quickly open Add Expense from the home screen',
            },
          },
        ],
      });
    } else {
      existing.$['android:foregroundServiceType'] = 'specialUse';
    }

    return config;
  });
}

module.exports = withBackgroundActions;
