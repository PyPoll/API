import { Tag } from 'models/Tag.ts';
import { prisma } from '../index.ts';

export async function search(search: string) {
    const tags = await prisma.tag.findMany({
        where: {
            name: {
                contains: search
            }
        }
    });

    if (!tags) return [];

    return tags.map(tag => Tag.makePublic(tag));
}

export async function create(name: string) {
    const sanitizedName = name.trim().toLowerCase();

    const exists = await prisma.tag.findFirst({ where: { name: sanitizedName } });
    if (exists) throw Tag.MESSAGES.ALREADY_EXISTS().buildHTTPError();

    const tag = await prisma.tag.create({
        data: {
            name: sanitizedName
        }
    });

    return Tag.makePublic(tag);
}

export async function createOrGet(name: string) {
    const tag = await prisma.tag.findUnique({ where: { name } });
    if (tag) return Tag.makePublic(tag);

    return create(name);
}

export async function get(id: number) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) throw Tag.MESSAGES.NOT_FOUND().buildHTTPError();

    return Tag.makePublic(tag);
}
