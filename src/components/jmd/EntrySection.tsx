import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ref, onValue, push, set, remove } from 'firebase/database';
import {
  sendSignInLinkToEmail,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { CHARACTERS, CHARA_MAP } from '../../lib/jmd/constants';
import type { TeamEntry, SingleEntry, Config, Member } from '../../lib/jmd/types';

// ── コンポーネント外定義（内部定義するとアンマウント→再マウントでフォーカスが外れる）──
interface MemberFormGroupProps {
  index: number;
  label: string;
  required?: boolean;
  isTeam: boolean;
  member: Member;
  onUpdate: (i: number, field: keyof Member, value: string) => void;
  onClear: (i: number) => void;
}

function MemberFormGroup({ index, label, required, isTeam, member: m, onUpdate, onClear }: MemberFormGroupProps) {
  const num = index + 1;
  return (
    <fieldset className="form-group team-member" id={`member${num}`}
      style={!isTeam && index > 0 ? { display: 'none' } : {}}>
      {isTeam && <legend className="col-sm-12">{label}</legend>}
      <div className="form-member form-group">
        <label className="col-sm-2 control-label">プレイヤー名 {required && <span className="badge">必須</span>}</label>
        <div className="col-sm-4">
          <input type="text" className="form-control" value={m.name} maxLength={15} placeholder="15文字まで"
            onChange={e => onUpdate(index, 'name', e.target.value)} />
        </div>
        <label className="col-sm-2 control-label">使用キャラ {required && <span className="badge">必須</span>}</label>
        <div className="col-sm-4">
          <select className="form-control" value={m.character}
            onChange={e => onUpdate(index, 'character', e.target.value)}>
            <option value="">選択してください</option>
            {CHARACTERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="col-sm-2 control-label">X(Twitter) ID</label>
        <div className="col-sm-10">
          <input type="text" className="form-control" value={m.twitter ?? ''} placeholder="@"
            onChange={e => onUpdate(index, 'twitter', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="col-sm-2 control-label">コメント/自己紹介</label>
        <div className="col-sm-10">
          <textarea className="form-control" value={m.comment ?? ''} maxLength={30} placeholder="30文字まで"
            onChange={e => onUpdate(index, 'comment', e.target.value)} />
        </div>
      </div>
      {/* TODO: 必要に応じて再表示
      <div className="form-member form-group">
        <label className="col-sm-2 control-label">主な活動地域</label>
        <div className="col-sm-4">
          <select className="form-control" value={m.region ?? ''}
            onChange={e => onUpdate(index, 'region', e.target.value)}>
            <option value="">選択してください</option>
            {REGIONS.map((r, i) => <option key={r} value={String(i+1)}>{r}</option>)}
          </select>
        </div>
        <label className="col-sm-2 control-label">主なプレイ環境</label>
        <div className="col-sm-4">
          <select className="form-control" value={m.env ?? ''}
            onChange={e => onUpdate(index, 'env', e.target.value)}>
            <option value="">選択してください</option>
            {Object.entries(ENV_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div className="form-member form-group">
        <label className="col-sm-2 control-label">セイヴァー歴</label>
        <div className="col-sm-4">
          <input type="text" className="form-control" value={m.history ?? ''} maxLength={30} placeholder="1年、3年など"
            onChange={e => onUpdate(index, 'history', e.target.value)} />
        </div>
      </div>
      */}
      <div className="form-group after">
        <label className="col-sm-3 control-label">打ち上げに参加しますか？</label>
        <div className="col-sm-6">
          {[['1', '参加する'], ['0', '参加しない']].map(([val, lbl]) => (
            <label key={val} className="radio-inline">
              <input type="radio" name={`member${num}-after`} value={val}
                checked={m.after === val} onChange={() => onUpdate(index, 'after', val)} />
              {lbl}
            </label>
          ))}
        </div>
      </div>
      {index > 0 && (
        <div className="form-group">
          <div className="col-sm-12">
            <button type="button" className="btn btn-default btn-sm" onClick={() => onClear(index)}>
              {num}人目の入力をクリア
            </button>
          </div>
        </div>
      )}
    </fieldset>
  );
}

interface Props {
  dbPath: string;     // e.g. "08/data" | "09/data"
  iconBase: string;   // e.g. "/jmd/08/img/icons/"
  readOnly?: boolean; // イベント終了済み = 表示のみ
}

function charaIcon(iconBase: string, id?: string) {
  return id && CHARA_MAP[id] ? `${iconBase}${CHARA_MAP[id].image}` : `${iconBase}blank.png`;
}
function charaName(id?: string) {
  return id && CHARA_MAP[id] ? CHARA_MAP[id].name : '';
}
function fmtDate(s?: string) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const BLANK_MEMBER = (): Member => ({
  name: '', character: '', twitter: '', comment: '',
  region: '', env: '', history: '', after: '',
});

interface FormState {
  isTeam: boolean;
  teamName: string;
  matching: string;
  members: [Member, Member, Member];
  email: string;
  editKey: string;
}
const blankForm = (): FormState => ({
  isTeam: true, teamName: '', matching: '',
  members: [BLANK_MEMBER(), BLANK_MEMBER(), BLANK_MEMBER()],
  email: '', editKey: '',
});

export default function EntrySection({ dbPath, iconBase, readOnly = false }: Props) {
  const [teams, setTeams]     = useState<TeamEntry[]>([]);
  const [singles, setSingles] = useState<SingleEntry[]>([]);
  const [config, setConfig]   = useState<Config>({ open: false });
  const [user, setUser]       = useState<User | null>(null);

  const [dialog, setDialog]           = useState<'none' | 'entry' | 'signIn' | 'editPicker'>('none');
  const [form, setForm]               = useState<FormState>(blankForm());
  const [msg, setMsg]                 = useState('');
  const [msg2, setMsg2]               = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [authEmail, setAuthEmail]     = useState('');
  const [authLinkSent, setAuthLinkSent] = useState(false);
  const [pendingEditKey, setPendingEditKey] = useState('');
  const [loginToast, setLoginToast]   = useState(false);

  const canEntry = !readOnly && config.open;
  const canEditEntry = (entry: TeamEntry | SingleEntry) =>
    !readOnly && config.open && !!user && entry.email?.toLowerCase() === user?.email?.toLowerCase();
  const canSubmit = !submitting
    && !!form.email.trim()
    && !!form.members[0].name.trim()
    && !!form.members[0].character
    && (!form.isTeam || !!form.teamName.trim());

  // ── Firebase ────────────────────────────────────────
  useEffect(() => {
    const teamsRef  = ref(db, `${dbPath}/teams`);
    const singlesRef = ref(db, `${dbPath}/singles`);
    const configRef  = ref(db, `${dbPath}/config`);
    const unsubT = onValue(teamsRef, snap => {
      const data = snap.val() ?? {};
      setTeams(
        Object.entries(data)
          .map(([key, v]) => ({ ...(v as any), key }))
          .sort((a, b) => new Date(a.updatedAt ?? 0).getTime() - new Date(b.updatedAt ?? 0).getTime())
      );
    });
    const unsubS = onValue(singlesRef, snap => {
      const data = snap.val() ?? {};
      setSingles(
        Object.entries(data)
          .map(([key, v]) => ({ ...(v as any), key }))
          .sort((a, b) => new Date(a.updatedAt ?? 0).getTime() - new Date(b.updatedAt ?? 0).getTime())
      );
    });
    const unsubC = onValue(configRef, snap => {
      const val = snap.val();
      if (val) setConfig(val);
    });
    return () => { unsubT(); unsubS(); unsubC(); };
  }, [dbPath]);

  // ── Auth ────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u && window.sessionStorage.getItem('justSignedIn')) {
        window.sessionStorage.removeItem('justSignedIn');
        setLoginToast(true);
        setTimeout(() => setLoginToast(false), 3000);
      }
    });
    return unsub;
  }, []);

  // /auth/ で認証完了後にリダイレクトで戻ってきたとき、editEntryKey を拾う
  useEffect(() => {
    if (!user) return;
    const key = window.localStorage.getItem('editEntryKey');
    if (!key) return;
    window.localStorage.removeItem('editEntryKey');
    setPendingEditKey(key);
  }, [user]);

  useEffect(() => {
    if (!user || !pendingEditKey) return;
    const entry = [...teams, ...singles].find(e => e.key === pendingEditKey);
    if (!entry) return;
    if (entry.email?.toLowerCase() !== user.email?.toLowerCase()) {
      setMsg('このエントリーの編集権限がありません');
      setPendingEditKey('');
      return;
    }
    prefillForm(entry);
    setDialog('entry');
    setPendingEditKey('');
  }, [user, pendingEditKey, teams, singles]);

  // ── Helpers ─────────────────────────────────────────
  function prefillForm(entry: TeamEntry | SingleEntry) {
    const isTeam = 'name' in entry && !!entry.name;
    setForm({
      isTeam,
      teamName: isTeam ? (entry as TeamEntry).name : '',
      matching: entry.matching ?? '',
      members: [
        { ...BLANK_MEMBER(), ...(entry.members[0] ?? {}) },
        { ...BLANK_MEMBER(), ...(entry.members[1] ?? {}) },
        { ...BLANK_MEMBER(), ...(entry.members[2] ?? {}) },
      ],
      email: entry.email ?? '',
      editKey: entry.key,
    });
    setMsg(''); setMsg2('');
  }

  function updateMember(i: number, field: keyof Member, value: string) {
    setForm(f => {
      const members = [...f.members] as [Member, Member, Member];
      members[i] = { ...members[i], [field]: value };
      return { ...f, members };
    });
  }

  function clearMember(i: number) {
    setForm(f => {
      const members = [...f.members] as [Member, Member, Member];
      members[i] = BLANK_MEMBER();
      return { ...f, members };
    });
  }

  function validate() {
    if (form.isTeam && !form.teamName.trim()) { setMsg('チーム名を入力してください'); return false; }
    if (!form.members[0].name.trim()) { setMsg('1人目のプレイヤー名を入力してください'); return false; }
    if (!form.members[0].character) { setMsg('1人目の使用キャラを選択してください'); return false; }
    if (form.isTeam) {
      for (let i = 1; i < 3; i++) {
        const m = form.members[i];
        const hasAny = m.name || m.character || m.comment || m.region || m.env || m.history || m.after;
        if (hasAny) {
          if (!m.name.trim()) { setMsg(`${i+1}人目のプレイヤー名を入力してください`); return false; }
          if (!m.character)   { setMsg(`${i+1}人目の使用キャラを選択してください`); return false; }
        }
      }
    }
    if (!form.email.trim()) { setMsg('メールアドレスを入力してください（編集・削除に使用します）'); return false; }
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    const activeMem = form.isTeam ? form.members.filter(m => m.name.trim()) : [form.members[0]];
    const data: Record<string, any> = {
      members: activeMem,
      matching: form.matching,
      email: form.email.toLowerCase().trim(),
      updatedAt: new Date().toString(),
    };
    if (form.isTeam) data.name = form.teamName.trim();
    try {
      if (form.editKey) {
        const isTeamEntry = teams.some(t => t.key === form.editKey);
        await set(ref(db, `${dbPath}/${isTeamEntry ? 'teams' : 'singles'}/${form.editKey}`), data);
        setMsg('編集が完了しました');
      } else {
        await push(ref(db, `${dbPath}/${form.isTeam ? 'teams' : 'singles'}`), data);
        setMsg('エントリーが完了しました');
      }
      setTimeout(closeDialog, 1500);
    } catch (err) {
      setMsg('エラーが発生しました。もう一度お試しください');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!form.editKey || !window.confirm('エントリーを削除しますか？')) return;
    setSubmitting(true);
    try {
      const isTeamEntry = teams.some(t => t.key === form.editKey);
      await remove(ref(db, `${dbPath}/${isTeamEntry ? 'teams' : 'singles'}/${form.editKey}`));
      setMsg('削除が完了しました');
      setTimeout(closeDialog, 1500);
    } catch (err) {
      setMsg('エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendAuthEmail() {
    if (!authEmail.trim()) { setMsg2('メールアドレスを入力してください'); return; }
    const normalizedEmail = authEmail.trim().toLowerCase();
    const actionCodeSettings = {
      url: `${window.location.origin}/auth/?continueUrl=${encodeURIComponent(window.location.pathname)}`,
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(auth, normalizedEmail, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', normalizedEmail);
      if (pendingEditKey) window.localStorage.setItem('editEntryKey', pendingEditKey);
      setAuthLinkSent(true);
      setMsg2('');
    } catch (err: any) {
      setMsg2('メール送信に失敗しました。もう一度お試しください');
      console.error(err);
    }
  }

  function openEditDialog(key: string) {
    if (!user) {
      setPendingEditKey(key);
      setAuthEmail(''); setAuthLinkSent(false); setMsg2('');
      setDialog('signIn');
      return;
    }
    const entry = [...teams, ...singles].find(e => e.key === key);
    if (!entry) return;
    if (entry.email?.toLowerCase() !== user.email?.toLowerCase()) { alert('このエントリーの編集権限がありません'); return; }
    prefillForm(entry);
    setDialog('entry');
  }

  function closeDialog() {
    setDialog('none'); setForm(blankForm()); setMsg(''); setMsg2('');
    setAuthLinkSent(false);
  }

  // ── Stats ────────────────────────────────────────────
  const allMembers = [...teams.flatMap(t => t.members), ...singles.flatMap(s => s.members)].filter(m => m.name);
  const totalCount = allMembers.length;
  const charaCounts = CHARACTERS.map(c => ({
    ...c,
    count: allMembers.filter(m => m.character === c.id).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  // ── Sub-components ───────────────────────────────────
  function MemberBlock({ m }: { m: Member }) {
    return (
      <li className={`member col-sm-4${!m.name ? ' member-blank' : ''}`}>
        <div className="left-block">
          <img src={charaIcon(iconBase, m.character)} alt="" />
          {m.after === '1' && <span className="material-icons entry-icon">local_bar</span>}
        </div>
        <p className="player-name">
          {m.twitter
            ? <a href={`https://twitter.com/${m.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="twitter-link">{m.name} <i className="icon-twitter" /></a>
            : m.name}
        </p>
        <span className="player-chara">{charaName(m.character)}</span>
        <p className="player-comment">{m.comment}</p>
      </li>
    );
  }

  function TeamCard({ team, no }: { team: TeamEntry; no: number }) {
    return (
      <li id={team.key}>
        <section className="team">
          <h4>
            {canEditEntry(team) && (
              <a href="#" className="edit-link pull-right" title="編集・削除"
                 style={{ visibility: 'visible', display: 'inline-block' }}
                 onClick={e => { e.preventDefault(); openEditDialog(team.key); }}>
                <span className="material-icons">create</span>
              </a>
            )}
            <span className="team-no">No. {no}</span>
            {team.name}
            {team.matching === '1' && <span className="material-icons matching-icon">group_add</span>}
          </h4>
          <ul className="members">
            {[0, 1, 2].map(i => <MemberBlock key={i} m={team.members[i] ?? { name: '', character: '' }} />)}
          </ul>
        </section>
      </li>
    );
  }

  function SingleCard({ single }: { single: SingleEntry }) {
    const m = single.members[0] ?? { name: '', character: '' };
    return (
      <li id={single.key} className={`member col-sm-4 single${!m.name ? ' member-blank' : ''}`}>
        <div className="left-block">
          <img src={charaIcon(iconBase, m.character)} alt="" />
          {m.after === '1' && <span className="material-icons entry-icon">local_bar</span>}
        </div>
        {canEditEntry(single) && (
          <a href="#" className="edit-link pull-right" title="編集・削除"
             style={{ visibility: 'visible', display: 'inline-block' }}
             onClick={e => { e.preventDefault(); openEditDialog(single.key); }}>
            <span className="material-icons">create</span>
          </a>
        )}
        <p className="player-name">
          {m.twitter
            ? <a href={`https://twitter.com/${m.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="twitter-link">{m.name} <i className="icon-twitter" /></a>
            : m.name}
        </p>
        <span className="player-chara">{charaName(m.character)}</span>
        <p className="player-comment">{m.comment}</p>
        {single.matching === '1' && <span className="material-icons matching-icon">group_add</span>}
      </li>
    );
  }

  // ── Render ───────────────────────────────────────────
  return (
    <section id="entry">
      <style>{`
        #entry > h2 {
          text-align: center;
          font-weight: bold;
          color: #fff;
          text-shadow: 0px 0px 10px red, 0px 0px 10px red;
          margin-top: 10px;
          padding-bottom: 0.5em;
          margin-bottom: 0;
        }
        #entry h3 {
          text-shadow: 0px 0px 10px red, 0px 0px 10px red;
          overflow: visible;
        }
        #entry h4 {
          text-shadow: 0px 0px 6px red, 0px 0px 6px red;
          overflow: visible;
        }
        #teams > li:last-child {
          border-bottom: none;
        }
      `}</style>
      <h2>エントリーリスト</h2>
      <div className="tab-content">
        <div className="tab-pane active" id="home">
          {readOnly
            ? <p>新規エントリーは締め切りました。</p>
            : !canEntry
              ? <p>エントリー受付準備中です。</p>
              : (
                <div className="page-header text-center">
                  <button className="btn btn-primary entry-action"
                    onClick={() => { setForm(blankForm()); setMsg(''); setDialog('entry'); }}>
                    エントリー
                  </button>
                  {' '}
                  <button className="btn btn-default entry-action"
                    onClick={() => {
                      if (user) {
                        setDialog('editPicker');
                      } else {
                        setPendingEditKey('');
                        setAuthEmail(''); setAuthLinkSent(false); setMsg2('');
                        setDialog('signIn');
                      }
                    }}>
                    編集・削除
                  </button>
                </div>
              )
          }
        </div>

        <section id="entries">
          <h3>
            チームエントリー{' '}
            <small className="updated-at pull-right">
              更新日時: {fmtDate(teams[teams.length - 1]?.updatedAt)}
            </small>
          </h3>
          <ul id="teams">
            {teams.map((t, i) => <TeamCard key={t.key} team={t} no={i + 1} />)}
          </ul>
        </section>

        <section id="entries-single">
          <h3>
            エントリー（参加表明）{' '}
            <small className="updated-at pull-right">
              更新日時: {fmtDate(singles[singles.length - 1]?.updatedAt)}
            </small>
          </h3>
          <ul className="singles">
            {singles.map(s => <SingleCard key={s.key} single={s} />)}
          </ul>
        </section>

        <section id="entry-summary">
          <h3>サマリー</h3>
          <div style={{ overflow: 'hidden', marginBottom: '1em' }}>
            <div className="col-sm-6">
              <dl className="dl-horizontal">
                <dt>チームエントリー</dt><dd>{teams.length}</dd>
                <dt>エントリー（参加表明）</dt><dd>{singles.length}</dd>
              </dl>
            </div>
            <div className="col-sm-6">
              <dl className="dl-horizontal">
                <dt>参加人数合計</dt><dd>{totalCount}</dd>
              </dl>
            </div>
          </div>
          <section>
            <h4>使用キャラ分布</h4>
            <ul id="character-count" className="count">
              {charaCounts.map(c => (
                <li key={c.id} className="member col-sm-3 col-xs-6 single">
                  <div className="left-block">
                    <img src={`${iconBase}${c.image}`} alt="" />
                  </div>
                  <span className="player-chara">{c.name}</span>
                  <p className="player-name">{c.count} 人</p>
                </li>
              ))}
            </ul>
          </section>
          {/* TODO: 必要に応じて再表示
          <section>
            <h4>主な活動地域分布</h4>
            <ul id="region-count">
              {regionData.map(([name, count]) => (
                <li key={name} className="region">
                  <span className="region-name">{name}</span>
                  <span className="region-count">{count}</span>
                </li>
              ))}
            </ul>
          </section>
          */}
          <section className="explain">
            <i className="icon-twitter icon" /> … Xへのリンクあり<br />
            <span className="material-icons icon">group_add</span> … 斡旋希望<br />
            <span className="material-icons icon">local_bar</span> … 打ち上げ参加
          </section>
        </section>
      </div>

      {dialog !== 'none' && createPortal(
        <>
          {/* Backdrop */}
          <div className="modal-backdrop fade in" style={{ zIndex: 1040 }} onClick={closeDialog} />

          {/* Responsive styles for entry form */}
          <style>{`
            @media (max-width: 900px) {
              .team-entry .modal-dialog { margin: 5px; width: auto; }
              .team-entry-form .control-label {
                text-align: left !important;
                float: none;
                width: 100%;
                padding-bottom: 4px;
              }
              .team-entry-form [class*="col-sm-"] { float: none; width: 100%; }
              .team-entry .modal-footer {
                display: flex;
                flex-wrap: wrap;
                justify-content: flex-end;
                gap: 8px;
                padding: 10px 15px;
              }
              .team-entry .modal-footer .btn { margin-left: 0 !important; min-width: 80px; }
            }
          `}</style>

          {/* Edit Picker Dialog */}
          {dialog === 'editPicker' && (() => {
            const myEntries = [...teams, ...singles].filter(
              e => e.email?.toLowerCase() === user?.email?.toLowerCase()
            );
            return (
              <div className="modal fade in team-entry"
                style={{ display: 'block', zIndex: 1050, overflowX: 'hidden', overflowY: 'auto' }}
                tabIndex={-1} role="dialog">
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <button type="button" className="close" onClick={closeDialog}><span>&times;</span></button>
                      <h4 className="modal-title">編集・削除するエントリーを選択</h4>
                    </div>
                    <div className="modal-body">
                      {myEntries.length === 0 ? (
                        <p>このメールアドレスに紐づくエントリーが見つかりません。</p>
                      ) : (
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                          {myEntries.map(entry => {
                            const label = 'name' in entry && entry.name
                              ? `チーム: ${entry.name}（${entry.members.filter(m => m.name).map(m => m.name).join('・')}）`
                              : `参加表明: ${entry.members[0]?.name ?? ''}`;
                            return (
                              <li key={entry.key}
                                style={{
                                  display: 'block', padding: '12px 16px', cursor: 'pointer',
                                  borderBottom: '1px solid #ddd', color: '#333', background: '#fff',
                                  fontSize: '14px', lineHeight: '1.5', width: '100%', boxSizing: 'border-box',
                                }}
                                onMouseEnter={ev => (ev.currentTarget.style.background = '#f5f5f5')}
                                onMouseLeave={ev => (ev.currentTarget.style.background = '#fff')}
                                onClick={() => { setDialog('none'); prefillForm(entry); setDialog('entry'); }}>
                                {label}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button className="btn btn-default" onClick={closeDialog}>キャンセル</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Sign-in Dialog */}
          {dialog === 'signIn' && (
            <div className="modal fade in team-entry"
              style={{ display: 'block', zIndex: 1050, overflowX: 'hidden', overflowY: 'auto' }}
              tabIndex={-1} role="dialog">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <button type="button" className="close" onClick={closeDialog}><span>&times;</span></button>
                    <h4 className="modal-title">エントリーの編集・削除</h4>
                  </div>
                  <div className="modal-body">
                    {!authLinkSent ? (
                      <>
                        <p>エントリー時に使用したメールアドレスを入力してください。認証リンクを送信します。</p>
                        <div className="form-group">
                          <label>メールアドレス</label>
                          <input type="email" className="form-control" value={authEmail}
                            onChange={e => setAuthEmail(e.target.value)} placeholder="example@email.com" />
                        </div>
                        {msg2 && <div className="alert alert-danger">{msg2}</div>}
                      </>
                    ) : (
                      <div className="alert alert-success">
                        <p>認証メールを送信しました。メールに届いたリンクをクリックしてください。</p>
                        <p style={{ marginBottom: 0 }}>※ リンクの有効期限は1時間です。</p>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    {!authLinkSent && (
                      <button className="btn btn-primary" onClick={handleSendAuthEmail}>メールを送信</button>
                    )}
                    <button className="btn btn-default" onClick={closeDialog}>
                      {authLinkSent ? '閉じる' : 'キャンセル'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Entry / Edit Dialog */}
          {dialog === 'entry' && (
            <div className="modal fade in team-entry"
              style={{ display: 'block', zIndex: 1050, overflowX: 'hidden', overflowY: 'auto' }}
              tabIndex={-1} role="dialog">
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <button type="button" className="close" onClick={closeDialog}><span>&times;</span></button>
                    <h4 className="modal-title">{form.editKey ? 'エントリーの編集・削除' : 'エントリー'}</h4>
                  </div>
                  <div className="modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
                    <form className="team-entry-form form-horizontal">
                      {!form.editKey && (
                        <div className="entry-explain">
                          <p><strong>エントリー内容はいつでも変更できますので、お気軽にエントリーしてください！</strong></p>
                          <hr />
                        </div>
                      )}
                      <div className="form-group full-width">
                        <label className="col-sm-2 control-label">種別 <span className="badge">必須</span></label>
                        <div className="col-sm-10">
                          {[['team', 'チームエントリー'], ['single', 'エントリー（参加表明）']].map(([v, l]) => (
                            <label key={v} className="radio-inline">
                              <input type="radio" name="entry-type" value={v}
                                checked={form.isTeam === (v === 'team')}
                                onChange={() => setForm(f => ({ ...f, isTeam: v === 'team' }))} />
                              {l}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="form-group full-width">
                        <label className="col-sm-2 control-label">斡旋を希望しますか？</label>
                        <div className="col-sm-6">
                          {[['1', '希望する'], ['0', '希望しない']].map(([v, l]) => (
                            <label key={v} className="radio-inline">
                              <input type="radio" name="matching" value={v}
                                checked={form.matching === v}
                                onChange={() => setForm(f => ({ ...f, matching: v }))} />
                              {l}
                            </label>
                          ))}
                        </div>
                      </div>
                      {form.isTeam && (
                        <div className="form-group full-width" id="team-name">
                          <label className="col-sm-2 control-label">チーム名 <span className="badge">必須</span></label>
                          <div className="col-sm-10">
                            <input type="text" className="form-control" value={form.teamName} maxLength={20}
                              placeholder="20文字まで"
                              onChange={e => setForm(f => ({ ...f, teamName: e.target.value }))} />
                          </div>
                        </div>
                      )}
                      <MemberFormGroup index={0} label="1人目" required isTeam={form.isTeam} member={form.members[0]} onUpdate={updateMember} onClear={clearMember} />
                      {form.isTeam && <MemberFormGroup index={1} label="2人目" isTeam={form.isTeam} member={form.members[1]} onUpdate={updateMember} onClear={clearMember} />}
                      {form.isTeam && <MemberFormGroup index={2} label="3人目" isTeam={form.isTeam} member={form.members[2]} onUpdate={updateMember} onClear={clearMember} />}
                      <div className="form-group full-width form-group-sm pass">
                        <label className="col-sm-2 control-label">
                          メールアドレス <span className="badge">必須</span>
                        </label>
                        <div className="col-sm-4">
                          <input type="email" className="form-control" value={form.email}
                            placeholder="編集・削除に使用します"
                            readOnly={!!form.editKey}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                        <div className="col-sm-6">
                          <small>※ 後から編集・削除するために使用します。公開されません。</small>
                        </div>
                      </div>
                    </form>
                    {msg && (
                      <div className={`alert ${msg.includes('完了') ? 'alert-success' : 'alert-danger'}`}>
                        {msg}
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    {!form.editKey && (
                      <button className="btn btn-primary" disabled={!canSubmit} onClick={handleSubmit}>エントリー</button>
                    )}
                    {form.editKey && (
                      <>
                        <button className="btn btn-primary" disabled={!canSubmit} onClick={handleSubmit}>編集する</button>
                        <button className="btn btn-danger" disabled={submitting} onClick={handleDelete}>削除する</button>
                      </>
                    )}
                    <button className="btn btn-default" onClick={closeDialog}>キャンセル</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
      {loginToast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: '#2a7a2a',
          color: '#fff',
          padding: '0.75rem 1.5rem',
          borderRadius: '4px',
          zIndex: 9999,
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          fontSize: '15px',
          pointerEvents: 'none',
        }}>
          ログインしました
        </div>
      )}
    </section>
  );
}
