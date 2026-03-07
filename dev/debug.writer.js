

class DebugBinaryWriter {

    constructor(capacity = 0) {
        this.encoder = new TextEncoder();
        this.id = this.int8
        this.offset = 0
        this.config = bino_config()
        this.index = -1
        this.lines = []
        this.line = []
        this.comments = []
    }

    entry() {
        if (this.index >= 0) {
            const lower = this.line[0].toLowerCase()
            if (lower == 'n') this.comments.push(`class ${this.line[1].substr(1, this.line[1].length - 2)}`)
            if (this.line.length > 30) {
                this.comments.push(`${this.line.length - 30} more`)
                this.line = this.line.slice(0, 30)
            }
            this.lines.push(
                `${this.index.toString().padStart(4, " ")}: ${this.line.join(" ")}` +
                (this.comments.length ? ` // ${this.comments.join("")}` : "")
            )
        }
        this.index += 1
        this.line.length = 0
        this.comments.length = 0
    }

    inc(size) { this.offset += size }

    byte(value) { this.inc(1); this.line.push(value) }
    char(value) { this.inc(1); this.line.push(value); return this }

    int8(value) { this.inc(1); this.line.push(value) }
    int16(value) { this.inc(2); this.line.push(value) }
    int32(value) { this.inc(4); this.line.push(value) }
    float64(value) { this.inc(8); this.line.push(value) }

    len(size, type1, type2) {
        this.line.push(size < 256 ? type1 : type2)
        this.line.push(`[${size}]`)
        return this
    }

    string(str, type1 = 's', type2 = 'S') {
        const encoded = this.encoder.encode(str);
        this.line.push(encoded.byteLength < 256 ? type1 : type2)
        this.line.push(JSON.stringify(str))
    }
    bytes(array, type1 = 'u', type2 = 'U') {
        this.len(array.byteLength, type1, type2);
        this.line.push(`(binary)`)
    }

    output(length) {
        this.line.pop()
        this.entry()
        return this.lines.join("\n")
    }
}