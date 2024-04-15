# AWS File Upload

This is a simple Node.js application that enables users to upload files directly to an AWS S3 bucket using pre-signed URLs.

## Requirements

- Node.js
- npm (Node Package Manager)
- An AWS account with access to S3
- `ngrok` (optional, for exposing your local server to the internet)

## Local Setup

1. Clone the repository to your local machine.

2. Navigate to the repository directory in your terminal.

3. Install the necessary dependencies by running:

   ```bash
   npm install
   ```

4. Create a `.env` file in the root of the project with the following contents, substituting your own AWS credentials and bucket name:

   ```plaintext
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_REGION=your_region
   S3_BUCKET_NAME=your_bucket_name
   ```

5. Start the server by running:

   ```bash
   npm start
   ```

   Your server will start on `http://localhost:5500`.

## Exposing Your Local Server with Ngrok

To make your local server accessible over the internet, use `ngrok`:

1. If you haven't already, signup, download and install `ngrok` from the [ngrok website](https://dashboard.ngrok.com/).

2. In a new terminal window, start `ngrok` on the same port as your Node.js application:

   ```bash
   npm run live
   ```

3. `ngrok` will provide a public URL (e.g., `https://abc123.ngrok.io`) which you can use to access your server from anywhere.

## Usage

Open a web browser and navigate to `http://localhost:5500` or the URL provided by `ngrok` to access the file upload interface.

---

**Note**: Always keep your `.env` file secure. Do not commit it to public version control repositories as it contains sensitive AWS credentials.
