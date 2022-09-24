import { readdirSync, statSync } from "fs";
import { ISettings } from "../interfaces/ISettings";

let settings: ISettings;

class Node {
    public path: string
    public children: Node[]

    constructor(path: string) {
        this.path = path
        this.children = []
    }
}

function buildTreeDFS(rootPath: string, directoryOnly: boolean) {
    const root = new Node(rootPath)
    const stack: Node[] = []
    const flattened: string[] = []

    stack.push(root)
    flattened.push(rootPath)

    while (stack.length) {
        const current = stack.pop()
        if (current) {
            const children = readdirSync(current.path)
            for (const it of children) {
                const childPath = `${current.path}/${it}`
                const childNode = new Node(childPath)

                if (directoryOnly) {
                    if (statSync(childPath).isDirectory()) {
                        current.children.push(childNode)
                        stack.push(childNode)
                        flattened.push(childNode.path)
                    }
                } else {
                    current.children.push(childNode)
                    if (statSync(childPath).isDirectory()) {
                        stack.push(childNode)
                        flattened.push(childNode.path)
                    }
                }
            }
        }
    }

    return {
        tree: root,
        flat: flattened
    }
}

try {
    settings = require('../../settings.json');
} catch (e) { }

export function directoryTree() {
    const tree = buildTreeDFS(settings.download_path || 'downloads', true)
    return tree
}