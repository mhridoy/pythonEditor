import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Editor from "@monaco-editor/react";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Button, IconButton, TextField, Modal, Fab, CircularProgress, Box } from '@mui/material';
import { PlayArrow, Save, FolderOpen, Code } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import Tab from '@mui/material/Tab';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

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

const TerminalWrapper = styled.div`
  height: 200px;
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 10px;
  margin-top: 20px;
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
  const [code, setCode] = useState('# Write your Python code here\nname = input("Enter your name: ")\nprint(f"Hello, {name}!")');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snippetName, setSnippetName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('save');
  const [tabValue, setTabValue] = useState('1');
  const terminalRef = useRef(null);
  const [terminal, setTerminal] = useState(null);
  const [inputBuffer, setInputBuffer] = useState('');
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);

  useEffect(() => {
    const savedCode = localStorage.getItem('pythonCode');
    if (savedCode) {
      setCode(savedCode);
    }

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    setTerminal(term);

    term.onKey(({ key, domEvent }) => {
      if (isWaitingForInput) {
        if (domEvent.keyCode === 13) { // Enter key
          term.write('\r\n');
          setIsWaitingForInput(false);
          handleInput(inputBuffer);
          setInputBuffer('');
        } else if (domEvent.keyCode === 8) { // Backspace
          if (inputBuffer.length > 0) {
            term.write('\b \b');
            setInputBuffer(inputBuffer.slice(0, -1));
          }
        } else {
          term.write(key);
          setInputBuffer(inputBuffer + key);
        }
      }
    });

    return () => {
      term.dispose();
    };
  }, []);

  const handleEditorChange = (value) => {
    setCode(value);
    localStorage.setItem('pythonCode', value);
  };

  const handleInput = async (input) => {
    try {
      const response = await axios.post('https://vuln0sec.pythonanywhere.com/input', { input });
      const newOutput = response.data.output;
      setOutput(prevOutput => prevOutput + newOutput);
      terminal.writeln(newOutput);
      if (newOutput.includes('input')) {
        setIsWaitingForInput(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setOutput(prevOutput => prevOutput + 'An error occurred while processing input.\n');
      terminal.writeln('An error occurred while processing input.');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setOutput('');
    terminal.clear();
    try {
      const response = await axios.post('https://vuln0sec.pythonanywhere.com/execute', { code });
      const initialOutput = response.data.output;
      setOutput(initialOutput);
      terminal.writeln(initialOutput);
      if (initialOutput.includes('input')) {
        setIsWaitingForInput(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setOutput('An error occurred while executing the code.');
      terminal.writeln('An error occurred while executing the code.');
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
        <TabContext value={tabValue}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={handleTabChange} aria-label="output tabs">
              <Tab label="Output" value="1" />
              <Tab label="Terminal" value="2" />
            </TabList>
          </Box>
          <TabPanel value="1">
            <AnimatePresence>
              {output && (
                <OutputWrapper
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <SyntaxHighlighter language="python" style={atomOneDark}>
                    {output}
                  </SyntaxHighlighter>
                </OutputWrapper>
              )}
            </AnimatePresence>
          </TabPanel>
          <TabPanel value="2">
            <TerminalWrapper ref={terminalRef} />
          </TabPanel>
        </TabContext>
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
