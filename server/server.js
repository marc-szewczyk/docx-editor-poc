const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/output', express.static(path.join(__dirname, 'output')));

app.post('/api/upload', upload.single('docx'), (req, res) => {
  const filePath = req.file.path;
  const outputPath = path.join(__dirname, 'output', `${req.file.filename}.html`);

  exec(`soffice --headless --convert-to html --outdir output ${filePath}`, (err) => {
    if (err) return res.status(500).send('Conversion failed.');
    
    const htmlFilePath = `/output/${req.file.filename}.html`;

    const htmlContent = fs.readFileSync(outputPath, 'utf8');
    res.json({ 
      html: htmlContent,
      htmlLink: htmlFilePath,
    });
  });
});

app.post('/api/save', (req, res) => {
  const rawHtml = req.body.html;
  const outputDir = path.join(__dirname, 'output');
  
  // Generate a unique filename - make sure to use .htm extension
  // (LibreOffice sometimes has issues with .html files)
  const timestamp = Date.now();
  const htmlFilename = `edited_${timestamp}.htm`;
  const htmlFilePath = path.join(outputDir, htmlFilename);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // // Process the HTML to clean up font specifications
  // This converts "Font Name, fallback1, fallback2" to just "Font Name"
  let processedHtml = rawHtml;
  
  // Find all font-family style attributes and extract just the primary font
  processedHtml = processedHtml.replace(/font-family:\s*['"]?([^,;'"]+)([^;'"]*)['"]?/gi, (match, primaryFont, fallbacks) => {
    console.log(`Replacing font-family: "${match}" with "font-family: ${primaryFont.trim()}"`);
    return `font-family: ${primaryFont.trim()}`;
  });
  
  // Find all style attributes containing "font-family" and clean them
  processedHtml = processedHtml.replace(/style="([^"]*)"/gi, (match, styles) => {
    if (styles.includes('font-family')) {
      // Process each style property individually
      const cleanedStyles = styles.split(';')
        .map(style => {
          if (style.trim().startsWith('font-family:')) {
            // Extract just the primary font name (before any commas)
            const fontMatch = style.match(/font-family:\s*['"]?([^,;'"]+)/i);
            if (fontMatch && fontMatch[1]) {
              return `font-family: ${fontMatch[1].trim()}`;
            }
          }
          return style;
        })
        .join(';');
      return `style="${cleanedStyles}"`;
    }
    return match;
  });
  
  // Handle font face attributes in <font> tags
  processedHtml = processedHtml.replace(/face\s*=\s*["']([^,"']+)([^"']*)["']/gi, (match, primaryFont, fallbacks) => {
    console.log(`Replacing font face: "${match}" with "face="${primaryFont.trim()}""`);
    return `face="${primaryFont.trim()}"`;
  });
  
  // Additional check for any remaining font specifications with commas
  processedHtml = processedHtml.replace(/(font|face)\s*=\s*["']([^"']+),\s*([^"']+)["']/gi, (match, attr, firstPart, rest) => {
    console.log(`Cleaning remaining font: "${match}" to ${attr}="${firstPart}"`);
    return `${attr}="${firstPart}"`;
  });

  // Make sure we have a complete HTML document with minimal styles
  // Using a simpler HTML structure that LibreOffice can process more reliably
//   const completeHtml = `<!DOCTYPE html>
// <html>
// <head>
// <meta charset="UTF-8">
// <title>Edited Document</title>
// <style>
// body { font-family: Arial; margin: 1in; }
// p { margin: 0.5em 0; }
// </style>
// </head>
// <body>
// ${processedHtml}
// </body>
// </html>`;
  const headContent = processedHtml.match(/<meta[^>]*>|<title[^>]*>.*?<\/title>|<style[^>]*>.*?<\/style>/gi)?.join('\n') || '';
  const bodyContent = processedHtml.replace(/<meta[^>]*>|<title[^>]*>.*?<\/title>|<style[^>]*>.*?<\/style>/gi, '').trim();

  const completeHtml = `<!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8">
  ${headContent}
  </head>
  <body>
  ${bodyContent}
  </body>
  </html>`;

  // Write the HTML file first
  fs.writeFileSync(htmlFilePath, completeHtml);
  
  // Also save the raw HTML for debugging
  fs.writeFileSync(path.join(outputDir, `${timestamp}_raw.html`), rawHtml);
//  fs.writeFileSync(path.join(outputDir, `${timestamp}_processed.html`), processedHtml);
  
  console.log(`HTML file saved at: ${htmlFilePath}`);

  // Use LibreOffice to convert the HTML to DOCX
  console.log(`Running LibreOffice conversion...`);
  console.log(`Command: soffice --headless --infilter="HTML (StarWriter)" --convert-to docx:"Office Open XML Text" --outdir ${outputDir} ${htmlFilePath}`);
  
  exec(`soffice --headless --infilter="HTML (StarWriter)" --convert-to docx:"Office Open XML Text" --outdir ${outputDir} ${htmlFilePath}`, (err, stdout, stderr) => {
    // Always log stdout and stderr regardless of error
    console.log('LibreOffice stdout:', stdout || '(empty)');
    console.log('LibreOffice stderr:', stderr || '(empty)');
    
    if (err) {
      console.error('DOCX conversion error:', err);
      return res.status(500).send('DOCX conversion failed.');
    }
    
    // LibreOffice will create a file with the same name but .docx extension
    const expectedDocxFilename = htmlFilename.replace('.htm', '.docx');
    const docxOutputPath = path.join(outputDir, expectedDocxFilename);
    
    console.log(`Checking for DOCX file at: ${docxOutputPath}`);
    
    // List all files in the output directory to see what was created
    const filesInOutput = fs.readdirSync(outputDir);
    console.log('Files in output directory after conversion:', filesInOutput);
    
    if (fs.existsSync(docxOutputPath)) {
      console.log(`Found DOCX file at: ${docxOutputPath}`);
      
      // Send response with path to download
      res.json({ 
        downloadUrl: `/output/${expectedDocxFilename}`,
        success: true,
        message: `DOCX file created at ${docxOutputPath}. You can find it on the server.`
      });
    } else {
      // See if we can find any DOCX files in the output directory that were just created
      const recentDocxFiles = filesInOutput.filter(file => 
        file.endsWith('.docx') && 
        file.startsWith('edited_') &&
        fs.statSync(path.join(outputDir, file)).mtime.getTime() > timestamp - 5000
      );
      
      if (recentDocxFiles.length > 0) {
        console.log(`Found recent DOCX file: ${recentDocxFiles[0]}`);
        res.json({
          downloadUrl: `/output/${recentDocxFiles[0]}`,
          success: true,
          message: `DOCX file created with name ${recentDocxFiles[0]}. You can find it on the server.`
        });
      } else {
        console.error('No DOCX file was created by LibreOffice.');
        res.status(500).json({
          success: false,
          message: 'DOCX file creation failed, but HTML was saved to the server.'
        });
      }
    }
  });
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
