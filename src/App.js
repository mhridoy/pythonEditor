import React, { useState } from 'react';
import axios from 'axios';
import Editor from "@monaco-editor/react";

function App() {
  const [code, setCode] = useState('# Write your Python code here\nprint("Hello, World!")');
  const [output, setOutput] = useState('');

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post('https://vuln0sec.pythonanywhere.com/execute', { code });
      setOutput(response.data.output);
    } catch (error) {
      console.error('Error:', error);
      setOutput('An error occurred while executing the code.');
    }
  };

  return (
    <div className="App">
      <h1>Python Editor</h1>
      <Editor
        height="400px"
        defaultLanguage="python"
        defaultValue={code}
        onChange={handleEditorChange}
      />
      <button onClick={handleSubmit}>Run Code</button>
      <h2>Output:</h2>
      <pre>{output}</pre>
    </div>
  );
}

export default App;
