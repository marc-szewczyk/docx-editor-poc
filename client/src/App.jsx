import React, { useRef, useReducer, useEffect } from 'react';
import DOMPurify from 'dompurify';
import FileUploader from './components/FileUploader';
import StatusMessages from './components/StatusMessages';
import styles from './styles/Document.module.css';

// Add reducer function and initial state
const initialState = {
  file: null,
  html: '',
  saving: false,
  downloadSuccess: false,
  downloadUrl: '',
  serverMessage: ''
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, file: action.payload };
    case 'SET_HTML':
      return { ...state, html: action.payload };
    case 'SET_SAVING':
      return { ...state, saving: action.payload };
    case 'SET_DOWNLOAD_SUCCESS':
      return { ...state, downloadSuccess: action.payload };
    case 'SET_DOWNLOAD_URL':
      return { ...state, downloadUrl: action.payload };
    case 'SET_SERVER_MESSAGE':
      return { ...state, serverMessage: action.payload };
    default:
      return state;
  }
}

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { file, html, saving, downloadSuccess, downloadUrl, serverMessage } = state;
  const docRef = useRef(null);
  const activeEditableRef = useRef(null);

  const handleUpload = async () => {
    try {
      dispatch({ type: 'SET_SERVER_MESSAGE', payload: 'Uploading and converting document...' });

      const formData = new FormData();
      formData.append('docx', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status}`);
      }

      const result = await res.json();
      dispatch({ type: 'SET_HTML', payload: result.html });
      dispatch({ type: 'SET_SERVER_MESSAGE', payload: '' });
    } catch (error) {
      console.error('Upload error:', error);
      dispatch({ type: 'SET_SERVER_MESSAGE', payload: `Error: ${error.message}` });
    }
  };

  // Update handleSave function
  const handleSave = async () => {
    try {
      const cleanedHtml = docRef.current.innerHTML;

      dispatch({ type: 'SET_SAVING', payload: true });

      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: cleanedHtml })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const result = await res.json();

      if (result.success) {
        dispatch({ type: 'SET_SERVER_MESSAGE', payload: result.message });

        if (result.downloadUrl) {
          const API_BASE_URL = window.location.origin.includes('localhost')
            ? 'http://localhost:5000'
            : '';
          dispatch({
            type: 'SET_DOWNLOAD_URL',
            payload: `${API_BASE_URL}${result.downloadUrl}`
          });
        }

        dispatch({ type: 'SET_DOWNLOAD_SUCCESS', payload: true });
        setTimeout(() =>
          dispatch({ type: 'SET_DOWNLOAD_SUCCESS', payload: false }),
          5000
        );
      } else {
        dispatch({
          type: 'SET_SERVER_MESSAGE',
          payload: result.message || 'File processing failed on server'
        });
        alert('DOCX generation had issues. See details in the message below.');
      }
    } catch (error) {
      console.error('Save error:', error);
      dispatch({ type: 'SET_SERVER_MESSAGE', payload: `Error: ${error.message}` });
      alert('Failed to save document. Please try again.');
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  // Function to execute a document command
  const execFormatCommand = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  // Create a toolbar for formatting
  const createEditorToolbar = (editableElement) => {
    const toolbar = document.createElement('div');
    toolbar.className = styles.editorToolbar;

    // Font family selector
    const fontSelector = document.createElement('select');
    fontSelector.className = 'font-options';
    fontSelector.innerHTML = `
      <option value="">Font...</option>
      <option value="Arial, sans-serif">Arial</option>
      <option value="Calibri, sans-serif">Calibri</option>
      <option value="'Comic Sans MS', cursive">Comic Sans</option>
      <option value="'Courier New', monospace">Courier New</option>
      <option value="Georgia, serif">Georgia</option>
      <option value="Helvetica, sans-serif">Helvetica</option>
      <option value="'Times New Roman', Times, serif">Times New Roman</option>
      <option value="Verdana, sans-serif">Verdana</option>
    `;
    fontSelector.addEventListener('change', (e) => {
      if (e.target.value) {
        // Extract just the primary font name without fallbacks
        const primaryFont = e.target.value.split(',')[0].replace(/['"]/g, '').trim();
        console.log(`Setting font: ${primaryFont} (from ${e.target.value})`);
        execFormatCommand('fontName', primaryFont);
      }
    });

    // Font size selector
    const sizeSelector = document.createElement('select');
    sizeSelector.className = 'size-options';
    sizeSelector.innerHTML = `
      <option value="">Size...</option>
      <option value="1">Small</option>
      <option value="3">Normal</option>
      <option value="5">Large</option>
      <option value="7">Huge</option>
    `;
    sizeSelector.addEventListener('change', (e) => {
      if (e.target.value) {
        execFormatCommand('fontSize', e.target.value);
      }
    });

    // Bold button
    const boldButton = document.createElement('button');
    boldButton.innerHTML = '<b>B</b>';
    boldButton.title = 'Bold';
    boldButton.addEventListener('click', () => execFormatCommand('bold'));

    // Italic button
    const italicButton = document.createElement('button');
    italicButton.innerHTML = '<i>I</i>';
    italicButton.title = 'Italic';
    italicButton.addEventListener('click', () => execFormatCommand('italic'));

    // Underline button
    const underlineButton = document.createElement('button');
    underlineButton.innerHTML = '<u>U</u>';
    underlineButton.title = 'Underline';
    underlineButton.addEventListener('click', () => execFormatCommand('underline'));

    // Text color picker
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.className = 'color-picker';
    colorPicker.title = 'Text Color';
    colorPicker.addEventListener('change', (e) => {
      execFormatCommand('foreColor', e.target.value);
    });

    // Background color picker
    const bgColorPicker = document.createElement('input');
    bgColorPicker.type = 'color';
    bgColorPicker.className = 'color-picker';
    bgColorPicker.title = 'Background Color';
    bgColorPicker.addEventListener('change', (e) => {
      execFormatCommand('hiliteColor', e.target.value);
    });

    // Left align
    const alignLeftButton = document.createElement('button');
    alignLeftButton.innerHTML = '⫪';
    alignLeftButton.title = 'Align Left';
    alignLeftButton.addEventListener('click', () => execFormatCommand('justifyLeft'));

    // Center align
    const alignCenterButton = document.createElement('button');
    alignCenterButton.innerHTML = '⫱';
    alignCenterButton.title = 'Align Center';
    alignCenterButton.addEventListener('click', () => execFormatCommand('justifyCenter'));

    // Right align
    const alignRightButton = document.createElement('button');
    alignRightButton.innerHTML = '⫫';
    alignRightButton.title = 'Align Right';
    alignRightButton.addEventListener('click', () => execFormatCommand('justifyRight'));

    // Add all elements to toolbar
    toolbar.appendChild(fontSelector);
    toolbar.appendChild(sizeSelector);
    toolbar.appendChild(boldButton);
    toolbar.appendChild(italicButton);
    toolbar.appendChild(underlineButton);
    toolbar.appendChild(colorPicker);
    toolbar.appendChild(bgColorPicker);
    toolbar.appendChild(alignLeftButton);
    toolbar.appendChild(alignCenterButton);
    toolbar.appendChild(alignRightButton);

    return toolbar;
  };

  useEffect(() => {
    if (!docRef.current) return;

    const paragraphs = docRef.current.querySelectorAll('p');

    paragraphs.forEach((p) => {
      p.style.cursor = 'pointer';

      const handleClick = () => {
        if (activeEditableRef.current) return;

        // Store original content and styles
        const originalContent = p.innerHTML;
        const originalClassNames = p.className;
        const originalStyles = p.getAttribute('style') || '';

        // Create editable paragraph to replace the original
        const editableP = document.createElement('p');
        editableP.innerHTML = originalContent;
        editableP.className = originalClassNames + ` ${styles.editableParagraph}`;
        editableP.contentEditable = true;

        // Apply all original styles
        editableP.setAttribute('style', originalStyles);
        editableP.style.cursor = 'text';

        // Create a positioned container for the paragraph
        const editingContainer = document.createElement('div');
        editingContainer.style.position = 'relative'; // For absolute positioning of toolbar

        // Create and add toolbar
        const toolbar = createEditorToolbar(editableP);

        // Add editable paragraph first
        editingContainer.appendChild(editableP);

        // Add toolbar after (but it will display above due to absolute positioning)
        editingContainer.appendChild(toolbar);

        // Replace original paragraph with editing container
        p.replaceWith(editingContainer);
        activeEditableRef.current = editingContainer;

        // Focus on the editable paragraph
        editableP.focus();

        // Function to finish editing
        const finishEdit = (e) => {
          // Only finish if clicking outside the editing container
          if (editingContainer.contains(e.target)) return;

          // Get the edited content
          const updatedHTML = editableP.innerHTML;

          // Create a new paragraph with the updated content
          const newP = document.createElement('p');
          newP.innerHTML = updatedHTML;
          newP.className = originalClassNames;

          // Apply the original styles (cursor, etc.)
          if (originalStyles) {
            newP.setAttribute('style', originalStyles);
          }
          newP.style.cursor = 'pointer';

          // Add click handler for future edits
          newP.addEventListener('click', handleClick);

          // Replace editor with the new paragraph
          editingContainer.replaceWith(newP);
          activeEditableRef.current = null;

          // Remove the document click listener
          document.removeEventListener('mousedown', finishEdit);
        };

        // Handle clicking outside to finish editing
        document.addEventListener('mousedown', finishEdit);
      };

      p.addEventListener('click', handleClick);
    });
  }, [html]);

  return (
    <div>
      <h1>DOCX Editor POC</h1>
      <FileUploader
        file={file}
        setFile={(newFile) => dispatch({ type: 'SET_FILE', payload: newFile })}
        onUpload={handleUpload}
        saving={saving}
        onSave={handleSave}
      />
      <StatusMessages
        downloadSuccess={downloadSuccess}
        serverMessage={serverMessage}
        downloadUrl={downloadUrl}
      />
      <div
        ref={docRef}
        className={styles.documentContainer}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
      />
    </div>
  );
};

export default App;