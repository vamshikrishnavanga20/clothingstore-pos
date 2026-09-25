import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const mediaBucket =
  process.env.AWS_S3_MEDIA_BUCKET ||
  process.env.AWS_S3_BUCKET_NAME ||
  'roman-island-media-assets';
const backupBucket = process.env.AWS_S3_BACKUP_BUCKET || 'roman-island-db-backups';
const region =
  process.env.DYNAMODB_AWS_REGION ||
  process.env.CUSTOM_AWS_REGION ||
  (process.env.AWS_REGION && !process.env.AWS_REGION.startsWith('us-')
    ? process.env.AWS_REGION
    : 'ap-south-2');
const accessKeyId =
  process.env.AWS_ACCESS_KEY_ID ||
  process.env.APP_AWS_ACCESS_KEY_ID ||
  '';
const secretAccessKey =
  process.env.AWS_SECRET_ACCESS_KEY ||
  process.env.APP_AWS_SECRET_ACCESS_KEY ||
  '';
const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN || '';

export const isAwsConfigured = Boolean(accessKeyId && secretAccessKey);

let s3Client: S3Client | null = null;
if (isAwsConfigured) {
  try {
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize S3Client:', err);
  }
}

/**
 * Upload clothing product images to AWS S3 Media Bucket
 * CloudFront edge distribution is automatically used when CLOUDFRONT_DOMAIN is set.
 */
export async function uploadImageToStorage(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<{ url: string; provider: 'aws-s3' | 'local' }> {
  const extension = path.extname(originalFilename) || '.jpg';
  const uniqueName = `cloth-${Date.now()}-${Math.random().toString(36).substring(2, 9)}${extension}`;

  if (isAwsConfigured && s3Client && mediaBucket) {
    try {
      const command = new PutObjectCommand({
        Bucket: mediaBucket,
        Key: `products/${uniqueName}`,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await s3Client.send(command);

      // If CloudFront CDN is configured, deliver through edge CDN; otherwise direct S3 URL
      const url = cloudfrontDomain
        ? `https://${cloudfrontDomain}/products/${uniqueName}`
        : `https://${mediaBucket}.s3.${region}.amazonaws.com/products/${uniqueName}`;

      return { url, provider: 'aws-s3' };
    } catch (error) {
      console.warn('AWS S3 upload failed, falling back to local/inline storage:', error);
    }
  }

  // 1. Try local filesystem if writable (development environment)
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, fileBuffer);
    return {
      url: `/uploads/${uniqueName}`,
      provider: 'local',
    };
  } catch (fsErr) {
    // 2. Resilient fallback for serverless read-only filesystems (Vercel)
    // Convert to standard base64 data URI so uploads NEVER fail
    const dataUri = `data:${mimeType || 'image/jpeg'};base64,${fileBuffer.toString('base64')}`;
    return {
      url: dataUri,
      provider: 'local',
    };
  }
}

/**
 * Upload weekly database backup snapshots (Customer Bills & Analytics Reports)
 * to dedicated S3 Backup Bucket.
 */
export async function uploadBackupToStorage(
  dataContent: string | Buffer,
  fileName: string,
  subFolder: string = 'weekly-backups'
): Promise<{ success: boolean; location: string; provider: 'aws-s3' | 'local' }> {
  const key = `${subFolder}/${fileName}`;

  if (isAwsConfigured && s3Client && backupBucket) {
    try {
      const command = new PutObjectCommand({
        Bucket: backupBucket,
        Key: key,
        Body: dataContent,
        ContentType: 'application/json',
      });

      await s3Client.send(command);
      return {
        success: true,
        location: `s3://${backupBucket}/${key}`,
        provider: 'aws-s3',
      };
    } catch (error) {
      console.warn('AWS S3 backup upload failed, saving to local backup dir:', error);
    }
  }

  // Fallback to local data/backups directory
  const backupsDir = path.join(process.cwd(), 'data', 'backups', subFolder);
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const filePath = path.join(backupsDir, fileName);
  fs.writeFileSync(filePath, dataContent, 'utf-8');

  return {
    success: true,
    location: filePath,
    provider: 'local',
  };
}
