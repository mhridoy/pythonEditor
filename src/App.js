import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from "@monaco-editor/react";
import { Resizable } from 're-resizable';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [code, setCode] = useState('# Write your Python code here\nprint("Hello, World!")');
  const [output, setOutput] = useState('');
  const [theme, setTheme] = useState('vs-dark');
  const [isLoading, setIsLoading] = useState(false);
  const [snippetName, setSnippetName] = useState('');

  useEffect(() => {
    const savedCode = localStorage.getItem('pythonCode');
    if (savedCode) {
      setCode(savedCode);
    }
  }, []);

  const handleEditorChange = (value) => {
    setCode(value);
    localStorage.setItem('pythonCode', value);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('https://vuln0sec.pythonanywhere.com/execute', { code });
      setOutput(response.data.output);
      toast.success('Code executed successfully!');
    } catch (error) {
      console.error('Error:', error);
      setOutput('An error occurred while executing the code.');
      toast.error('Failed to execute code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const handleSave = () => {
    if (snippetName) {
      localStorage.setItem(snippetName, code);
      toast.success(`Saved snippet: ${snippetName}`);
      setSnippetName('');
    } else {
      toast.warn('Please enter a name for your snippet.');
    }
  };

  const handleLoad = () => {
    if (snippetName) {
      const loadedCode = localStorage.getItem(snippetName);
      if (loadedCode) {
        setCode(loadedCode);
        toast.success(`Loaded snippet: ${snippetName}`);
      } else {
        toast.error(`No snippet found with name: ${snippetName}`);
      }
      setSnippetName('');
    } else {
      toast.warn('Please enter the name of the snippet to load.');
    }
  };

  return (
    <div className="App" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Python Editor</h1>
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="theme-select">Theme: </label>
        <select id="theme-select" value={theme} onChange={handleThemeChange}>
          <option value="vs-dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>
      <Resizable
        defaultSize={{ width: '100%', height: 400 }}
        minHeight={200}
        maxHeight={800}
      >
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={handleEditorChange}
          theme={theme}
          options={{
            minimap: { enabled: false },
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            fontSize: 14,
          }}
        />
      </Resizable>
      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={handleSubmit} disabled={isLoading} style={{ padding: '10px 20px', fontSize: '16px' }}>
          {isLoading ? 'Running...' : 'Run Code'}
        </button>
        <div>
          <input
            type="text"
            value={snippetName}
            onChange={(e) => setSnippetName(e.target.value)}
            placeholder="Snippet name"
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <button onClick={handleSave} style={{ marginRight: '10px' }}>Save Snippet</button>
          <button onClick={handleLoad}>Load Snippet</button>
        </div>
      </div>
      <h2 style={{ marginTop: '20px' }}>Output:</h2>
      <pre style={{ 
        backgroundColor: '#f4f4f4', 
        padding: '10px', 
        borderRadius: '5px',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word'
      }}>
        {output}
      </pre>
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default App;
