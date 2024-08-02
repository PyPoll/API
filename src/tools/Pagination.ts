import type { Request } from "express";

export interface PaginationInfos {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export function getPrismaPagination(infos: PaginationInfos) {
    return {
        skip: infos.limit * (infos.page - 1),
        take: infos.limit
    }
}

export function getRequestPagination(req: Request): PaginationInfos {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    return {
        page,
        limit,
        total: 0,
        pages: 0
    };
}

export function getDefaultPagination(): PaginationInfos {
    return {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    };
}

export async function getPaginationResult(infos: PaginationInfos, getTotal: (() => Promise<number>|number)) {
    const total = typeof(getTotal) === 'number' ? getTotal : await getTotal();
    infos.total = total;
    infos.pages = Math.ceil(total / infos.limit);
    return infos;
}
