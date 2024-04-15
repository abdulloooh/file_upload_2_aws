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
        #progressBarContainer {
          width: 100%;
          background-color: #ddd;
          display: none; /* Hide the progress bar container initially */
        }
        #progressBar {
          width: 0%;
          height: 30px;
          background-color: #4CAF50;
          text-align: center;
          line-height: 30px;
          color: white;
        }
        #errorMessage {
          color: red;
          display: none; /* Hide the error message initially */
        }
      </style>
    </head>
    <body>
      <div id="upload-container">
        <h2>Upload File</h2>
        <input id="fileUpload" type="file">
        <button onclick="uploadFile()">Upload</button>
        <div id="progressBarContainer">
          <div id="progressBar">0%</div>
        </div>
        <div id="errorMessage"></div> <!-- Error message container -->
      </div>

      <script>
        async function uploadFile() {
          const file = document.getElementById('fileUpload').files[0];
          document.getElementById('progressBarContainer').style.display = 'block'; // Show the progress bar
          document.getElementById('progressBar').style.width = '0%'; // Reset progress bar width
          document.getElementById('progressBar').innerText = '0%'; // Reset progress bar text
          document.getElementById('errorMessage').style.display = 'none'; // Hide error message

          try {
            const response = await fetch(\`/generate-presigned-url?filename=\${encodeURIComponent(file.name)}&filetype=\${encodeURIComponent(file.type)}\`);
            const data = await response.json();
            if (response.ok) {
              const url = data.url;

              const xhr = new XMLHttpRequest();
              xhr.open('PUT', url, true);
              xhr.upload.onprogress = function(e) {
                if (e.lengthComputable) {
                  const percentage = (e.loaded / e.total) * 100;
                  document.getElementById('progressBar').style.width = percentage.toFixed(2) + '%';
                  document.getElementById('progressBar').innerText = percentage.toFixed(2) + '%';
                }
              };
              xhr.onload = function() {
                if (xhr.status === 200) {
                  console.log('File uploaded successfully.');
                  alert('Done, thanks, you can close this page now');
                } else {
                  throw new Error('Upload failed with status: ' + xhr.status);
                }
              };
              xhr.onerror = function() {
                throw new Error('Upload error');
              };
              xhr.setRequestHeader('Content-Type', file.type);
              xhr.send(file);
            } else {
              throw new Error(data.error || 'Failed to get the pre-signed URL.');
            }
          } catch (error) {
            console.error(error);
            document.getElementById('errorMessage').innerText = error.message;
            document.getElementById('errorMessage').style.display = 'block'; // Show error message
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
