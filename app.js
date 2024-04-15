require('dotenv').config();
const express = require('express');
const AWS = require('aws-sdk');
const app = express();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});
const s3 = new AWS.S3();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Upload to Bucket</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        #upload-container {
          background-color: white;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        input[type="file"] {
          margin-bottom: 10px;
        }
        button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        }
        button:hover {
          background-color: #0056b3;
        }
      </style>
    </head>
    <body>
      <div id="upload-container">
        <h2>Upload File</h2>
        <input id="fileUpload" type="file">
        <button onclick="uploadFile()">Upload</button>
      </div>

      <script>
        async function uploadFile() {
          const file = document.getElementById('fileUpload').files[0];
          const response = await fetch(\`/generate-presigned-url?filename=\${encodeURIComponent(file.name)}&filetype=\${encodeURIComponent(file.type)}\`);
          const data = await response.json();
          const url = data.url;

          const result = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type
            }
          });

          if (result.ok) {
            console.log('File uploaded successfully.');
            alert('Done, thanks, you can close this page now');
          } else {
            console.error('Failed to upload.');
            alert('Failed to upload.');
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.get('/generate-presigned-url', async (req, res) => {
  const { filename, filetype } = req.query;
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `raw_uploads/${filename}`,
    Expires: 60,
    ContentType: filetype
  };

  try {
    const preSignedUrl = s3.getSignedUrl('putObject', params);
    res.status(200).json({ url: preSignedUrl });
  } catch (err) {
    res.status(500).json({ error: "Unable to create URL" });
  }
});

const port = 5500;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
