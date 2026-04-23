import { open, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { type NextRequest } from 'next/server';

export const runtime = 'nodejs';

const VIDEO_FILE_PATH = path.join(process.cwd(), 'glcapital.mp4');
const VIDEO_CONTENT_TYPE = 'video/mp4';

const parseRange = (rangeHeader: string, size: number) => {
  const [startPart, endPart] = rangeHeader.replace('bytes=', '').split('-');
  const start = Number.parseInt(startPart, 10);
  const parsedEnd = Number.parseInt(endPart, 10);

  if (Number.isNaN(start) || start < 0 || start >= size) {
    return null;
  }

  const end = Number.isNaN(parsedEnd) ? size - 1 : Math.min(parsedEnd, size - 1);
  if (end < start) {
    return null;
  }

  return { start, end };
};

export async function GET(request: NextRequest) {
  try {
    const fileStats = await stat(VIDEO_FILE_PATH);
    const totalSize = fileStats.size;
    const rangeHeader = request.headers.get('range');

    if (rangeHeader) {
      const range = parseRange(rangeHeader, totalSize);
      if (!range) {
        return new Response(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${totalSize}`,
            'Accept-Ranges': 'bytes',
          },
        });
      }

      const chunkSize = range.end - range.start + 1;
      const fileHandle = await open(VIDEO_FILE_PATH, 'r');
      const buffer = Buffer.alloc(chunkSize);
      await fileHandle.read(buffer, 0, chunkSize, range.start);
      await fileHandle.close();

      return new Response(buffer, {
        status: 206,
        headers: {
          'Content-Type': VIDEO_CONTENT_TYPE,
          'Content-Length': String(chunkSize),
          'Content-Range': `bytes ${range.start}-${range.end}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const fullVideo = await readFile(VIDEO_FILE_PATH);
    return new Response(fullVideo, {
      status: 200,
      headers: {
        'Content-Type': VIDEO_CONTENT_TYPE,
        'Content-Length': String(totalSize),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Video not found', { status: 404 });
  }
}
