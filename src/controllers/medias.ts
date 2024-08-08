import { Media, PublicMedia } from "models/Media.ts";
import { prisma } from '../index.ts';
import { Canvas, Image } from "canvas";
import * as fs from 'fs';

async function loadCanvas(filepath: string): Promise<Canvas | null> {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, data) => {
            if (err) resolve(null);
            const img = new Image();
            img.src = data;
            img.onload = () => {
                const canvas = new Canvas(img.width, img.height);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas);
            }
        });
    });
}

async function saveCanvas(canvas: Canvas, filepath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            const out = fs.createWriteStream(filepath);
            const stream = canvas.createPNGStream();
            stream.pipe(out);
            out.on('finish', () => { resolve(true); });
        } catch (err) {
            console.error("Error saving canvas", err);
            resolve(false);
        }
    });
}

async function generatePreviewFile(media: PublicMedia) {
    const viewFilepath = Media.getViewFilepath(media);
    const previewFilepath = Media.getPreviewFilepath(media);

    const fullCanvas = await loadCanvas(viewFilepath);
    if (!fullCanvas) return false;

    const maxSize = 16;
    const divider = Math.max(fullCanvas.width, fullCanvas.height) / maxSize;
    const width = fullCanvas.width / divider;
    const height = fullCanvas.height / divider;

    const previewCanvas = new Canvas(width, height);
    const previewCtx = previewCanvas.getContext('2d');
    previewCtx.drawImage(fullCanvas, 0, 0, width, height);

    return await saveCanvas(previewCanvas, previewFilepath);
}

export async function get(id: number) {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media)
        throw Media.MESSAGES.NOT_FOUND().buildHTTPError();
    return Media.makePublic(media);
}

export async function getPreviewFilepath(id: number) {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media)
        throw Media.MESSAGES.NOT_FOUND().buildHTTPError();
    const publicMedia = Media.makePublic(media);
    const filepath = Media.getPreviewFilepath(publicMedia)

    if (!fs.existsSync(filepath)) {
        await generatePreviewFile(publicMedia);
    }

    return filepath;
}

export async function getViewFilepath(id: number) {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media)
        throw Media.MESSAGES.NOT_FOUND().buildHTTPError();
    return Media.getViewFilepath(Media.makePublic(media));
}
