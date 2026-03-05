/**
 * js-bino.js
 * version: 0.1
 * author: Akritas Akritidis
 * repo: https://github.com/MaanooAk/js-bino
 */

function bino_config() {
    if (bino_config.config) return bino_config.config

    const refs = new Map()
    const handlers = new Map()

    const negatives = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        null, undefined, false, true, "", Infinity, -Infinity, NaN,
        BigInt, Symbol, Function, Object,
        Date, RegExp, URL, Map, Set,
        WeakRef, WeakMap, WeakSet,
        ArrayBuffer, DataView,
        Int8Array, Uint8Array, Uint8ClampedArray,
        Int16Array, Uint16Array, Int32Array, Uint32Array,
        Float32Array, Float64Array, BigInt64Array, BigUint64Array,
        "x", "y", "z", "id", "name", "type", "data",
    ]

    handlers.set(Set, {
        encode: (x) => [...x.values()],
        decode: (a) => new Set(a),
        init: () => new Set(),
        fill: (x, a) => a.forEach(i => x.add(i))
    })
    handlers.set(Map, {
        encode: (x) => [...x.entries()].flat(),
        decode: (a) => {
            const m = new Map()
            for (let i = 0; i < a.length; i += 2) m.set(a[i], a[i + 1])
            return m
        },
        init: () => new Map(),
        fill: (x, a) => {
            for (let i = 0; i < a.length; i += 2) x.set(a[i], a[i + 1])
        }
    })

    handlers.set(URL, (x) => (x instanceof URL) ? [x.toString()] : new URL(x[0]))
    handlers.set(Date, (x) => (x instanceof Date) ? [x.getTime()] : new Date(x[0]))
    handlers.set(RegExp, (x) => (x instanceof RegExp) ? [x.source, x.flags] : new RegExp(x[0], x[1]))

    handlers.set(WeakRef, (x) => (x instanceof WeakRef) ? [x.deref()] : new WeakRef(x[0]))
    handlers.set(WeakMap, (x) => (x instanceof WeakMap) ? [] : new WeakMap())
    handlers.set(WeakSet, (x) => (x instanceof WeakSet) ? [] : new WeakSet())

    for (const T of [DataView,
        Int8Array, Uint8Array, Uint8ClampedArray,
        Int16Array, Uint16Array, Int32Array, Uint32Array,
        Float32Array, Float64Array, BigInt64Array, BigUint64Array,
    ]) {
        handlers.set(T, (x) => (x instanceof T) ?
            [x.buffer, x.byteOffset, x.length ?? x.byteLength] :
            new T(x[0], x[1], x[2]))
    }

    class BinaryWriter {

        constructor(capacity = 1024 * 10) {
            this.view = new DataView(new ArrayBuffer(capacity))
            this.encoder = new TextEncoder();
            this.id = this.int8
            this.offset = 0
        }

        inc(size) {
            const o = this.offset
            this.offset += size
            if (this.offset >= this.view.buffer.byteLength) {
                let length = this.view.buffer.byteLength * 2
                while (this.offset >= length) length *= 2

                const buffer = new ArrayBuffer(length)
                new Uint8Array(buffer).set(new Uint8Array(this.view.buffer))
                this.view = new DataView(buffer)
            }
            return o
        }

        byte(value) { const o = this.inc(1); this.view.setUint8(o, value) }
        char(value) { const o = this.inc(1); this.view.setUint8(o, value.charCodeAt(0)); return this }

        int8(value) { const o = this.inc(1); this.view.setInt8(o, value) }
        int16(value) { const o = this.inc(2); this.view.setInt16(o, value) }
        int32(value) { const o = this.inc(4); this.view.setInt32(o, value) }
        float64(value) { const o = this.inc(8); this.view.setFloat64(o, value) }

        len(size, type1, type2) {
            if (size < 256) this.char(type1).byte(size)
            else this.char(type2).int32(size)
            return this
        }

        string(str, type1 = 's', type2 = 'S') {
            const encoded = this.encoder.encode(str);
            this.bytes(encoded, type1, type2)
        }
        bytes(array, type1 = 'u', type2 = 'U') {
            this.len(array.byteLength, type1, type2);
            const o = this.inc(array.byteLength)
            new Uint8Array(this.view.buffer, o).set(array)
        }
    }

    class BinaryReader {

        constructor(buffer) {
            this.view = new DataView(buffer)
            this.decoder = new TextDecoder();
            this.id = this.int8
            this.offset = 0
        }

        inc(size) {
            const o = this.offset
            this.offset += size
            return o
        }

        byte() { return this.view.getUint8(this.inc(1)) }
        char() { return String.fromCodePoint(this.view.getUint8(this.inc(1))) }

        int8() { return this.view.getInt8(this.inc(1)) }
        int16() { return this.view.getInt16(this.inc(2)) }
        int32() { return this.view.getInt32(this.inc(4)) }
        float64() { return this.view.getFloat64(this.inc(8)) }

        len(small) { return small ? this.byte() : this.int32() }

        string(len) {
            const start = this.inc(len)
            return this.decoder.decode(new Uint8Array(this.view.buffer, start, len))
        }
        bytes(len) {
            const start = this.inc(len)
            return this.view.buffer.slice(start, start + len)
        }
    }

    return bino_config.config = {
        magic: 0x62696E6F, // "bino"
        version: 0,
        patch: 1,
        negatives,
        refs,
        handlers,
        BinaryReader,
        BinaryWriter,
    }
}

