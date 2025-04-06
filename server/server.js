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

    const htmlContent = fs.readFileSync(outputPath, 'utf8');
    res.json({ html: htmlContent });
  });
});

app.post('/api/save', (req, res) => {
  const html = req.body.html;
  const htmlFilePath = path.join(__dirname, 'output', 'edited.html');
  const docxOutputPath = path.join(__dirname, 'output', 'Edited.docx');

  fs.writeFileSync(htmlFilePath, html);

  exec(`soffice --headless --convert-to docx --outdir output ${htmlFilePath}`, (err) => {
    if (err) return res.status(500).send('DOCX export failed.');
    res.json({ downloadUrl: '/output/Edited.docx' });
  });
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
