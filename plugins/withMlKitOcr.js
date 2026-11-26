const { withAndroidManifest, withGradleProperties } = require('expo/config-plugins');

const DEPENDENCY_META_NAME = 'com.google.mlkit.vision.DEPENDENCIES';

module.exports = function withMlKitOcr(config) {
  config = withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) {
      throw new Error('Android manifest is missing its application element.');
    }

    application['meta-data'] ??= [];
    const entry = application['meta-data'].find(
      (item) => item.$?.['android:name'] === DEPENDENCY_META_NAME,
    );

    if (entry) {
      entry.$['android:value'] = 'ocr';
    } else {
      application['meta-data'].push({
        $: {
          'android:name': DEPENDENCY_META_NAME,
          'android:value': 'ocr',
        },
      });
    }

    return config;
  });

  return withGradleProperties(config, (config) => {
    const property = config.modResults.find(
      (item) => item.type === 'property' && item.key === 'android.enableMinifyInReleaseBuilds',
    );

    if (property) {
      property.value = 'false';
    } else {
      config.modResults.push({
        type: 'property',
        key: 'android.enableMinifyInReleaseBuilds',
        value: 'false',
      });
    }

    return config;
  });
};
