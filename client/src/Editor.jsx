import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';

export default function CollaborativeEditor({ roomId = 'shared-room-101', language = 'javascript' }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('monaco');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${roomId}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    const editor = monaco.editor.create(editorRef.current, {
      value: '',
      language: language,
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 14,
    });
    window.monacoEditorInstance = editor;

    const binding = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      null
    );

    ws.onmessage = (event) => {
      try {
        const update = new Uint8Array(event.data);
        Y.applyUpdate(ydoc, update);
      } catch (e) {
        console.error('WS Sync Error:', e);
      }
    };

    ydoc.on('update', (update) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(update);
      }
    });

    return () => {
      binding.destroy();
      editor.dispose();
      ws.close();
      ydoc.destroy();
    };
  }, [roomId]);

  useEffect(() => {
    if (window.monacoEditorInstance) {
      const model = window.monacoEditorInstance.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language === 'python' ? 'python' : 'javascript');
      }
    }
  }, [language]);

  return <div ref={editorRef} style={{ flex: 1, width: '100%' }} />;
}
