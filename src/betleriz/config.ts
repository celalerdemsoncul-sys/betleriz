import {Platform} from 'react-native';
export const PUBLIC_API_BASE=Platform.OS==='android'?'http://10.0.2.2:8002':'http://127.0.0.1:8002';
export const FIXTURE_API_URL=PUBLIC_API_BASE+'/api/fixtures.php';
