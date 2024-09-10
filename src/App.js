import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from "@monaco-editor/react";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Button, IconButton, TextField, Modal, Fab, CircularProgress } from '@mui/material';
import { PlayArrow, Save, FolderOpen, Code } from '@mui/icons-material';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('python', python);

const StyledApp = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const EditorWrapper = styled.div`
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const OutputWrapper = styled(motion.div)`
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
`;

const ModalContent = styled.div`
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 20px;
  width: 300px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#bb86fc',
    },
    secondary: {
      main: '#03dac6',
    },
  },
});

function App() {
  const [code, setCode] = useState('# Write your Python code here\nprint("Hello, World!")');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snippetName, setSnippetName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('save');

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
    } catch (error) {
      console.error('Error:', error);
      setOutput('An error occurred while executing the code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (snippetName) {
      localStorage.setItem(snippetName, code);
      setIsModalOpen(false);
      setSnippetName('');
    }
  };

  const handleLoad = () => {
    if (snippetName) {
      const loadedCode = localStorage.getItem(snippetName);
      if (loadedCode) {
        setCode(loadedCode);
        setIsModalOpen(false);
        setSnippetName('');
      }
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <StyledApp>
        <h1>Python Playground</h1>
        <EditorWrapper>
          <Editor
            height="400px"
            defaultLanguage="python"
            value={code}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 16,
            }}
          />
        </EditorWrapper>
        <ButtonGroup>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrow />}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Running...' : 'Run Code'}
          </Button>
          <div>
            <IconButton color="secondary" onClick={() => { setModalMode('save'); setIsModalOpen(true); }}>
              <Save />
            </IconButton>
            <IconButton color="secondary" onClick={() => { setModalMode('load'); setIsModalOpen(true); }}>
              <FolderOpen />
            </IconButton>
          </div>
        </ButtonGroup>
        <AnimatePresence>
          {output && (
            <OutputWrapper
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <h2>Output:</h2>
              <SyntaxHighlighter language="python" style={atomOneDark}>
                {output}
              </SyntaxHighlighter>
            </OutputWrapper>
          )}
        </AnimatePresence>
        <Fab
          color="secondary"
          style={{ position: 'fixed', bottom: 20, right: 20 }}
          onClick={() => setCode('# New code\n')}
        >
          <Code />
        </Fab>
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <ModalContent>
            <h2>{modalMode === 'save' ? 'Save Snippet' : 'Load Snippet'}</h2>
            <TextField
              fullWidth
              label="Snippet Name"
              value={snippetName}
              onChange={(e) => setSnippetName(e.target.value)}
              style={{ marginBottom: 20 }}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={modalMode === 'save' ? handleSave : handleLoad}
            >
              {modalMode === 'save' ? 'Save' : 'Load'}
            </Button>
          </ModalContent>
        </Modal>
      </StyledApp>
      {isLoading && (
        <CircularProgress
          size={68}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            marginTop: -34,
            marginLeft: -34,
          }}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
