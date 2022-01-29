export class CliArguments {
    private _extractAudio: boolean;
    private _noMTime: boolean;

    constructor() {
        this._extractAudio = false;
        this._noMTime = false;
    }

    public get extractAudio(): boolean {
        return this._extractAudio;
    }

    public set extractAudio(v: boolean) {
        this._extractAudio = v;
    }

    public get noMTime(): boolean {
        return this._noMTime;
    }

    public set noMTime(v: boolean) {
        this._noMTime = v;
    }

    public toString(): string {
        let args = '';

        if (this._extractAudio) {
            args += '-x '
        }

        if (this._noMTime) {
            args += '--no-mtime '
        }

        return args.trim();
    }

    public fromString(str: string): void {
        if (str.includes('-x')) {
            this._extractAudio = true;
        }

        if (str.includes('--no-mtime')) {
            this._noMTime = true;
        }
    }
}