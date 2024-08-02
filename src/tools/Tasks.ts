import { prisma } from "index.ts";
import { Task, TaskActioner, Timer } from "./Timer.ts";

type DelayUnit = 'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'M' | 'y';
export function delayFromNow(delay: number, unit: DelayUnit): Date {
    const date = new Date();
    switch (unit) {
        case 'ms': date.setMilliseconds(date.getMilliseconds() + delay); break;
        case 's': date.setSeconds(date.getSeconds() + delay); break;
        case 'm': date.setMinutes(date.getMinutes() + delay); break;
        case 'h': date.setHours(date.getHours() + delay); break;
        case 'd': date.setDate(date.getDate() + delay); break;
        case 'w': date.setDate(date.getDate() + (delay * 7)); break;
        case 'M': date.setMonth(date.getMonth() + delay); break;
        case 'y': date.setFullYear(date.getFullYear() + delay); break;
    }
    return date;
}

class Debug implements TaskActioner {
    public type: string = 'debug';

    constructor() {
        Timer.registerAction(this);
    }

    public createTask(message: string, date: Date|string) {
        const task = new Task(this.type, date, { message });
        return task;
    }

    public action(task: Task) {
        const data = JSON.parse(task.data);
        console.debug('Delayed debug message :', data.message);
    }
}
export const debug = new Debug();

class RmUnverifiedUser implements TaskActioner {
    public type: string = 'dbDelete';

    constructor() {
        Timer.registerAction(this);
    }

    public createTask(id: number) {
        const task = new Task(this.type, delayFromNow(24, 'h'), { id });
        return task;
    }

    public action(task: Task) {
        const data = JSON.parse(task.data);
        prisma.user.delete({ where: { id: data.id } });
    }
}
export const rmUnverifiedUser = new RmUnverifiedUser();
