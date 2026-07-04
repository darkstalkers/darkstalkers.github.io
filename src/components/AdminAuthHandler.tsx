import { useEffect, useState } from 'react';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { adminAuth } from '../lib/firebase';

export default function AdminAuthHandler() {
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isSignInWithEmailLink(adminAuth, window.location.href)) {
      window.location.href = '/';
      return;
    }

    const savedEmail = window.localStorage.getItem('adminEmailForSignIn');
    if (!savedEmail) {
      setStatus('error');
      setErrorMsg('メールアドレスを入力したブラウザ・デバイスで開いてください。');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const continueUrl = params.get('continueUrl') ?? '/jmd/09/admin/';

    signInWithEmailLink(adminAuth, savedEmail, window.location.href)
      .then(() => {
        window.localStorage.removeItem('adminEmailForSignIn');
        window.location.href = continueUrl;
      })
      .catch(err => {
        console.error(err);
        setStatus('error');
        setErrorMsg('認証に失敗しました。メールアドレスを入力したブラウザ・デバイスで再度お試しください。');
      });
  }, []);

  return (
    <div style={{ color: '#fff', textAlign: 'center', marginTop: '4rem', fontFamily: 'sans-serif' }}>
      {status === 'processing' && <p>認証中...</p>}
      {status === 'error' && <p style={{ color: 'red' }}>{errorMsg}</p>}
    </div>
  );
}
