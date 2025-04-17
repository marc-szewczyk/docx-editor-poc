import React, { useRef, useReducer, useEffect, useState } from 'react';
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

  // Function to create editor toolbar
  const createEditorToolbar = (editableElement) => {
    const toolbar = document.createElement('div');
    toolbar.className = styles.editorToolbar;
    toolbar.style.display = 'flex';
    toolbar.style.alignItems = 'center'; // Ensure vertical alignment
    toolbar.style.gap = '5px';
    
    // Execute format command helper function
    const execFormatCommand = (command, value = null) => {
      editableElement.focus();
      document.execCommand(command, false, value);
    };
    
    // Font family selector
    const fontSelector = document.createElement('select');
    fontSelector.className = styles.editorSelect;
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
        const primaryFont = e.target.value.split(',')[0].replace(/['"]/g, '').trim();
        execFormatCommand('fontName', primaryFont);
      }
    });
    
    // Font size selector
    const sizeSelector = document.createElement('select');
    sizeSelector.className = styles.editorSelect;
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
    boldButton.className = styles.editorButton;
    boldButton.innerHTML = '<b>B</b>';
    boldButton.title = 'Bold';
    boldButton.addEventListener('click', () => execFormatCommand('bold'));
    
    // Italic button
    const italicButton = document.createElement('button');
    italicButton.className = styles.editorButton;
    italicButton.innerHTML = '<i>I</i>';
    italicButton.title = 'Italic';
    italicButton.addEventListener('click', () => execFormatCommand('italic'));
    
    // Underline button
    const underlineButton = document.createElement('button');
    underlineButton.className = styles.editorButton;
    underlineButton.innerHTML = '<u>U</u>';
    underlineButton.title = 'Underline';
    underlineButton.addEventListener('click', () => execFormatCommand('underline'));
    
    // Text color picker with A and underline
    const colorPickerContainer = document.createElement('div');
    colorPickerContainer.style.position = 'relative';
    colorPickerContainer.style.width = '30px';
    colorPickerContainer.style.height = '30px'; // Change from 25px to 30px
    colorPickerContainer.className = styles.editorButtonContainer;

    // Create the A with underline display
    const colorDisplay = document.createElement('div');
    colorDisplay.className = styles.editorButton;
    colorDisplay.style.display = 'flex';
    colorDisplay.style.flexDirection = 'column';
    colorDisplay.style.alignItems = 'center';
    colorDisplay.style.justifyContent = 'center';
    colorDisplay.style.cursor = 'pointer';
    colorDisplay.title = 'Text Color';

    // The letter A
    const textElement = document.createElement('span');
    textElement.textContent = 'A';
    textElement.style.fontWeight = 'bold';
    textElement.style.fontSize = '16px';
    textElement.style.lineHeight = '1';
    textElement.style.marginBottom = '2px';

    // The colored underline
    const underlineElement = document.createElement('div');
    underlineElement.style.height = '5px';
    underlineElement.style.width = '16px';
    underlineElement.style.backgroundColor = '#000';
    underlineElement.style.borderRadius = '1px';

    colorDisplay.appendChild(textElement);
    colorDisplay.appendChild(underlineElement);

    // The actual color input (hidden)
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.className = styles.hiddenColorPicker;
    colorPicker.title = 'Text Color';
    colorPicker.style.opacity = '0';
    colorPicker.style.position = 'absolute';
    colorPicker.style.left = '0';
    colorPicker.style.top = '0';
    colorPicker.style.width = '100%';
    colorPicker.style.height = '100%';
    colorPicker.style.cursor = 'pointer';

    colorPicker.addEventListener('change', (e) => {
      underlineElement.style.backgroundColor = e.target.value;
      execFormatCommand('foreColor', e.target.value);
    });

    // Clicking on the display also triggers the color picker
    colorDisplay.addEventListener('click', () => {
      colorPicker.click();
    });

    colorPickerContainer.appendChild(colorDisplay);
    colorPickerContainer.appendChild(colorPicker);

    // Background color picker with highlighter icon
    const bgColorPickerContainer = document.createElement('div');
    bgColorPickerContainer.style.position = 'relative';
    bgColorPickerContainer.style.width = '30px';
    bgColorPickerContainer.style.height = '30px'; // Change from 25px to 30px
    bgColorPickerContainer.className = styles.editorButtonContainer;

    // Create the highlighter display
    const bgColorDisplay = document.createElement('div');
    bgColorDisplay.className = styles.editorButton;
    bgColorDisplay.style.display = 'flex';
    bgColorDisplay.style.alignItems = 'center';
    bgColorDisplay.style.justifyContent = 'center';
    bgColorDisplay.style.cursor = 'pointer';
    bgColorDisplay.title = 'Background Color';

    // Use a simpler, more visible highlighter representation
    const highlighterIcon = document.createElement('div');
    highlighterIcon.style.display = 'flex';
    highlighterIcon.style.flexDirection = 'column';
    highlighterIcon.style.alignItems = 'center';
    highlighterIcon.style.width = '100%';
    highlighterIcon.style.height = '100%';

    // Highlighter tip with diagonal top
    const highlighterTip = document.createElement('div');
    highlighterTip.style.position = 'relative'; 
    highlighterTip.style.width = '10px';
    highlighterTip.style.height = '15px';
    highlighterTip.style.backgroundColor = '#fff';
    highlighterTip.style.borderBottomLeftRadius = '1px';
    highlighterTip.style.borderBottomRightRadius = '1px';
    highlighterTip.style.overflow = 'hidden'; // Hide the diagonal piece overflow

    // Create diagonal element for the tip
    const diagonalCut = document.createElement('div');
    diagonalCut.style.position = 'absolute';
    diagonalCut.style.top = '-5px';
    diagonalCut.style.left = '-5px';
    diagonalCut.style.width = '20px';
    diagonalCut.style.height = '10px';
    diagonalCut.style.backgroundColor = 'white';
    diagonalCut.style.transform = 'rotate(15deg)'; // Angle of the diagonal cut

    // Add the diagonal cut to the tip
    highlighterTip.appendChild(diagonalCut);

    // Highlighter body
    const highlighterBody = document.createElement('div');
    highlighterBody.style.width = '12px';
    highlighterBody.style.height = '5px';
    highlighterBody.style.backgroundColor = '#777';
    highlighterBody.style.borderBottomLeftRadius = '3px';
    highlighterBody.style.borderBottomRightRadius = '3px';
    highlighterBody.style.transform = 'perspective(4px) rotateX(25deg)'; // Slightly reduced perspective
    highlighterBody.style.transformOrigin = 'top center';
    highlighterBody.style.marginTop = '-1px';

    // Assemble the highlighter
    highlighterIcon.appendChild(highlighterTip);
    highlighterIcon.appendChild(highlighterBody);
    bgColorDisplay.appendChild(highlighterIcon);

    // The actual bg color input (hidden)
    const bgColorPicker = document.createElement('input');
    bgColorPicker.type = 'color';
    bgColorPicker.className = styles.hiddenColorPicker;
    bgColorPicker.title = 'Background Color';
    bgColorPicker.style.opacity = '0';
    bgColorPicker.style.position = 'absolute';
    bgColorPicker.style.left = '0';
    bgColorPicker.style.top = '0';
    bgColorPicker.style.width = '100%';
    bgColorPicker.style.height = '100%';
    bgColorPicker.style.cursor = 'pointer';

    bgColorPicker.addEventListener('change', (e) => {
      // Update both body and tip with the selected color
      highlighterTip.style.backgroundColor = e.target.value;
      //highlighterBody.style.backgroundColor = e.target.value;
      execFormatCommand('hiliteColor', e.target.value);
    });

    // Clicking on the display also triggers the color picker
    bgColorDisplay.addEventListener('click', () => {
      bgColorPicker.click();
    });

    bgColorPickerContainer.appendChild(bgColorDisplay);
    bgColorPickerContainer.appendChild(bgColorPicker);

    // Left align
    const alignLeftButton = document.createElement('button');
    alignLeftButton.className = styles.editorButton;
    alignLeftButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect x="0" y="2" width="10" height="2" fill="currentColor"/>
        <rect x="0" y="6" width="16" height="2" fill="currentColor"/>
        <rect x="0" y="10" width="12" height="2" fill="currentColor"/>
      </svg>
    `;
    alignLeftButton.title = 'Align Left';
    alignLeftButton.addEventListener('click', () => execFormatCommand('justifyLeft'));
    
    // Center align
    const alignCenterButton = document.createElement('button');
    alignCenterButton.className = styles.editorButton;
    alignCenterButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect x="3" y="2" width="10" height="2" fill="currentColor"/>
        <rect x="0" y="6" width="16" height="2" fill="currentColor"/>
        <rect x="2" y="10" width="12" height="2" fill="currentColor"/>
      </svg>
    `;
    alignCenterButton.title = 'Align Center';
    alignCenterButton.addEventListener('click', () => execFormatCommand('justifyCenter'));
    
    // Right align
    const alignRightButton = document.createElement('button');
    alignRightButton.className = styles.editorButton;
    alignRightButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect x="6" y="2" width="10" height="2" fill="currentColor"/>
        <rect x="0" y="6" width="16" height="2" fill="currentColor"/>
        <rect x="4" y="10" width="12" height="2" fill="currentColor"/>
      </svg>
    `;
    alignRightButton.title = 'Align Right';
    alignRightButton.addEventListener('click', () => execFormatCommand('justifyRight'));
    
    // Create button groups for better organization
    const formatButtonGroup = document.createElement('div');
    formatButtonGroup.className = styles.editorButtonGroup;
    formatButtonGroup.style.display = 'flex';
    formatButtonGroup.style.gap = '2px';
    formatButtonGroup.appendChild(boldButton);
    formatButtonGroup.appendChild(italicButton);
    formatButtonGroup.appendChild(underlineButton);

    const colorButtonGroup = document.createElement('div');
    colorButtonGroup.className = styles.editorButtonGroup;
    colorButtonGroup.style.display = 'flex';
    colorButtonGroup.style.gap = '2px';
    colorButtonGroup.appendChild(colorPickerContainer);
    colorButtonGroup.appendChild(bgColorPickerContainer);

    const alignButtonGroup = document.createElement('div');
    alignButtonGroup.className = styles.editorButtonGroup;
    alignButtonGroup.style.display = 'flex';
    alignButtonGroup.style.gap = '2px';
    alignButtonGroup.appendChild(alignLeftButton);
    alignButtonGroup.appendChild(alignCenterButton);
    alignButtonGroup.appendChild(alignRightButton);

    // Add all elements to toolbar in groups
    toolbar.appendChild(fontSelector);
    toolbar.appendChild(sizeSelector);
    toolbar.appendChild(formatButtonGroup);
    toolbar.appendChild(colorButtonGroup);
    toolbar.appendChild(alignButtonGroup);
    
    return toolbar;
  };

  // Create a reusable function that makes a paragraph editable
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
    
    // Create toolbar
    const toolbar = createEditorToolbar(editableP);
    
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