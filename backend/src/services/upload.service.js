/**
 * ECHO ROUTE SMART WASTE
 * Waste Photo Upload & Storage Service
 */
const fs = require('node:fs');
const path = require('node:path');
const { ApiError } = require('../middleware/error.middleware');

const CITIZEN_UPLOADS_DIR = path.resolve(__dirname, '../../uploads/pickup_photos');
if (!fs.existsSync(CITIZEN_UPLOADS_DIR)) {
  fs.mkdirSync(CITIZEN_UPLOADS_DIR, { recursive: true });
}

const PROOF_UPLOADS_DIR = path.resolve(__dirname, '../../uploads/completion_proofs');
if (!fs.existsSync(PROOF_UPLOADS_DIR)) {
  fs.mkdirSync(PROOF_UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const parseAndValidateBase64 = (base64Data) => {
  if (!base64Data) return null;

  let mimeType = 'image/jpeg';
  let rawBase64 = base64Data;

  if (base64Data.startsWith('data:')) {
    const parts = base64Data.split(';base64,');
    if (parts.length === 2) {
      mimeType = parts[0].replace('data:', '').toLowerCase();
      rawBase64 = parts[1];
    }
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw ApiError.badRequest(
      `Unsupported photo format: ${mimeType}. Please upload a JPG, PNG, or WebP image.`
    );
  }

  const buffer = Buffer.from(rawBase64, 'base64');
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw ApiError.badRequest('Photo size exceeds 5MB limit. Please upload a smaller photo.');
  }

  let ext = '.jpg';
  if (mimeType === 'image/png') ext = '.png';
  else if (mimeType === 'image/webp') ext = '.webp';

  return { buffer, ext };
};

const UploadService = {
  // Citizen waste photo upload
  saveBase64Photo: (base64Data, filename = 'waste_photo.jpg') => {
    const parsed = parseAndValidateBase64(base64Data);
    if (!parsed) return null;

    const cleanFilename = `waste_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}${parsed.ext}`;
    const destinationPath = path.join(CITIZEN_UPLOADS_DIR, cleanFilename);

    fs.writeFileSync(destinationPath, parsed.buffer);
    return `/uploads/pickup_photos/${cleanFilename}`;
  },

  // Driver completion proof photo upload
  saveCompletionProof: (base64Data, filename = 'proof_photo.jpg') => {
    const parsed = parseAndValidateBase64(base64Data);
    if (!parsed) {
      throw ApiError.badRequest('Completion proof photo is required.');
    }

    const cleanFilename = `proof_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}${parsed.ext}`;
    const destinationPath = path.join(PROOF_UPLOADS_DIR, cleanFilename);

    fs.writeFileSync(destinationPath, parsed.buffer);
    return `/uploads/completion_proofs/${cleanFilename}`;
  }
};

module.exports = UploadService;
