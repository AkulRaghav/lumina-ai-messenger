import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class MediaService {
  private s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    },
  });

  async uploadImage(file: Buffer, mimeType: string): Promise<string> {
    const ext = mimeType.split('/')[1] || 'bin';
    const key = `uploads/${randomUUID()}.${ext}`;
    const bucket = process.env.AWS_S3_BUCKET || 'lumina-bucket';

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: mimeType,
      }),
    );

    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }
}
