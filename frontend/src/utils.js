export function validateIP(ipAddr) {
    let ipRegex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/gm
    return ipRegex.test(ipAddr)
}

export function validateDomain(domainName) {
    let domainRegex = /[^@ \t\r\n]+.[^@ \t\r\n]+\.[^@ \t\r\n]+/
    return domainRegex.test(domainName) || domainName === 'localhost'
}