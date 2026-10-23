module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Production'da console logları kaldır (error ve warn hariç)
    ...(process.env.NODE_ENV === 'production' 
      ? [['transform-remove-console', { exclude: ['error', 'warn'] }]]
      : [])
  ],
};
