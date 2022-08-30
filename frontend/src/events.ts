export function on(eventType: string, listener: any) {
    document.addEventListener(eventType, listener)
}

export const serverStates = {
    PROC_DOWNLOAD: 'download',
    PROC_MERGING: 'merging',
    PROC_ABORT: 'abort',
    PROG_DONE: 'status_done',
}