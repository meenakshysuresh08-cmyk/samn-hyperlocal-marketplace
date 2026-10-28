module.exports = function (api) {
  api.cache(true);
  let preset = 'babel-preset-expo';
  try {
    require.resolve('babel-preset-expo');
  } catch {
    preset = '@react-native/babel-preset';
  }
  return {
    presets: [preset],
  };
};
