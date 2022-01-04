export function validateIP(ipAddr: string): boolean {
    let ipRegex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/gm
    return ipRegex.test(ipAddr)
}

export function validateDomain(domainName: string): boolean {
    let domainRegex = /[^@ \t\r\n]+.[^@ \t\r\n]+\.[^@ \t\r\n]+/
    return domainRegex.test(domainName) || domainName === 'localhost'
}

export function ellipsis(str: string, lim: number): string {
    if (str) {
        return str.length > lim ? `${str.substr(0, lim)}...` : str
    }
    return ''
}

export function detectSpeed(str: string): number {
    let effective = str.match(/[\d,]+(\.\d+)?/)[0]
    const unit = str.replace(effective, '')
    switch (unit) {
        case 'MiB/s':
            return Number(effective) * 1000
        case 'KiB/s':
            return Number(effective)
        default:
            return 0
    }
}