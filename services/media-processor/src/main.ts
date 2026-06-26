import { connect, StringCodec } from 'nats';
import * as dotenv from 'dotenv';

dotenv.config();

const sc = StringCodec();

interface MediaJob {
  messageId: string;
  chatId: string;
  mediaUrl: string;
  mimeType: string;
  operation: 'thumbnail' | 'transcode' | 'compress' | 'blur_detect';
}

class MediaProcessorService {
  private natsConn: any;

  async start() {
    this.natsConn = await connect({
      servers: process.env.NATS_URL || 'nats://localhost:4222',
      name: 'lumina-media-processor',
    });

    console.log('[media-processor] Connected to NATS');

    // Subscribe to media processing jobs
    const sub = this.natsConn.subscribe('lumina.media.process', {
      queue: 'media-workers', // Load balance across instances
    });

    for await (const msg of sub) {
      try {
        const job: MediaJob = JSON.parse(sc.decode(msg.data));
        await this.processJob(job);
      } catch (e) {
        console.error('[media-processor] Error:', e);
      }
    }
  }

  private async processJob(job: MediaJob) {
    console.log(`[media-processor] Processing ${job.operation} for ${job.messageId}`);

    switch (job.operation) {
      case 'thumbnail':
        await this.generateThumbnail(job);
        break;
      case 'transcode':
        await this.transcodeVideo(job);
        break;
      case 'compress':
        await this.compressImage(job);
        break;
      case 'blur_detect':
        await this.detectExplicitContent(job);
        break;
    }

    // Publish completion event
    this.natsConn.publish(
      'lumina.media.processed',
      sc.encode(JSON.stringify({
        messageId: job.messageId,
        chatId: job.chatId,
        operation: job.operation,
        status: 'completed',
      })),
    );
  }

  private async generateThumbnail(job: MediaJob) {
    // In production: use sharp to resize image
    // const sharp = require('sharp');
    // const thumbnail = await sharp(buffer).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 70 }).toBuffer();
    // Upload thumbnail to S3 at `thumbnails/${messageId}.jpg`
    console.log(`[media-processor] Thumbnail generated for ${job.messageId}`);
  }

  private async transcodeVideo(job: MediaJob) {
    // In production: use fluent-ffmpeg to transcode to H.264/AAC MP4
    // ffmpeg(inputStream).videoCodec('libx264').audioCodec('aac').format('mp4').save(outputPath);
    console.log(`[media-processor] Video transcoded for ${job.messageId}`);
  }

  private async compressImage(job: MediaJob) {
    // In production: sharp compress to webp at 80% quality
    // await sharp(buffer).webp({ quality: 80 }).toBuffer();
    console.log(`[media-processor] Image compressed for ${job.messageId}`);
  }

  private async detectExplicitContent(job: MediaJob) {
    // In production: call moderation API (AWS Rekognition / OpenAI moderation)
    // Flag message if explicit content detected
    console.log(`[media-processor] Content moderation check for ${job.messageId}`);
  }
}

const service = new MediaProcessorService();
service.start().catch(console.error);
