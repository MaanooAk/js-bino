
const header_size = 23
const skip = -1

function base64(buffer) {
    return new Uint8Array(buffer).toBase64()
}

function check_redo(encoded, decoded) {
    return base64(encoded) === bino_encode64(decoded)
}

function check_equals(value, expected) {
    if (value === expected) return true
    if (value == expected) return true
    if (Number.isNaN(value) && Number.isNaN(expected)) return true

    if (value instanceof ArrayBuffer) return base64(value) === base64(expected)
    if (value.byteLength) return base64(value) === base64(expected)

    try {
        if (JSON.stringify(value) === JSON.stringify(expected)) return true
    } catch {
        return true
    }
    return false
}

function error(message) {
    console.error(message)
    process.exit(1)
}

function buffer_print(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const width = 16;

    for (let i = header_size; i < bytes.length; i += width) {
        const slice = bytes.slice(i, i + width);
        const hex = Array.from(slice)
            .map(b => b.toString(10).padStart(3, "0")).join(" ")
        const ascii = Array.from(slice)
            .map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : ".")).join("");
        console.log(` ${ascii.padEnd(width, " ")} ${hex}`);
    }
    console.log()
}

function test_value(value, payload = skip, condition) {
    const encoded = bino_encode(value)
    const decoded = bino_decode(encoded)
    const payload_bytes = encoded.byteLength - header_size

    // console.log(value)
    // buffer_print(encoded)
    // console.log(decoded)

    if (!check_redo(encoded, decoded)) {
        console.error("value:", value, decoded)
        return error("FAIL check redo")
    }
    if (!check_equals(decoded, value)) {
        console.error("value:", value, decoded)
        return error("FAIL check equals")
    }
    if (payload != skip && payload_bytes != payload) {
        console.error("value:", value, payload_bytes, payload - payload_bytes)
        return error("FAIL check length")
    }
    if (condition && condition(decoded) !== true) {
        console.error("value:", value, "decoded:", decoded)
        return error("FAIL check condition")
    }
}

function debug_value(value, expected) {
    const config = bino_config()
    const writer = config.BinaryWriter
    config.BinaryWriter = DebugBinaryWriter
    const layout = bino_encode(value)
    config.BinaryWriter = writer

    if (!expected) {
        console.log()
        console.log(layout)

    } else if (layout.trim() !== expected.trim()) {
        console.error("layout:\n  ", layout.trim())
        console.error("expected:\n  ", expected.trim())
        return error("FAIL check layout")
    }

}

function range(n) {
    return Array.from({ length: n }).map((v, i) => i)
}