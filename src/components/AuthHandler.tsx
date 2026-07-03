import { useEffect, useState } from 'react';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AuthHandler() {
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      window.location.href = '/';
      return;
    }

    const savedEmail = window.localStorage.getItem('emailForSignIn');
    if (!savedEmail) {
      setStatus('error');
      setErrorMsg('メールアドレスを入力したブラウザ・デバイスで開いてください。');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const continueUrl = params.get('continueUrl') ?? '/';

    signInWithEmailLink(auth, savedEmail, window.location.href)
      .then(() => {
        window.localStorage.removeItem('emailForSignIn');
        window.sessionStorage.setItem('justSignedIn', '1');
        window.location.href = continueUrl;
      })
      .catch(err => {
        console.error(err);
        setStatus('error');
        setErrorMsg('認証に失敗しました。メールアドレスを入力したブラウザ・デバイスで再度お試しください。');
      });
  }, []);

  return (
    <div>
      {status === 'processing' && <p>認証中...</p>}
      {status === 'error' && <p style={{ color: 'red' }}>{errorMsg}</p>}
    </div>
  );
}
