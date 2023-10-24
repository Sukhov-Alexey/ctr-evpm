export class SystemMessage extends Error {
    code: number = 500;
}

export class RequestError extends SystemMessage {
    code: number = 400;
}