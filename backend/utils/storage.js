const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

/**
 * Where uploaded files live.
 *
 * The hosting container has a temporary disk: everything written to it is
 * gone on the next restart, which is no good for a report's evidence or a
 * doctor's licence. So files go to Cloudinary when it is configured, and to
 * the local disk otherwise, which keeps development working with no account.
 *
 * Public files, meaning profile photos, are stored openly and the URL is kept.
 * Everything else is stored as an authenticated asset, which cannot be fetched
 * from Cloudinary without a signature, and is only ever served through the
 * routes in this project that check who is asking.
 */

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;

const remote = Boolean(CLOUD && KEY && SECRET);
if (remote) {
  cloudinary.config({ cloud_name: CLOUD, api_key: KEY, api_secret: SECRET, secure: true });
}

const ROOT = path.join(__dirname, '../../uploads');
const PREFIX = 'cloudinary:';

const localDir = (folder) => {
  const dir = path.join(ROOT, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

/**
 * The upload itself. The file arrives in memory, so it is sent as a stream
 * rather than from a path on disk.
 */
const sendToCloud = (file, options) => new Promise((resolve, reject) => {
  const upload = cloudinary.uploader.upload_stream(options, (error, result) => {
    if (error) reject(error);
    else resolve(result);
  });
  upload.end(file.data);
});

/** A profile photo, which is meant to be seen by anyone who sees the person. */
const savePublic = async (file, folder, name) => {
  if (remote) {
    const result = await sendToCloud(file, {
      folder: `beral-care/${folder}`,
      public_id: name,
      overwrite: true,
      resource_type: 'image',
    });
    return { url: result.secure_url, reference: `${PREFIX}image:${result.public_id}` };
  }

  const stored = `${name}${path.extname(file.name).toLowerCase().slice(0, 6)}`;
  await file.mv(path.join(localDir(folder), stored));
  return { url: `/uploads/${folder}/${stored}`, reference: stored };
};

/** Evidence, a rating attachment, a licence: never served straight from a URL. */
const savePrivate = async (file, folder, name) => {
  if (remote) {
    const result = await sendToCloud(file, {
      folder: `beral-care/${folder}`,
      public_id: name,
      overwrite: true,
      resource_type: 'auto',
      type: 'authenticated',
    });
    return `${PREFIX}${result.resource_type}:${result.public_id}`;
  }

  const stored = `${name}${path.extname(file.name).toLowerCase().slice(0, 6)}`;
  await file.mv(path.join(localDir(folder), stored));
  return stored;
};

const isRemote = (reference) => typeof reference === 'string' && reference.startsWith(PREFIX);

/**
 * Reads a stored file back. Returns a Buffer, or null when the file is gone,
 * so a caller can answer with a plain "no longer available".
 */
const read = async (reference, folder) => {
  if (!reference) return null;

  if (isRemote(reference)) {
    const [, resourceType, ...rest] = reference.split(':');
    const publicId = rest.join(':');
    // An authenticated asset needs a signed address, which is built here and
    // used once. It never leaves the server.
    const url = cloudinary.url(publicId, {
      resource_type: resourceType, type: 'authenticated', sign_url: true, secure: true,
    });
    const response = await fetch(url);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  }

  const filepath = path.join(ROOT, folder, path.basename(reference));
  if (!fs.existsSync(filepath)) return null;
  return fs.promises.readFile(filepath);
};

const remove = async (reference, folder) => {
  if (!reference) return;
  try {
    if (isRemote(reference)) {
      const [, resourceType, ...rest] = reference.split(':');
      await cloudinary.uploader.destroy(rest.join(':'), {
        resource_type: resourceType,
        type: folder === 'profiles' ? 'upload' : 'authenticated',
      });
      return;
    }
    const filepath = path.join(ROOT, folder, path.basename(reference));
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch (error) {
    console.error('Could not remove a stored file:', error.message);
  }
};

module.exports = { savePublic, savePrivate, read, remove, isRemote, usingCloud: remote };
