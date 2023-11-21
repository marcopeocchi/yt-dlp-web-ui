export class CliArguments {
  private _extractAudio: boolean
  private _noMTime: boolean

  constructor(extractAudio = false, noMTime = true) {
    this._extractAudio = extractAudio
    this._noMTime = noMTime
  }

  public get extractAudio(): boolean {
    return this._extractAudio
  }

  public toggleExtractAudio() {
    this._extractAudio = !this._extractAudio
    return this
  }

  public disableExtractAudio() {
    this._extractAudio = false
    return this
  }

  public get noMTime(): boolean {
    return this._noMTime
  }

  public toggleNoMTime() {
    this._noMTime = !this._noMTime
    return this
  }

  public toString(): string {
    let args = ''

    if (this._extractAudio) {
      args += '-x '
    }

    if (this._noMTime) {
      args += '--no-mtime '
    }

    return args.trim()
  }

  private reset() {
    this._extractAudio = false
    this._noMTime = false
  }

  public fromString(str: string): CliArguments {
    this.reset()

    if (str) {
      if (str.includes('-x')) {
        this._extractAudio = true
      }

      if (str.includes('--no-mtime')) {
        this._noMTime = true
      }
    }
    return this
  }
}