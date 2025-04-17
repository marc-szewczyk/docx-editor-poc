import React, { useRef, useReducer, useEffect } from 'react';
import DOMPurify from 'dompurify';
import FileUploader from './components/FileUploader';
import StatusMessages from './components/StatusMessages';
import { createReactToolbar } from './components/EditorToolbar';
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
      console.log('Setting file:', action.payload); // Add this for debugging
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
  const activeEditableRef = useRef(null); // Track the currently active editable element

  useEffect(() => {
    // Configure DOMPurify to allow styles and specific CSS properties
    DOMPurify.setConfig({
      ADD_TAGS: ['style', 'font'],
      ADD_ATTR: ['style', 'class', 'face', 'size', 'color'],
      FORBID_TAGS: ['script'],
      FORBID_ATTR: ['onerror', 'onload']
    });
  }, []);

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
      
      // Process HTML before setting it to fix nested font issues
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = result.html;
      
      // Fix nested fonts
      tempDiv.querySelectorAll('font[face] > font').forEach(nestedFont => {
        const parentFont = nestedFont.parentElement;
        if (parentFont.tagName === 'FONT' && parentFont.hasAttribute('face')) {
          const fontFamily = parentFont.getAttribute('face');
          // Apply parent's font-face to child's style
          if (nestedFont.hasAttribute('style')) {
            nestedFont.setAttribute(
              'style', 
              `${nestedFont.getAttribute('style')}; font-family: ${fontFamily};`
            );
          } else {
            nestedFont.setAttribute('style', `font-family: ${fontFamily};`);
          }
        }
      });
      
      dispatch({ type: 'SET_HTML', payload: tempDiv.innerHTML });
      dispatch({ type: 'SET_SERVER_MESSAGE', payload: 'Document successfully loaded' }); // Set success message instead of clearing
    } catch (error) {
      console.error('Upload error:', error);
      dispatch({ type: 'SET_SERVER_MESSAGE', payload: `Error: ${error.message}` });
    }
  };

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
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
          dispatch({
            type: 'SET_DOWNLOAD_URL',
            payload: `${API_BASE_URL}${result.downloadUrl}`
          });
        }

        dispatch({ type: 'SET_DOWNLOAD_SUCCESS', payload: true });
        // Only remove the success highlight after timeout, keep the URL
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

  const createEditorToolbar = createReactToolbar;

  const createEditableParagraph = (paragraph) => {
    // Skip if already editing something
    if (activeEditableRef.current) return;
    
    console.log('Making paragraph editable');
    
    // Get paragraph properties
    const content = paragraph.innerHTML;
    const classNames = paragraph.className || '';
    const styles = paragraph.getAttribute('style') || '';
    
    // Create editable paragraph
    const editableP = document.createElement('p');
    editableP.innerHTML = content;
    editableP.className = `${classNames} ${styles.editableParagraph}`;
    editableP.contentEditable = true;
    
    if (styles) {
      editableP.setAttribute('style', styles);
    }
    editableP.style.cursor = 'text';
    editableP.style.outline = '2px solid #0d6efd'; // Explicitly set blue outline
    
    // Create container
    const editingContainer = document.createElement('div');
    editingContainer.className = styles.editingContainer;
    editingContainer.style.position = 'relative'; // Ensure relative positioning
    
    // Create toolbar using our React component
    const { element: toolbar, cleanup } = createEditorToolbar(editableP);
    
    // Set toolbar position properties directly
    toolbar.style.position = 'absolute';
    toolbar.style.top = '-45px';
    toolbar.style.left = '0';
    toolbar.style.zIndex = '10';
    
    // Add to container - add the editable paragraph first, THEN the toolbar
    editingContainer.appendChild(editableP);
    editingContainer.appendChild(toolbar);
    
    // Replace paragraph with editing container
    paragraph.replaceWith(editingContainer);
    activeEditableRef.current = editingContainer;
    
    // Focus
    editableP.focus();
    
    // Handle clicks outside to save changes
    const handleOutsideClick = (e) => {
      if (!editingContainer.contains(e.target)) {
        // Clean up the React component first
        cleanup();
        
        // Save changes to a new paragraph
        const newP = document.createElement('p');
        newP.innerHTML = editableP.innerHTML;
        newP.className = classNames;
        
        if (styles) {
          newP.setAttribute('style', styles);
        }
        newP.style.cursor = 'pointer';
        
        // Add click handler that makes this paragraph editable again
        newP.addEventListener('click', () => createEditableParagraph(newP));
        
        // Replace editing container with paragraph
        editingContainer.replaceWith(newP);
        activeEditableRef.current = null;
        
        // Remove document click listener
        document.removeEventListener('mousedown', handleOutsideClick);
      }
    };
    
    // Delay adding click handler to avoid immediate trigger
    setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick);
    }, 10);
  };

  // Set up paragraph click handlers when HTML changes
  useEffect(() => {
    if (!docRef.current || !html) return;
    
    // Set up paragraph handlers
    const setupParagraphHandlers = () => {
      const paragraphs = docRef.current.querySelectorAll('p');
      
      paragraphs.forEach(p => {
        p.style.cursor = 'pointer';
        // Use the reusable function for the initial click handler too
        p.addEventListener('click', () => createEditableParagraph(p));
      });
    };
    
    // Set up handlers after a small delay to ensure DOM is fully loaded
    setTimeout(setupParagraphHandlers, 0);
    
    // Cleanup function
    return () => {
      if (docRef.current) {
        const paragraphs = docRef.current.querySelectorAll('p');
        paragraphs.forEach(p => {
          p.style.cursor = ''; // Reset cursor
          // Clone the node to remove all event listeners
          const newP = p.cloneNode(true);
          if (p.parentNode) {
            p.parentNode.replaceChild(newP, p);
          }
        });
      }
    };
  }, [html]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>DOCX Editor Prototype</h1>
      
      <FileUploader onFileSelect={(selectedFile) => dispatch({ type: 'SET_FILE', payload: selectedFile })} />
      
      {/* Simplify button container to avoid duplicates */}
      <div className={styles.buttonContainer}>
        <button 
          className={styles.uploadButton} 
          onClick={handleUpload} 
          disabled={!file}
        >
          Convert to HTML
        </button>
        
        <button 
          className={styles.saveButton} 
          onClick={handleSave} 
          disabled={!html || saving}
        >
          {saving ? 'Generating...' : 'Save & Generate DOCX'}
        </button>
      </div>
      
      <StatusMessages 
        downloadSuccess={downloadSuccess} 
        serverMessage={serverMessage} 
        downloadUrl={downloadUrl} 
      />
      
      <div className={styles.documentWrapper}>
        <div 
          ref={docRef}
          className={styles.document}
          dangerouslySetInnerHTML={html ? {__html: DOMPurify.sanitize(html)} : {__html: ''}}
        />
      </div>
    </div>
  );
};

export default App;