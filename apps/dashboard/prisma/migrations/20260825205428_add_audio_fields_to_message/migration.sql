-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "audio_url" TEXT,
ADD COLUMN     "media_type" TEXT DEFAULT 'text',
ADD COLUMN     "transcript" TEXT;
