export function on(eventType: string, listener: any) {
    document.addEventListener(eventType, listener)
}