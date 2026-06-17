import React, { useState } from 'react';
import { derivService } from '../services/derivService';
import type { AccountInfo } from '../services/derivService';
import { X, Key, Shield, HelpCircle } from 'lucide-react';


interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (info: AccountInfo) => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [token, setToken] = useState(derivService.getToken());
  const [appId, setAppId] = useState(derivService.getAppId());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Token is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      derivService.setAppId(appId);
      const info = await derivService.authorize(token.trim());
      onSuccess(info);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Please check your token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="card-title">
            <Key /> Connect Deriv Account
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="token-input">
              Deriv API Token
            </label>
            <input
              id="token-input"
              type="password"
              className="form-input"
              placeholder="Enter your API token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={16} className="text-secondary" style={{ color: 'var(--success-color)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Your token is stored locally in your browser and sent directly to Deriv.
            </span>
          </div>

          <div className="form-group">
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '11px', marginBottom: '12px' }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
            </button>

            {showAdvanced && (
              <div className="form-group" style={{ padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <label className="form-label" htmlFor="appid-input">
                  Deriv App ID (Default: 1089)
                </label>
                <input
                  id="appid-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1089"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {error && (
            <div style={{ color: 'var(--danger-color)', fontSize: '13px', marginBottom: '16px', backgroundColor: 'var(--danger-glow)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Connecting...' : 'Authorize'}
            </button>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', fontSize: '12px' }}>
              <HelpCircle size={14} /> How do I get an API token?
            </h4>
            <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Log into your Deriv account.</li>
              <li>Go to Account Settings &gt; API Token.</li>
              <li>Select 'Read' and 'Trade' scopes, name the token, and click 'Create'.</li>
              <li>Copy the generated token and paste it here.</li>
            </ol>
          </div>
        </form>
      </div>
    </div>
  );
};
