import { useState, useEffect } from 'react';
import { ref, onValue, set, get, push, update } from 'firebase/database';
import {
  sendSignInLinkToEmail,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import { adminDb, adminAuth } from '../../lib/firebase';
import { CHARACTERS, CHARA_MAP } from '../../lib/jmd/constants';
import type { TeamEntry, SingleEntry, Config, EntryStatus, Member } from '../../lib/jmd/types';
import { resolveStatus } from '../../lib/jmd/types';

const BLANK_MEMBER = (): Member => ({
  name: '', character: '', twitter: '', comment: '', after: '', byoc: '',
});

function realMembers(entry: TeamEntry | SingleEntry): Member[] {
  return entry.members.filter(m => m.name?.trim());
}

function nextArrangedTeamName(existing: TeamEntry[]): string {
  const nums = existing
    .map(t => /^斡旋チーム(\d+)$/.exec(t.name ?? ''))
    .filter((m): m is RegExpExecArray => !!m)
    .map(m => parseInt(m[1], 10));
  return `斡旋チーム${nums.length ? Math.max(...nums) + 1 : 1}`;
}

interface EditForm {
  type: 'team' | 'single';
  key: string;
  teamName: string;
  matching: string;
  members: [Member, Member, Member];
}

const STATUS_LABEL: Record<EntryStatus, string> = {
  before: '受付開始前',
  open: '受付中',
  new_closed: '新規受付停止中（編集は受付中）',
  closed: '受付停止中',
};

const STATUS_ALERT_CLASS: Record<EntryStatus, string> = {
  before: 'alert-info',
  open: 'alert-success',
  new_closed: 'alert-warning',
  closed: 'alert-danger',
};

const STATUS_BUTTON_LABEL: Record<EntryStatus, string> = {
  before: '受付開始前にする',
  open: '受付を開始する',
  new_closed: '新規受付を停止する',
  closed: '受付を停止する',
};

const STATUS_ORDER: EntryStatus[] = ['before', 'open', 'new_closed', 'closed'];

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
  const [config, setConfig]   = useState<Config>({ status: 'before' });

  const [editForm, setEditForm]       = useState<EditForm | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [pickerSingle, setPickerSingle] = useState<SingleEntry | null>(null);

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

  async function setStatus(status: EntryStatus) {
    await set(ref(adminDb, `${dbPath}/config/status`), status);
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

  // ── パターン1: 編集 ──────────────────────────────────
  function openEdit(type: 'team' | 'single', entry: TeamEntry | SingleEntry) {
    setEditForm({
      type,
      key: entry.key,
      teamName: type === 'team' ? (entry as TeamEntry).name ?? '' : '',
      matching: entry.matching ?? '',
      members: [
        { ...BLANK_MEMBER(), ...(entry.members[0] ?? {}) },
        { ...BLANK_MEMBER(), ...(entry.members[1] ?? {}) },
        { ...BLANK_MEMBER(), ...(entry.members[2] ?? {}) },
      ],
    });
  }

  function updateEditMember(i: number, field: keyof Member, value: string) {
    setEditForm(f => {
      if (!f) return f;
      const members = [...f.members] as [Member, Member, Member];
      members[i] = { ...members[i], [field]: value };
      return { ...f, members };
    });
  }

  const editCanSubmit = !!editForm
    && (editForm.type !== 'team' || !!editForm.teamName.trim())
    && !!editForm.members[0].name.trim()
    && !!editForm.members[0].character;

  async function saveEdit() {
    if (!editForm || !editCanSubmit) return;
    setEditSubmitting(true);
    try {
      const activeMembers = editForm.type === 'team'
        ? editForm.members.filter(m => m.name.trim())
        : [editForm.members[0]];
      const data: Record<string, any> = {
        members: activeMembers,
        matching: editForm.matching,
        updatedAt: new Date().toString(),
      };
      if (editForm.type === 'team') data.name = editForm.teamName.trim();
      const collection = editForm.type === 'team' ? 'teams' : 'singles';
      await set(ref(adminDb, `${dbPath}/${collection}/${editForm.key}`), data);
      setEditForm(null);
    } finally {
      setEditSubmitting(false);
    }
  }

  // ── パターン2: 参加表明 → 新規チーム作成 ──────────────
  async function createTeamFromSingle(single: SingleEntry) {
    const name = single.members[0]?.name ?? '';
    if (!window.confirm(`「${name}」から新規チームを作成します。よろしいですか？`)) return;
    const teamName = nextArrangedTeamName(teams);
    const newRef = push(ref(adminDb, `${dbPath}/teams`));
    const key = newRef.key!;
    await update(ref(adminDb), {
      [`${dbPath}/teams/${key}`]: {
        name: teamName,
        members: [single.members[0]],
        matching: '',
        updatedAt: new Date().toString(),
      },
      [`${dbPath}/team-emails/${key}`]: (user?.email ?? '').toLowerCase(),
      [`${dbPath}/singles/${single.key}`]: null,
      [`${dbPath}/single-emails/${single.key}`]: null,
    });
  }

  // ── パターン3: 参加表明 → 既存チームへ振り分け ─────────
  const eligibleTeams = teams.filter(t => realMembers(t).length < 3);

  async function assignToTeam(team: TeamEntry, single: SingleEntry) {
    const name = single.members[0]?.name ?? '';
    if (!window.confirm(`「${name}」を「${team.name}」に追加します。よろしいですか？`)) return;
    const newMembers = [...realMembers(team), single.members[0]];
    const matching = newMembers.length >= 3 ? '' : (team.matching ?? '');
    await update(ref(adminDb), {
      [`${dbPath}/teams/${team.key}/members`]: newMembers,
      [`${dbPath}/teams/${team.key}/matching`]: matching,
      [`${dbPath}/teams/${team.key}/updatedAt`]: new Date().toString(),
      [`${dbPath}/singles/${single.key}`]: null,
      [`${dbPath}/single-emails/${single.key}`]: null,
    });
    setPickerSingle(null);
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

      <div className={`alert ${STATUS_ALERT_CLASS[resolveStatus(config)]}`}>
        <strong>{STATUS_LABEL[resolveStatus(config)]}</strong>
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {STATUS_ORDER.map(s => (
            <button key={s} className="btn btn-default btn-sm"
              disabled={resolveStatus(config) === s}
              onClick={() => setStatus(s)}>
              {STATUS_BUTTON_LABEL[s]}
            </button>
          ))}
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
            {['#', 'チーム名', 'メンバー', '更新日時', '操作'].map(h => (
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
              <td style={{ padding: '0.5rem' }}>
                <button className="btn btn-default btn-xs" onClick={() => openEdit('team', t)}>編集</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>参加表明一覧 ({singles.length}件)</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            {['プレイヤー名', 'キャラ', '更新日時', '操作'].map(h => (
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
                <td style={{ padding: '0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-default btn-xs" onClick={() => openEdit('single', s)}>編集</button>
                  <button className="btn btn-default btn-xs" onClick={() => createTeamFromSingle(s)}>チーム作成</button>
                  <button className="btn btn-default btn-xs" onClick={() => setPickerSingle(s)}>チーム振り分け</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {editForm && (
        <div className="modal fade in" style={{ display: 'block' }} tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ color: '#333' }}>
              <div className="modal-header">
                <button type="button" className="close" onClick={() => setEditForm(null)}><span>&times;</span></button>
                <h4 className="modal-title">{editForm.type === 'team' ? 'チームエントリーの編集' : '参加表明の編集'}</h4>
              </div>
              <div className="modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
                <form className="form-horizontal">
                  <div className="form-group">
                    <label className="col-sm-2 control-label">斡旋希望</label>
                    <div className="col-sm-10">
                      <label className="checkbox-inline">
                        <input type="checkbox" checked={editForm.matching === '1'}
                          onChange={e => setEditForm(f => f && ({ ...f, matching: e.target.checked ? '1' : '' }))} />
                        希望する
                      </label>
                    </div>
                  </div>
                  {editForm.type === 'team' && (
                    <div className="form-group">
                      <label className="col-sm-2 control-label">チーム名</label>
                      <div className="col-sm-10">
                        <input type="text" className="form-control" maxLength={20} value={editForm.teamName}
                          onChange={e => setEditForm(f => f && ({ ...f, teamName: e.target.value }))} />
                      </div>
                    </div>
                  )}
                  {[0, 1, 2].map(i => (
                    (editForm.type === 'team' || i === 0) && (
                      <fieldset key={i} style={{ border: '1px solid #ddd', borderRadius: 4, padding: '0.75rem', marginBottom: '0.75rem' }}>
                        <legend style={{ fontSize: '0.9rem', border: 'none', marginBottom: '0.5rem' }}>{i + 1}人目</legend>
                        <div className="form-group">
                          <label className="col-sm-2 control-label">プレイヤー名</label>
                          <div className="col-sm-4">
                            <input type="text" className="form-control" maxLength={15} value={editForm.members[i].name}
                              onChange={e => updateEditMember(i, 'name', e.target.value)} />
                          </div>
                          <label className="col-sm-2 control-label">使用キャラ</label>
                          <div className="col-sm-4">
                            <select className="form-control" value={editForm.members[i].character}
                              onChange={e => updateEditMember(i, 'character', e.target.value)}>
                              <option value="">選択してください</option>
                              {CHARACTERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="col-sm-2 control-label">X(Twitter) ID</label>
                          <div className="col-sm-10">
                            <input type="text" className="form-control" value={editForm.members[i].twitter ?? ''}
                              onChange={e => updateEditMember(i, 'twitter', e.target.value)} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="col-sm-2 control-label">コメント</label>
                          <div className="col-sm-10">
                            <input type="text" className="form-control" maxLength={30} value={editForm.members[i].comment ?? ''}
                              onChange={e => updateEditMember(i, 'comment', e.target.value)} />
                          </div>
                        </div>
                        <div className="form-group">
                          <div className="col-sm-offset-2 col-sm-10">
                            <label className="checkbox-inline">
                              <input type="checkbox" checked={editForm.members[i].after === '1'}
                                onChange={e => updateEditMember(i, 'after', e.target.checked ? '1' : '')} />
                              打ち上げ参加
                            </label>
                            {' '}
                            <label className="checkbox-inline">
                              <input type="checkbox" checked={editForm.members[i].byoc === '1'}
                                onChange={e => updateEditMember(i, 'byoc', e.target.checked ? '1' : '')} />
                              BYOC希望
                            </label>
                          </div>
                        </div>
                      </fieldset>
                    )
                  ))}
                </form>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" disabled={!editCanSubmit || editSubmitting} onClick={saveEdit}>保存する</button>
                <button className="btn btn-default" onClick={() => setEditForm(null)}>キャンセル</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pickerSingle && (
        <div className="modal fade in" style={{ display: 'block' }} tabIndex={-1} role="dialog">
          <div className="modal-dialog">
            <div className="modal-content" style={{ color: '#333' }}>
              <div className="modal-header">
                <button type="button" className="close" onClick={() => setPickerSingle(null)}><span>&times;</span></button>
                <h4 className="modal-title">
                  「{pickerSingle.members[0]?.name}」を振り分けるチームを選択（3人未満のチームのみ表示）
                </h4>
              </div>
              <div className="modal-body">
                {eligibleTeams.length === 0 ? (
                  <p>3人未満のチームがありません。</p>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {eligibleTeams.map(t => (
                      <li key={t.key}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #ddd',
                          color: '#333', background: '#fff',
                        }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = '#f5f5f5')}
                        onMouseLeave={ev => (ev.currentTarget.style.background = '#fff')}
                        onClick={() => assignToTeam(t, pickerSingle)}>
                        {t.name}（{realMembers(t).map(m => m.name).join(' / ') || 'メンバーなし'}）
                        　残り{3 - realMembers(t).length}枠
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-default" onClick={() => setPickerSingle(null)}>キャンセル</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