function bino_encode(value) {
    const config = bino_config()

    const ids = new Map()
    const values = []

    for (let i = 0; i < config.negatives.length; i++) {
        ids.set(config.negatives[i], -i - 1)
    }

    class ClassHolder {
        constructor(c) { this.c = c }
    }
    class ReferenceHolder {
        constructor(id) { this.id = id }
    }
    class TableReferenceHolder {
        constructor(id, index) {
            this.id = id;
            this.index = index
            this.explored = false
        }
    }
    class IdLookup {
        constructor(value) { this.value = value }
    }

    const refs = config.refs

    const table_refs = new Map()
    for (const [v, id] of refs) {
        if (!Array.isArray(v)) continue
        for (let i = 0; i < v.length; i++) {
            table_refs.set(v[i], new TableReferenceHolder(id, i))
        }
    }

    function explore(value, encoded = null) {
        if (ids.has(value)) return ids.get(value) ?? new IdLookup(value)
        ids.set(value)

        const type = typeof value

        if (refs.has(value)) {
            const id = refs.get(value)
            encoded = new ReferenceHolder(explore(id))

        } else if (table_refs.has(value)) {
            const holder = table_refs.get(value)
            if (!holder.explored) {
                holder.id = explore(holder.id)
                holder.explored
            }
            encoded = holder

        } else if (type === "object") {

            if (Array.isArray(value)) {
                for (const i of value) explore(i)

            } else {
                const c = value.constructor
                if (c && c !== Object) {
                    explore(c, new ClassHolder(c))
                }
                const handler = config.handlers.get(c)
                const entries = handler ? (handler.encode ?? handler)(value) : Object.entries(value).flat()
                for (const i of entries) explore(i)
            }

        } else if (type == "function") {
            if (value.toString().startsWith("class")) {
                encoded = new ClassHolder(value)
            }
        }

        const id = values.length
        ids.set(value, id)
        values.push(encoded || value)
        return id
    }
    const root_id = explore(value)

    const writer = new config.BinaryWriter()
    writer.int32(config.magic)
    writer.byte(config.version)
    writer.byte(config.patch)

    const offset_length = writer.offset
    writer.int32(0)
    writer.int32(1)

    const id_size = Math.ceil((Math.log2(values.length + 1) + 1) / 8)
    writer.int32(values.length)
    writer.byte(id_size)
    writer.int32(root_id)

    writer.id = [null,
        writer.int8, writer.int16,
        writer.int32, writer.int32,
    ][id_size]

    function ids_get(id) {
        if (id instanceof IdLookup) return ids.get(ids.get(value))
        return ids.get(id)
    }

    function output(value) {
        const type = typeof value

        if (type === "number") {
            if (Number.isSafeInteger(value)) {
                const value_abs = Math.abs(value)
                if (value_abs < (1 << 7)) return writer.char('b').int8(value)
                if (value_abs < (1 << 15)) return writer.char('w').int16(value)
                if (value_abs < (1 << 30)) return writer.char('i').int32(value)
            }
            return writer.char('f').float64(value)
        }
        if (type === "string") {
            if (value.length === 1) return writer.char('c').char(value)
            return writer.string(value, 's', 'S')
        }

        if (type === "object") {
            if (Array.isArray(value)) {
                writer.len(value.length, 'a', 'A')
                for (const i of value) writer.id(ids_get(i))
                return
            }
            const c = value.constructor

            if (value instanceof ClassHolder) {
                return writer.string(value.c.name, 'n', 'N')
            }
            if (value instanceof ReferenceHolder) {
                return writer.char('r').id(value.id)
            }
            if (value instanceof TableReferenceHolder) {
                return writer.len(value.index, 't', 'T').id(value.id)
            }
            if (value instanceof ArrayBuffer) {
                return writer.bytes(new Uint8Array(value), 'u', 'U')
            }

            const handler = config.handlers.get(c)
            const entries = handler ? (handler.encode ?? handler)(value) : Object.entries(value).flat()
            if (!c || c === Object) {
                writer.len(entries.length, 'd', 'D')
            } else {
                writer.len(entries.length, 'o', 'O')
                writer.id(ids_get(c))
            }
            for (const i of entries) {
                writer.id(ids_get(i))
            }
            return
        }

        if (type === "bigint") {
            return writer.string(value.toString(), 'g', 'G')
        }
        if (type === "symbol") {
            return writer.string(Symbol.keyFor(value) || value.description, 'y', 'Y')
        }
        if (type == "function") {
            return writer.string(value.toString(), 'l', 'L')
        }
    }

    for (const value of values) {
        output(value)
    }

    const length = writer.offset
    writer.offset = offset_length
    writer.int32(length)

    return writer.view.buffer.slice(0, length)
}

