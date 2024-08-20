import { prisma } from "index.ts";
import { Poll } from "models/Poll.ts";
import { User } from "models/User.ts";

// TODO : pagination
export async function searchUsers(query: string) {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { pseudo: { contains: query } },
                { email: { contains: query } }
            ]
        },
        take: 10,
        include: User.publicIncludes
    });

    return users.map(u => User.makePublic(u));
}

// TODO : pagination
export async function searchPolls(query: string) {
    const polls = await prisma.poll.findMany({
        where: {
            OR: [
                { title: { contains: query } },
                { description: { contains: query } }
            ]
        },
        take: 10,
        include: Poll.publicIncludes
    });

    return polls.map(p => Poll.makePublic(p));
}
