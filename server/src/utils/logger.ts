/**
 * Simplest logger function, takes two argument: first one put between
 * square brackets (the protocol), the second one it's the effective message
 * @param {string} proto protocol
 * @param {string} args message
 */
export const logger = (proto: string, args: string) => {
    console.log(`[${proto}]\t${args}`)
}

/**
 * CLI splash
 */
export const splash = () => {
    console.log("-------------------------------------------------")
    console.log("yt-dlp-webUI - A web-ui for yt-dlp, simply enough")
    console.log("-------------------------------------------------")
}