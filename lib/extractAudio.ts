import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { spawn } from 'child_process'
import ffmpegPath from 'ffmpeg-static'

/**
 * Accepts any video or audio Buffer/File, returns path to a tmp .wav file.
 */
export async function toWav(inputPath: string): Promise<string> {
    const out = join(tmpdir(), `${randomUUID()}.wav`)
    await new Promise((ok, err) => {
        const p = spawn(ffmpegPath!, ['-i', inputPath, '-ac', '1', '-ar', '16000', out])
        p.stderr.on('data', () => {}) // silence
        p.on('exit', code => (code === 0 ? ok(null) : err(new Error('ffmpeg failed'))))
    })
    return out
}