function bino_encode64(value, base64_options) {
    const buffer = bino_encode(value)
    return new Uint8Array(buffer).toBase64(base64_options)
}

function bino_decode(binary) {
    const config = bino_config()

    const refs = new Map()
    for (const [value, id] of config.refs) refs.set(id, value)

    const values = []
    const incomplete = []
    let id = 0

    const buffer = typeof binary === "string" ? Uint8Array.fromBase64(binary) : binary
    const reader = new config.BinaryReader(buffer.buffer ?? buffer)

    if (reader.int32() != config.magic) throw 'magic mismatch'
    if (reader.byte() != config.version) throw 'version mismatch'
    if (reader.byte() != config.patch) throw 'patch mismatch'

    const length_base = reader.int32()
    const length_unit = reader.int32()

    values.length = reader.int32()
    const id_size = reader.byte()
    const root_id = reader.int32()

    reader.id = [null,
        reader.int8, reader.int16,
        reader.int32, reader.int32,
    ][id_size]


    function get_value(i) {
        if (i < 0) return config.negatives[-i - 1]
        if (i > id) throw i
        return values[i]
    }

    function get_value_or(i) {
        return i
    }

    function input() {
        const type = reader.char()
        const lower = type.toLowerCase()

        if (type === 'b') return reader.int8()
        if (type === 'w') return reader.int16()
        if (type === 'i') return reader.int32()
        if (type === 'f') return reader.float64()
        if (type === 'c') return reader.char()
        if (lower === 's') return reader.string(reader.len(type == lower))

        if (lower === 'u') return reader.bytes(reader.len(type == lower))
        if (lower === 'n') return eval(reader.string(reader.len(type == lower)))
        if (lower === 'g') return BigInt(reader.string(reader.len(type == lower)))
        if (lower === 'y') return Symbol.for(reader.string(reader.len(type == lower)))
        if (lower === 'l') return eval("(" + reader.string(reader.len(type == lower)) + ")")

        if (lower === 'a') {
            const len = reader.len(type == lower)
            const array = new Array(len)
            for (let i = 0; i < len; i++) array[i] = get_value_or(reader.id())
            incomplete.push(['a', array])
            return array
        }

        if (lower === 'd') {
            const len = reader.len(type == lower)
            const object = {}
            for (let i = 0; i < len; i += 2) {
                const k = get_value(reader.id())
                object[k] = get_value_or(reader.id())
            }
            incomplete.push(['d', object])
            return object
        }

        if (lower === 'o') {
            const len = reader.len(type == lower)
            const c = get_value(reader.id())
            const handler = config.handlers.get(c)
            if (!handler) {
                const object = Object.create(c.prototype)
                for (let i = 0; i < len; i += 2) {
                    const k = get_value(reader.id())
                    object[k] = get_value_or(reader.id())
                }
                incomplete.push(['o', object])
                return object
            } else if (handler.init) {
                const object = handler.init()
                const entries = new Array(len)
                for (let i = 0; i < len; i++) {
                    entries[i] = get_value_or(reader.id())
                }
                incomplete.push(['h', object, entries, handler])
                return object
            } else {
                const entries = new Array(len)
                for (let i = 0; i < len; i++) {
                    entries[i] = get_value(reader.id())
                }
                return (handler.decode ?? handler)(entries)
            }
        }
        if (lower === 'r') return refs.get(get_value(reader.id()))
        if (lower === 't') {
            const index = reader.len(type == lower)
            const ref = refs.get(get_value(reader.id()))
            return ref[index]
        }

        throw type
    }

    function input_complete([type, object, entries, handler]) {

        if (type === 'a') {
            for (let i = 0; i < object.length; i++) object[i] = get_value(object[i])

        } else if (type === 'd' || type === 'o') {
            for (const k in object) object[k] = get_value(object[k])

        } else if (type === 'h') {
            for (let i = 0; i < entries.length; i++) entries[i] = get_value(entries[i])
            handler.fill(object, entries)
        }
    }

    for (; id < values.length; id++) {
        const value = input()
        values[id] = value
    }

    for (let i = 0; i < incomplete.length; i++) {
        input_complete(incomplete[i])
    }

    return get_value(root_id)
}