import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      try {
        const { data: config } = await api.get(`/editor/config/${id}`);

        if (!window.DocsAPI) {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = `${window.location.protocol}//${window.location.hostname}:8080/web-apps/apps/api/documents/api.js`;
            s.onload = resolve;
            s.onerror = () => reject(new Error('Cannot load OnlyOffice'));
            document.head.appendChild(s);
          });
        }

        config.height = '100%';
        config.width = '100%';

        new window.DocsAPI.DocEditor('oo-host', config);

      } catch (err) {
        console.error('Editor init failed:', err);
        document.getElementById('oo-host').innerHTML =
          '<div style="padding:40px;color:red;text-align:center">Failed to load editor: ' + 
          (err.message || 'Unknown error') + '</div>';
      }
    }

    init();
  }, [id]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        height: 40, background: '#1B4F72', display: 'flex',
        alignItems: 'center', padding: '0 16px', color: '#fff', flexShrink: 0
      }}>
        <button onClick={() => navigate(`/contracts/${id}`)}
          style={{ background: 'none', border: '1px solid #fff', color: '#fff',
                   borderRadius: 4, padding: '4px 12px', cursor: 'pointer', marginRight: 16 }}>
          ← Back
        </button>
        <span style={{ fontWeight: 600 }}>Document Editor</span>
      </div>
      <div id="oo-host" style={{ flex: 1, overflow: 'hidden' }} />
    </div>
  );
}