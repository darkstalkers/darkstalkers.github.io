import { useState, useEffect } from 'react';
import { ref, onValue, set, get } from 'firebase/database';
import {
  sendSignInLinkToEmail,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import { adminDb, adminAuth } from '../../lib/firebase';
import { CHARA_MAP } from '../../lib/jmd/constants';
import type { TeamEntry, SingleEntry, Config } from '../../lib/jmd/types';

interface Props {
  dbPath: string;
}

function fmtDate(s?: string) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AdminPanel({ dbPath }: Props) {
  const [user, setUser]           = useState<User | null>(null);
  const [isAdmin, setIsAdmin]     = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authLinkSent, setAuthLinkSent] = useState(false);
  const [loginErr, setLoginErr]   = useState('');

  const [teams, setTeams]     = useState<TeamEntry[]>([]);
  const [singles, setSingles] = useState<SingleEntry[]>([]);
  const [config, setConfig]   = useState<Config>({ open: false });

  useEffect(() => {
    const unsub = onAuthStateChanged(adminAuth, async u => {
      setUser(u);
      if (!u) { setIsAdmin(false); return; }
      try {
        await get(ref(adminDb, 'jmd/admin-access'));
        setIsAdmin(true);
      } catch {
        setLoginErr('このメールアドレスには管理者権限がありません');
        await signOut(adminAuth);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const teamsRef   = ref(adminDb, `${dbPath}/teams`);
    const singlesRef = ref(adminDb, `${dbPath}/singles`);
    const configRef  = ref(adminDb, `${dbPath}/config`);
    const unsubT = onValue(teamsRef, snap => {
      const data = snap.val() ?? {};
      setTeams(Object.entries(data).map(([key, v]) => ({ ...(v as any), key })));
    });
    const unsubS = onValue(singlesRef, snap => {
      const data = snap.val() ?? {};
      setSingles(Object.entries(data).map(([key, v]) => ({ ...(v as any), key })));
    });
    const unsubC = onValue(configRef, snap => {
      const val = snap.val();
      if (val) setConfig(val);
    });
    return () => { unsubT(); unsubS(); unsubC(); };
  }, [isAdmin, dbPath]);

  async function handleSendAuthEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr('');
    if (!authEmail.trim()) { setLoginErr('メールアドレスを入力してください'); return; }
    const normalized = authEmail.trim().toLowerCase();
    try {
      await sendSignInLinkToEmail(adminAuth, normalized, {
        url: `${window.location.origin}/auth/admin/?continueUrl=${encodeURIComponent(window.location.pathname)}`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem('adminEmailForSignIn', normalized);
      setAuthLinkSent(true);
    } catch {
      setLoginErr('メール送信に失敗しました。もう一度お試しください');
    }
  }

  async function toggleEntry(open: boolean) {
    await set(ref(adminDb, `${dbPath}/config/open`), open);
  }

  function totalCount() {
    return [...teams.flatMap(t => t.members), ...singles.flatMap(s => s.members)]
      .filter(m => m.name).length;
  }

  function afterCount() {
    return [...teams, ...singles].flatMap(e => e.members)
      .filter(m => m.name && m.after === '1').length;
  }

  function createTeamsCsv() {
    const header = ['チーム名', '斡旋希望',
      '1:プレイヤー名', '1:使用キャラ', '1:コメント/自己紹介', '1:打ち上げ', '1:BYOC',
      '2:プレイヤー名', '2:使用キャラ', '2:コメント/自己紹介', '2:打ち上げ', '2:BYOC',
      '3:プレイヤー名', '3:使用キャラ', '3:コメント/自己紹介', '3:打ち上げ', '3:BYOC',
      '更新日時',
    ];
    const rows = teams.map(t => {
      const cols: string[] = [t.name ?? '', t.matching ?? ''];
      [0, 1, 2].forEach(i => {
        const m = t.members[i] ?? {};
        cols.push(m.name ?? '', CHARA_MAP[m.character ?? '']?.name ?? '', m.comment ?? '', m.after ?? '', m.byoc === '1' ? '希望する' : '');
      });
      cols.push(fmtDate(t.updatedAt));
      return cols;
    });
    return [header, ...rows].map(r => '"' + r.join('","') + '"').join('\n');
  }

  function createSinglesCsv() {
    const header = ['プレイヤー名', '斡旋希望', '使用キャラ', 'コメント/自己紹介', '打ち上げ', 'BYOC', '更新日時'];
    const rows = singles.map(s => {
      const m = s.members[0] ?? {};
      return [m.name ?? '', s.matching ?? '', CHARA_MAP[m.character ?? '']?.name ?? '',
        m.comment ?? '', m.after ?? '', m.byoc === '1' ? '希望する' : '', fmtDate(s.updatedAt)];
    });
    return [header, ...rows].map(r => '"' + r.join('","') + '"').join('\n');
  }

  function download(filename: string, csv: string) {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ── ログイン画面 ──────────────────────────────────────
  if (!user || !isAdmin) {
    return (
      <div style={{ maxWidth: 400, margin: '4rem auto', padding: '2rem',
        background: '#111', border: '1px solid #444', borderRadius: 8 }}>
        <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>管理者ログイン</h2>
        {authLinkSent ? (
          <p style={{ color: '#aaa' }}>
            認証メールを送信しました。メールに届いたリンクをクリックしてください。
          </p>
        ) : (
          <form onSubmit={handleSendAuthEmail}>
            <div className="form-group">
              <label style={{ color: '#ccc' }}>メールアドレス</label>
              <input type="email" className="form-control" value={authEmail}
                onChange={e => setAuthEmail(e.target.value)} required />
            </div>
            {loginErr && <div className="alert alert-danger">{loginErr}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              認証メールを送信
            </button>
          </form>
        )}
      </div>
    );
  }

  // ── 管理画面 ──────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>JMD {dbPath.split('/')[0]} 管理画面</h2>
        <button className="btn btn-default" onClick={() => signOut(adminAuth)}>ログアウト</button>
      </div>

      <div className={`alert ${config.open ? 'alert-success' : 'alert-warning'}`}>
        <strong>{config.open ? '只今エントリー受付中' : 'エントリー受付停止中'}</strong>
        <div style={{ marginTop: '0.5rem' }}>
          {config.open
            ? <button className="btn btn-warning btn-sm" onClick={() => toggleEntry(false)}>受付を停止する</button>
            : <button className="btn btn-success btn-sm" onClick={() => toggleEntry(true)}>受付を開始する</button>
          }
        </div>
      </div>

      <div style={{ background: '#1a1a1a', padding: '1rem', marginBottom: '1rem' }}>
        <dl className="dl-horizontal">
          <dt>チームエントリー</dt><dd>{teams.length}</dd>
          <dt>参加表明</dt><dd>{singles.length}</dd>
          <dt>参加人数合計</dt><dd>{totalCount()}</dd>
          <dt>打ち上げ参加</dt><dd>{afterCount()}</dd>
        </dl>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>CSV出力</h3>
        <button className="btn btn-default" style={{ marginRight: '0.5rem' }}
          onClick={() => download('teams.csv', createTeamsCsv())}>
          チームエントリー CSV
        </button>
        <button className="btn btn-default"
          onClick={() => download('singles.csv', createSinglesCsv())}>
          参加表明 CSV
        </button>
      </div>

      <h3>チームエントリー一覧 ({teams.length}チーム)</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '2rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            {['#', 'チーム名', 'メンバー', '更新日時'].map(h => (
              <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#aaa' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => (
            <tr key={t.key} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '0.5rem' }}>{i + 1}</td>
              <td style={{ padding: '0.5rem' }}>{t.name}</td>
              <td style={{ padding: '0.5rem' }}>
                {t.members.filter(m => m.name).map(m =>
                  `${m.name}(${CHARA_MAP[m.character ?? '']?.name ?? '?'})`
                ).join(' / ')}
              </td>
              <td style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#aaa' }}>{fmtDate(t.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>参加表明一覧 ({singles.length}件)</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            {['プレイヤー名', 'キャラ', '更新日時'].map(h => (
              <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#aaa' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {singles.map(s => {
            const m = s.members[0] ?? {};
            return (
              <tr key={s.key} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '0.5rem' }}>{m.name}</td>
                <td style={{ padding: '0.5rem' }}>{CHARA_MAP[m.character ?? '']?.name ?? ''}</td>
                <td style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#aaa' }}>{fmtDate(s.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
