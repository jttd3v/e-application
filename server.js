const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the static HTML file
app.use(express.static(__dirname));
app.use(express.json());

const submissionsDir = path.join(__dirname, 'submissions');
if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir);
}

const futureDir = path.join(__dirname, 'future_db');
if (!fs.existsSync(futureDir)) {
  fs.mkdirSync(futureDir);
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function generatePDF(data, pdfPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    doc.fontSize(12).text(JSON.stringify(data, null, 2));
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function sendEmail(pdfPath) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    subject: 'New Form Submission',
    text: 'Please find the attached submission.',
    attachments: [
      {
        filename: path.basename(pdfPath),
        path: pdfPath
      }
    ]
  };
  return transporter.sendMail(mailOptions);
}

app.post('/submit', async (req, res) => {
  const data = req.body;
  const timestamp = Date.now();
  const fileName = `submission-${timestamp}.json`;
  const pdfName = `submission-${timestamp}.pdf`;
  const sqlName = `submission-${timestamp}.sql`;
  const filePath = path.join(submissionsDir, fileName);
  const pdfPath = path.join(submissionsDir, pdfName);
  const sqlPath = path.join(futureDir, sqlName);

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    const escaped = JSON.stringify(data).replace(/'/g, "''");
    const sql = `INSERT INTO submissions (data) VALUES ('${escaped}');\n`;
    fs.writeFileSync(sqlPath, sql);
    await generatePDF(data, pdfPath);
    await sendEmail(pdfPath);
    res.json({ success: true });
  } catch (err) {
    console.error('Error handling submission:', err);
    res.status(500).json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
