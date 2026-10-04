// jest-expo only transforms React Native / Expo packages inside node_modules.
// uuid ships ESM only, so we extend the preset's allow-list instead of
// replacing it, to keep future jest-expo updates.
const expoPreset = require('jest-expo/jest-preset');

const ESM_PACKAGES = ['uuid'];
const ALLOW_LIST_START = '/node_modules/(?!(';

const transformIgnorePatterns = expoPreset.transformIgnorePatterns.map((pattern) =>
  pattern.startsWith(ALLOW_LIST_START)
    ? pattern.replace(ALLOW_LIST_START, `${ALLOW_LIST_START}${ESM_PACKAGES.join('|')}|`)
    : pattern,
);

if (!transformIgnorePatterns.some((p) => p.includes(`(?!(${ESM_PACKAGES[0]}|`))) {
  throw new Error('jest-expo transformIgnorePatterns changed shape; update jest.config.js.');
}

module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns,
};
