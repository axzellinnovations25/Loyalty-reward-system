import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { rewardsApi } from '../../api/rewards';
import type { Reward } from '../../types';

function unwrap(res: any): any {
  return res?.data ?? res;
}

export default function RewardsPage() {
  const [items, setItems] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pointsRequired, setPointsRequired] = useState('');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState<Reward | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rewardsApi.list();
      const payload = unwrap(res);
      setItems(Array.isArray(payload) ? payload : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load rewards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function reset() {
    setEditing(null);
    setPointsRequired('');
    setDescription('');
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const points = Number(pointsRequired);
    if (!Number.isInteger(points) || points <= 0) {
      setError('Points required must be a positive number.');
      return;
    }
    if (!description.trim()) {
      setError('Reward description is required.');
      return;
    }
    try {
      if (editing) {
        await rewardsApi.update(editing.id, { pointsRequired: points, rewardDescription: description.trim(), isActive: editing.isActive });
      } else {
        await rewardsApi.create({ pointsRequired: points, rewardDescription: description.trim() });
      }
      reset();
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to save reward.');
    }
  }

  function startEdit(reward: Reward) {
    setEditing(reward);
    setPointsRequired(String(reward.pointsRequired));
    setDescription(reward.rewardDescription);
  }

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Rewards</h1>
          <p className="adm-page-subtitle">Configure milestone rewards customers can earn with points.</p>
        </div>
      </div>

      <div className="adm-card" style={{ padding: 18, marginBottom: 18 }}>
        <form onSubmit={save} style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto auto', gap: 10, alignItems: 'end' }}>
          <div>
            <label className="adm-label">Points required</label>
            <input className="adm-input" value={pointsRequired} onChange={(e) => setPointsRequired(e.target.value)} placeholder="e.g. 500" />
          </div>
          <div>
            <label className="adm-label">Reward</label>
            <input className="adm-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Free coffee" />
          </div>
          <button className="adm-btn adm-btn--primary" type="submit">{editing ? 'Update' : 'Add Reward'}</button>
          {editing && <button className="adm-btn adm-btn--ghost" type="button" onClick={reset}>Cancel</button>}
        </form>
      </div>

      {error && <div className="adm-alert adm-alert--error">{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Reward</th><th style={{ textAlign: 'right' }}>Points</th><th style={{ textAlign: 'center' }}>Status</th><th style={{ textAlign: 'right' }}></th></tr></thead>
          <tbody>
            {!loading && items.length === 0 ? (
              <tr><td colSpan={4}><div className="adm-empty">No rewards configured yet.</div></td></tr>
            ) : items.map((reward) => (
              <tr key={reward.id}>
                <td style={{ fontWeight: 800 }}>{reward.rewardDescription}</td>
                <td style={{ textAlign: 'right', fontWeight: 900 }}>{reward.pointsRequired.toLocaleString()}</td>
                <td style={{ textAlign: 'center' }}><span className={`adm-badge ${reward.isActive ? 'adm-badge--success' : 'adm-badge--gray'}`}>{reward.isActive ? 'Active' : 'Inactive'}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => startEdit(reward)}>Edit</button>
                    <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={async () => { await rewardsApi.update(reward.id, { isActive: !reward.isActive }); load(); }}>{reward.isActive ? 'Disable' : 'Enable'}</button>
                    <button className="adm-btn adm-btn--ghost adm-btn--sm" style={{ color: 'var(--danger)' }} onClick={async () => { if (confirm('Delete this reward?')) { await rewardsApi.delete(reward.id); load(); } }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
