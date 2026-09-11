import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../../lib/firebase';
import { CHARA_MAP } from '../../lib/jmd/constants';
import type { TeamEntry } from '../../lib/jmd/types';
import { CABINETS, BLANK_CABINET } from '../../lib/jmd/now';
import type { Cabinet, CabinetState, CabinetSide } from '../../lib/jmd/now';

interface Props {
  dbPath: string; // e.g. "09/data"
}

function charaName(id?: string) {
  return id && CHARA_MAP[id] ? CHARA_MAP[id].name : '未選択';
}

// Firebase RTDBは空配列/空オブジェクトを保存できず、読み出し時にフィールド自体が
// 欠落することがあるため、読み込んだ生データは必ずこの関数で正規化してから使う。
function normalizeSide(raw: any): CabinetSide {
  return {
    teamKey: raw?.teamKey ?? null,
    currentIndex: raw?.currentIndex ?? null,
    eliminated: Array.isArray(raw?.eliminated) ? raw.eliminated : [],
  };
}
function normalizeCabinet(raw: any): CabinetState {
  return {
    p1: normalizeSide(raw?.p1),
    p2: normalizeSide(raw?.p2),
  };
}

export default function NowBoard({ dbPath }: Props) {
  const [teams, setTeams] = useState<TeamEntry[]>([]);
  const [board, setBoard] = useState<Record<Cabinet, CabinetState>>(() => {
    const init = {} as Record<Cabinet, CabinetState>;
    CABINETS.forEach(c => { init[c] = BLANK_CABINET(); });
    return init;
  });
  const [editing, setEditing] = useState<Cabinet | null>(null);

  useEffect(() => {
    const teamsRef = ref(db, `${dbPath}/teams`);
    const unsubT = onValue(teamsRef, snap => {
      const data = snap.val() ?? {};
      setTeams(
        Object.entries(data)
          .map(([key, v]) => ({ ...(v as any), key }))
          .sort((a, b) => a.key < b.key ? -1 : 1)
      );
    });

    const nowRef = ref(db, `${dbPath}/now`);
    const unsubN = onValue(nowRef, snap => {
      const data = snap.val() ?? {};
      setBoard(prev => {
        const next = { ...prev };
        CABINETS.forEach(c => {
          next[c] = normalizeCabinet(data[c]);
        });
        return next;
      });
    });

    return () => { unsubT(); unsubN(); };
  }, [dbPath]);

  function teamByKey(key: string | null): TeamEntry | undefined {
    if (!key) return undefined;
    return teams.find(t => t.key === key);
  }

  async function updateSide(cabinet: Cabinet, side: 'p1' | 'p2', patch: Partial<CabinetSide>) {
    const current = board[cabinet]?.[side] ?? { teamKey: null, currentIndex: null, eliminated: [] };
    const next = { ...current, ...patch };
    await set(ref(db, `${dbPath}/now/${cabinet}/${side}`), next);
  }

  function selectTeam(cabinet: Cabinet, side: 'p1' | 'p2', teamKey: string) {
    updateSide(cabinet, side, {
      teamKey: teamKey || null,
      currentIndex: null,
      eliminated: [],
    });
  }

  function selectCurrent(cabinet: Cabinet, side: 'p1' | 'p2', index: number) {
    updateSide(cabinet, side, { currentIndex: index });
  }

  function toggleEliminated(cabinet: Cabinet, side: 'p1' | 'p2', index: number, checked: boolean) {
    const current = board[cabinet]?.[side];
    const set0 = new Set(current?.eliminated ?? []);
    if (checked) set0.add(index); else set0.delete(index);
    updateSide(cabinet, side, { eliminated: Array.from(set0).sort((a, b) => a - b) });
  }

  async function clearCabinet(cabinet: Cabinet) {
    if (!window.confirm(`${cabinet}筐体をクリアしますか？（1P・2Pとも）`)) return;
    const blank = { teamKey: null, currentIndex: null, eliminated: [] };
    await Promise.all([
      set(ref(db, `${dbPath}/now/${cabinet}/p1`), blank),
      set(ref(db, `${dbPath}/now/${cabinet}/p2`), blank),
    ]);
  }

  function SideView({ side }: { side: CabinetSide }) {
    const team = teamByKey(side.teamKey);
    const current = side.currentIndex != null ? team?.members[side.currentIndex] : undefined;
    const eliminatedNames = side.eliminated
      .map(i => team?.members[i]?.name)
      .filter(Boolean);
    return (
      <div className="now-side">
        <div className="now-team-name">{team?.name ?? '（未設定）'}</div>
        <div className="now-current">
          {current
            ? <>▸ {current.name}<span className="now-chara">（{charaName(current.character)}）</span></>
            : <span className="now-muted">対戦中の選手が未設定です</span>}
        </div>
        <div className="now-eliminated">
          敗退済み：{eliminatedNames.length ? eliminatedNames.join('、') : 'なし'}
        </div>
      </div>
    );
  }

  function SideEditor({ cabinet, side, label }: { cabinet: Cabinet; side: 'p1' | 'p2'; label: string }) {
    const state = board[cabinet][side];
    const team = teamByKey(state.teamKey);
    return (
      <div className="now-side-editor">
        <label className="now-editor-label">{label}</label>
        <select
          className="form-control"
          value={state.teamKey ?? ''}
          onChange={e => selectTeam(cabinet, side, e.target.value)}
        >
          <option value="">未設定</option>
          {teams.map((t, i) => (
            <option key={t.key} value={t.key}>No.{i + 1} {t.name}</option>
          ))}
        </select>
        {team && (
          <div className="now-member-list">
            {team.members.map((m, i) => (
              <div key={i} className="now-member-row">
                <span className="now-member-info">
                  <span className="now-member-name">{m.name || '（未入力）'}</span>
                  <span className="now-member-chara">（{charaName(m.character)}）</span>
                </span>
                <label className="now-radio">
                  <input
                    type="radio"
                    name={`${cabinet}-${side}-current`}
                    checked={state.currentIndex === i}
                    onChange={() => selectCurrent(cabinet, side, i)}
                  />
                  対戦中
                </label>
                <label className="now-checkbox">
                  <input
                    type="checkbox"
                    checked={state.eliminated.includes(i)}
                    onChange={e => toggleEliminated(cabinet, side, i, e.target.checked)}
                  />
                  敗退済み
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="now-board">
      <style>{`
        .now-board { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        @media (max-width: 700px) {
          .now-board { grid-template-columns: 1fr; }
        }
        .now-cabinet { background: #1a1010; border: 1px solid #5e4743; border-radius: 4px; padding: 1rem; }
        .now-cabinet-head {
          display: flex; align-items: center; justify-content: space-between;
          cursor: pointer; margin-bottom: 0.75rem;
        }
        .now-cabinet-label {
          font-weight: bold; font-size: 1.4rem; color: #fff;
          text-shadow: 0 0 8px red, 0 0 8px red;
        }
        .now-edit-hint { font-size: 0.75rem; color: #999; }
        .now-cabinet.editing { grid-column: 1 / -1; }
        .now-sides { display: flex; gap: 1rem; }
        .now-side { flex: 1; min-width: 0; }
        .now-editors { display: flex; flex-direction: column; gap: 1rem; }
        .now-side-editor { border: 1px solid #3a2a2e; border-radius: 4px; padding: 0.75rem; }
        .now-team-name { font-weight: bold; color: #fff; margin-bottom: 0.3em; }
        .now-current { color: #ff8080; font-weight: bold; margin-bottom: 0.3em; }
        .now-chara { color: #ccc; font-weight: normal; font-size: 0.85em; }
        .now-muted { color: #888; font-weight: normal; font-size: 0.85em; }
        .now-eliminated { font-size: 0.82em; color: #999; }
        .now-editor-label { display: block; font-size: 0.85rem; color: #ccc; font-weight: bold; margin-bottom: 0.4em; }
        .now-cabinet-head-actions { display: flex; align-items: center; gap: 0.6em; }
        .now-clear-btn {
          background: transparent; border: 1px solid #5e4743; color: #ccc;
          font-size: 0.72rem; padding: 0.2em 0.6em; border-radius: 3px; cursor: pointer;
        }
        .now-clear-btn:hover { background: #3a2a2e; color: #fff; }
        .now-member-list { margin-top: 0.6em; display: flex; flex-direction: column; gap: 0.4em; }
        .now-member-row {
          display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 0.8em;
          font-size: 0.85em; background: rgba(255,255,255,0.05); padding: 0.4em 0.6em; border-radius: 3px;
        }
        .now-member-info { display: flex; align-items: baseline; gap: 0.4em; min-width: 0; }
        .now-member-name { color: #fff; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .now-member-chara { color: #999; white-space: nowrap; }
        .now-radio, .now-checkbox { display: flex; align-items: center; gap: 0.25em; white-space: nowrap; font-weight: normal; margin: 0; }
      `}</style>
      {CABINETS.map(cabinet => (
        <div key={cabinet} className={`now-cabinet${editing === cabinet ? ' editing' : ''}`}>
          <div className="now-cabinet-head" onClick={() => setEditing(editing === cabinet ? null : cabinet)}>
            <span className="now-cabinet-label">{cabinet}</span>
            <span className="now-cabinet-head-actions">
              {editing === cabinet && (
                <button
                  type="button"
                  className="now-clear-btn"
                  onClick={e => { e.stopPropagation(); clearCabinet(cabinet); }}
                >
                  クリア
                </button>
              )}
              <span className="now-edit-hint">{editing === cabinet ? '閉じる ▲' : '編集する ▼'}</span>
            </span>
          </div>
          {editing === cabinet ? (
            <div className="now-editors">
              <SideEditor cabinet={cabinet} side="p1" label="1P" />
              <SideEditor cabinet={cabinet} side="p2" label="2P" />
            </div>
          ) : (
            <div className="now-sides">
              <SideView side={board[cabinet].p1} />
              <SideView side={board[cabinet].p2} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
