import * as LocalAuthentication from 'expo-local-authentication';

export default function useBiometricAuth() {
  const authenticate = async (): Promise<boolean> => {
    if (!(await LocalAuthentication.hasHardwareAsync())) return false;
    if (!(await LocalAuthentication.isEnrolledAsync())) return false;
    const result = await LocalAuthentication.authenticateAsync({ 
      promptMessage: 'Authenticate to Acey' 
    });
    return result.success;
  };
  
  return { authenticate };
}
