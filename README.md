
# js-bino

JavaScript Binary Objects format

- handles all objects / class instances / builtins
- zero configuration required
- handles circular references
- retains object identity
- eliminates duplicate data
- optimized value and id packing
- exports ArrayBuffers / Base64
- optional: provide references to static variables
- optional: provide costume encoders

### Usage

```js
bino_encode({
    name: "Maanoo",
    world: new Set([new Vec2f(.1, 100n)]),
    validator: /\w+/,
    callback: (res) => console.log(res),
    data: new ArrayBuffer(10)
})
```

Static references:
```js
bino_config().refs.set(token, "token")
bino_config().refs.set([v1, v2, v3], "globals")
```

Handlers:
```js
bino_config().handlers.set(Point,
    (i) => (i instanceof Point) ? [i.pack()] : Point.unpack(i[0]))
```
```js
bino_config().handlers.set(Collection, {
  encode: (x) => x.items,
  decode: (a) => new Collection(a),
  init: () => new Collection(),
  fill: (x, a) => x.addAll(a),
})
```

### Specification

Format:
```
- magic int32 ("bino")
- version byte 
- patch byte
- length int32
- unit int32 (1)
- values int32
- id-bytes byte
- root-id int32
- repeat (values) times
  - type char
  - data *
```

Types:
```
- 'b' byte  = number
- 'w' int16 = number
- 'i' int32 = number
- 'f' float64 = number
- 'c' byte = string
- 's/S' len byte = string
- 'a/A' len ids = array

- 'd/D' len id-pairs (key-value) = dictionary
- 'o'   id (desc) ids (values) = object 
- 'e/E' len ids (fields)            = dictionary desc
- 'p/P' len id (class) ids (fields) = class desc
- 'm/m' len id (class) ids (data) = custom
- 'n/N' len chars = class name

- 'y/Y' len chars = symbol name
- 'g/G' len chars = big int
- 'l/L' len chars = lambda
- 'u/U' len bytes = array buffer
- 'r'   id = static reference
- 't/T' len id = static table reference
```

*All special values (null, true, false, "", ...) are predefined and not part of the types*
