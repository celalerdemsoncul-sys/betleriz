/**
 * Paket tip tanımı içermiyor; ApiService CryptoJS API'sini kullanıyor.
 */
declare module 'react-native-crypto-js' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CryptoJS: any;
  export default CryptoJS;
}
