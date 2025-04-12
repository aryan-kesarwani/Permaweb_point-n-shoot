import express from 'express';
import { TurboFactory } from '@ardrive/turbo-sdk/node';
import { readFileSync, statSync, createReadStream, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import path from 'path';

const app = express();
const port = 3000;

// Initialize Turbo client
const jwk = JSON.parse(readFileSync('wallet.json'));
const publicId = jwk.n; // Extract public ID
const turboAuthClient = TurboFactory.authenticated({ privateKey: jwk });

// Create uploads directory
const uploadDir = path.join(process.cwd(), 'uploads');
mkdirSync(uploadDir, { recursive: true });

// Enhanced raw body handling
app.post('/upload', express.raw({
  type: 'image/jpeg',
  limit: '5mb',
  verify: (req, res, buf) => {
    if (!buf.length) throw new Error("Empty image data");
    req.rawBody = buf;
  }
}), async (req, res) => {
  let filePath;
  try {
    if (!req.rawBody || req.rawBody.length === 0) {
      return res.status(400).json({ error: "Empty image data" });
    }

    const filename = `esp32cam-${Date.now()}.jpg`;
    filePath = path.join(uploadDir, filename);
    
    // Write received buffer to file
    writeFileSync(filePath, req.rawBody);

    // Upload to Arweave
    const uploadResult = await turboAuthClient.uploadFile({
      fileStreamFactory: () => createReadStream(filePath),
      fileSizeFactory: () => statSync(filePath).size,
      dataItemOpts: {
        tags: [
          { name: 'Content-Type', value: 'image/jpeg' },
          { name: 'Device', value: 'Buildathon-ESP32-CAM_v3' },
          { name: 'Public-Id', value: publicId } // Added public ID tag
        ]
      },
      signal: AbortSignal.timeout(10000) // cancel the upload after 10 seconds
    });
    console.log(JSON.stringify(uploadResult, null, 2));
    // Cleanup
    unlinkSync(filePath);

    res.json({
      success: true,
      arweaveId: uploadResult.id,
      url: `https://arweave.net/${uploadResult.id}`
    });

  } catch (error) {
    if (filePath) try { unlinkSync(filePath); } catch {}
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
