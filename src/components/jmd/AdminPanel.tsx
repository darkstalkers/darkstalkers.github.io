import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { CHARA_MAP } from '../../lib/jmd/constants';
import type { TeamEntry, SingleEntry, Config } from '../../lib/jmd/types';

interface Props {
  dbPath: string; // e.g. "08/data" | "09/data"
}

function fmtDate(s?: string) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AdminPanel({ dbPath }: Props) {
  const [user, setUser]     = useState<User | null>(null);
  const [email, setEmail]   = useState('');
  const [pass, setPass]     = useState('');
  const [loginErr, setLoginErr] = useState('');

  const [teams, setTeams]   = useState<TeamEntry[]>([]);
  const [singles, setSingles] = useState<SingleEntry[]>([]);
  const [config, setConfig] = useState<Config>({ open: false });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const teamsRef   = ref(db, `${dbPath}/teams`);
    const singlesRef = ref(db, `${dbPath}/singles`);
    const configRef  = ref(db, `${dbPath}/config`);
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
  }, [user]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr('');
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch {
      setLoginErr('メールアドレスまたはパスワードが違います');
    }
  }

  async function toggleEntry(open: boolean) {
    await set(ref(db, `${dbPath}/config/open`), open);
  }

  function totalCount() {
    const allMembers = [
      ...teams.flatMap(t => t.members),
      ...singles.flatMap(s => s.members),
    ];
    return allMembers.filter(m => m.name).length;
  }

  function afterCount() {
    return [...teams, ...singles]
      .flatMap(e => e.members)
      .filter(m => m.name && m.after === '1').length;
  }

  function createTeamsCsv() {
    const header = ['チーム名','斡旋希望','メール',
      '1:プレイヤー名','1:使用キャラ','1:コメント/自己紹介',/* '1:地域','1:環境','1:歴', */'1:打ち上げ',
      '2:プレイヤー名','2:使用キャラ','2:コメント/自己紹介',/* '2:地域','2:環境','2:歴', */'2:打ち上げ',
      '3:プレイヤー名','3:使用キャラ','3:コメント/自己紹介',/* '3:地域','3:環境','3:歴', */'3:打ち上げ',
      '更新日時',
    ];
    const rows = teams.map(t => {
      const cols: string[] = [t.name ?? '', t.matching ?? '', t.email ?? ''];
      [0,1,2].forEach(i => {
        const m = t.members[i] ?? {};
        cols.push(m.name ?? '', CHARA_MAP[m.character ?? '']?.name ?? '',
          m.comment ?? '', /* REGIONS[(parseInt(m.region??'',10)||1)-1]??'',
          ENV_LABELS[m.env??'']??'', m.history??'', */ m.after??'');
      });
      cols.push(fmtDate(t.updatedAt));
      return cols;
    });
    return [header, ...rows].map(r => '"' + r.join('","') + '"').join('\n');
  }

  function createSinglesCsv() {
    const header = ['プレイヤー名','斡旋希望','メール','使用キャラ','コメント/自己紹介',/* '地域','環境','歴', */'打ち上げ','更新日時'];
    const rows = singles.map(s => {
      const m = s.members[0] ?? {};
      return [m.name??'', s.matching??'', s.email??'',
        CHARA_MAP[m.character??'']?.name??'', m.comment??'',
        /* REGIONS[(parseInt(m.region??'',10)||1)-1]??'',
        ENV_LABELS[m.env??'']??'', m.history??'', */ m.after??'',
        fmtDate(s.updatedAt)];
    });
    return [header, ...rows].map(r => '"' + r.join('","') + '"').join('\n');
  }

  function download(filename: string, csv: string) {
    const bom = '﻿';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Login screen ────────────────────────────────────
  if (!user) {
    return (
      <div className="login" style={{ maxWidth: 400, margin: '4rem auto', padding: '2rem',
        background: '#111', border: '1px solid #444', borderRadius: 8 }}>
        <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>管理者ログイン</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label style={{ color: '#ccc' }}>メールアドレス</label>
            <input type="email" className="form-control" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label style={{ color: '#ccc' }}>パスワード</label>
            <input type="password" className="form-control" value={pass}
              onChange={e => setPass(e.target.value)} required />
          </div>
          {loginErr && <div className="alert alert-danger">{loginErr}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>ログイン</button>
        </form>
      </div>
    );
  }

  // ── Admin screen ────────────────────────────────────
  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>JMD {dbPath.split('/')[0]} 管理画面</h2>
        <button className="btn btn-default" onClick={() => signOut(auth)}>ログアウト</button>
      </div>

      {/* エントリー受付状態 */}
      <div className={`alert status ${config.open ? 'alert-success' : 'alert-warning'}`}>
        <strong className="status-text">
          {config.open ? '只今エントリー受付中' : 'エントリー受付停止中'}
        </strong>
        <div style={{ marginTop: '0.5rem' }}>
          {config.open
            ? <button className="btn btn-warning btn-sm stop" onClick={() => toggleEntry(false)}>受付を停止する</button>
            : <button className="btn btn-success btn-sm start" onClick={() => toggleEntry(true)}>受付を開始する</button>
          }
        </div>
      </div>

      {/* 統計 */}
      <div className="panel panel-default" style={{ background: '#1a1a1a', padding: '1rem', marginBottom: '1rem' }}>
        <dl className="dl-horizontal">
          <dt>チームエントリー</dt><dd className="team-entry-count">{teams.length}</dd>
          <dt>参加表明</dt><dd className="single-entry-count">{singles.length}</dd>
          <dt>参加人数合計</dt><dd className="total-count">{totalCount()}</dd>
          <dt>打ち上げ参加</dt><dd className="after-count">{afterCount()}</dd>
        </dl>
      </div>

      {/* CSV出力 */}
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

      {/* エントリー一覧 */}
      <h3>チームエントリー一覧 ({teams.length}チーム)</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '2rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            {['#','チーム名','メンバー','メール','更新日時'].map(h => (
              <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#aaa' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => (
            <tr key={t.key} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '0.5rem' }}>{i+1}</td>
              <td style={{ padding: '0.5rem' }}>{t.name}</td>
              <td style={{ padding: '0.5rem' }}>
                {t.members.filter(m => m.name).map(m =>
                  `${m.name}(${CHARA_MAP[m.character??'']?.name??'?'})`
                ).join(' / ')}
              </td>
              <td style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#aaa' }}>{t.email}</td>
              <td style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#aaa' }}>{fmtDate(t.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>参加表明一覧 ({singles.length}件)</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            {['プレイヤー名','キャラ','メール','更新日時'].map(h => (
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
                <td style={{ padding: '0.5rem' }}>{CHARA_MAP[m.character??'']?.name??''}</td>
                <td style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#aaa' }}>{s.email}</td>
                <td style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#aaa' }}>{fmtDate(s.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
