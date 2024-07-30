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

app.get('/', async (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Upload to Bucket</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
          width: 300px;
          text-align: center;
        }
        input[type="file"] {
          margin-bottom: 10px;
          width: 100%;
        }
        button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          width: 100%;
        }
        button:hover {
          background-color: #0056b3;
        }
        #progressBarContainer {
          width: 100%;
          background-color: #ddd;
          display: none;
          border-radius: 5px;
          margin-top: 10px;
        }
        #progressBar {
          width: 0%;
          height: 20px;
          background-color: #4CAF50;
          text-align: center;
          line-height: 20px;
          color: white;
          transition: width 0.4s ease-in-out;
        }
        #errorMessage {
          color: red;
          display: none;
          margin-top: 10px;
        }
        select {
          margin-bottom: 10px;
          width: 100%;
          padding: 5px;
          border-radius: 5px;
          border: 1px solid #ccc;
        }
      </style>
    </head>
    <body>
      <div id="upload-container">
        <h2>Upload File</h2>
        <select id="categorySelect" onclick="loadCategories()">
          <option value="">Select a category</option>
        </select>
        <input id="fileUpload" type="file">
        <button onclick="uploadFile()">Upload</button>
        <div id="progressBarContainer">
          <div id="progressBar"></div>
        </div>
        <div id="errorMessage"></div>
      </div>

      <script>
        let categories = [];

        async function loadCategories() {
          if (categories.length > 0) return;

          try {
            const response = await fetch('/fetch-categories');
            const data = await response.json();
            categories = data.categories;

            const categorySelect = document.getElementById('categorySelect');
            categories.forEach(category => {
              const option = document.createElement('option');
              option.value = category;
              option.textContent = category;
              categorySelect.appendChild(option);
            });
          } catch (error) {
            console.error('Error loading categories:', error);
          }
        }

        async function uploadFile() {
          const file = document.getElementById('fileUpload').files[0];
          const category = document.getElementById('categorySelect').value;
          if (!file) {
            alert('Please select a file to upload.');
            return;
          }
          if (!category) {
            alert('Please select a category.');
            return;
          }

          document.getElementById('progressBarContainer').style.display = 'block';
          document.getElementById('progressBar').style.width = '0%';
          document.getElementById('progressBar').textContent = '0%';
          document.getElementById('errorMessage').style.display = 'none';

          try {
            const response = await fetch(\`/generate-presigned-url?filename=\${encodeURIComponent(file.name)}&filetype=\${encodeURIComponent(file.type)}&category=\${encodeURIComponent(category)}\`);
            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'Failed to get the pre-signed URL.');
            }

            const xhr = new XMLHttpRequest();
            xhr.open('PUT', data.url, true);
            xhr.upload.onprogress = function(e) {
              if (e.lengthComputable) {
                const percentage = (e.loaded / e.total) * 100;
                document.getElementById('progressBar').style.width = percentage.toFixed(2) + '%';
                document.getElementById('progressBar').textContent = percentage.toFixed(2) + '%';
              }
            };
            xhr.upload.onloadstart = function(e) {
              document.getElementById('progressBarContainer').style.display = 'block';
              document.getElementById('progressBar').style.width = '0%';
              document.getElementById('progressBar').textContent = '0%';
            };
            xhr.upload.onloadend = function(e) {
              document.getElementById('progressBar').style.width = '100%';
              document.getElementById('progressBar').textContent = 'Upload complete';
            };
            xhr.onreadystatechange = function() {
              if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                  alert('File uploaded successfully.');
                } else {
                  throw new Error('Upload failed with status: ' + xhr.status);
                }
              }
            };
            xhr.onerror = function() {
              throw new Error('Upload error.');
            };
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
          } catch (error) {
            document.getElementById('errorMessage').textContent = error.message;
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('progressBarContainer').style.display = 'none';
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.get('/fetch-categories', async (req, res) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Delimiter: '/'
    };

    const data = await s3.listObjectsV2(params).promise();
    console.log(data)
    const categories = data.CommonPrefixes.map(prefix => prefix.Prefix.split('/').slice(-2, -1)[0])
                                          .filter(category => category !== 'raw_uploads');

    res.status(200).json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching categories.' });
  }
});

app.get('/generate-presigned-url', async (req, res) => {
  const { filename, filetype, category } = req.query;
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${category}/${filename}`,
    Expires: 300,
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
