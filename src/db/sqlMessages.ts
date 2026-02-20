export type PostMessage = {
    readonly id: number;
    readonly sql: string;
}

export type DbError = {
    readonly message: string;
}

type SuccessMessage = {
    readonly type: "SUCCESS";
    readonly id: number;
    readonly result: any;
}

type ErrorMessage = {
    readonly type: "ERROR";
    readonly id: number;
    readonly error: string;
}

export type Message = SuccessMessage | ErrorMessage;

export function post(id: number, sql: string): PostMessage {
    return { id, sql };
}

export function success(id: number, result: any): SuccessMessage {
    return { type: "SUCCESS", id, result };
}

export function error(id: number, error: string): ErrorMessage {
    return { type: "ERROR", id, error };
}

export function isSuccess(message: Message): message is SuccessMessage {
    return message.type === "SUCCESS";
}