import React, { useState } from 'react';
import CollaborativeEditor from './Editor';

export default function App() {
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    const code = window.monacoEditorInstance ? window.monacoEditorInstance.getValue() : '';
    if (!code) {
      setOutput('Editor is empty. Write some code first.');
      return;
    }

    setLoading(true);
    setOutput(`Compiling & Executing ${language.toUpperCase()}...`);

 try {
      const languageMap = {
        javascript: 63,
        python: 71,
        java: 62,
        cpp: 54,
        c: 50
      };

      const langId = languageMap[language] || 63;

      const res = await fetch('https://ce.judge0.com/submissions?wait=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: langId
        }),
      });

      const data = await res.json();
      const runResult = data.stdout || data.stderr || data.compile_output || data.message || 'Execution finished with no output.';
      setOutput(runResult);
    } catch (err) {
      setOutput('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
      setOutput(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#121212', color: '#fff', margin: 0, fontFamily: 'sans-serif' }}>
      <header style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2d2d2d' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>Collaborative Code Sandbox</h3>
        <div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: '6px 12px', marginRight: '10px', background: '#252526', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3</option>
          </select>
          <button
            onClick={handleRun}
            disabled={loading}
            style={{ padding: '6px 16px', background: '#0e639c', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
          >
            {loading ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </header>

      <CollaborativeEditor roomId="shared-room-101" language={language} />

      <section style={{ height: '25vh', borderTop: '2px solid #2d2d2d', padding: '12px 20px', background: '#181818', fontFamily: 'monospace', overflowY: 'auto' }}>
        <div style={{ color: '#888', marginBottom: '6px', fontSize: '13px' }}>Terminal Output:</div>
        <pre style={{ margin: 0, color: '#38bdf8', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{output}</pre>
      </section>
    </div>
  );
}
