const logger = (proto, args) => {
    console.log(`[${proto}]\t${args}`)
}

const splash = () => {
    console.log("-------------------------------------------------")
    console.log("yt-dlp-webUI - A web-ui for yt-dlp, simply enough")
    console.log("-------------------------------------------------")
}

module.exports = {
    logger: logger,
    splash: splash,
}