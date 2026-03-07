

const { negatives } = bino_config(true)
negatives.forEach(i => test_value(i, 0))

test_value(0, 0)
test_value(10, 0)
test_value(100, 2)
test_value(-100, 2)
test_value(1000, 3)
test_value(-1000, 3)
test_value(100000, 5)
test_value(1 << 29, 5)
test_value(Number.MAX_SAFE_INTEGER, 9)
test_value(0.123, 9)
test_value(-0.123, 9)
test_value(Number.MIN_VALUE, 9)
test_value(Number.MAX_VALUE, 9)
test_value("", 0)
test_value("H", 2)
test_value("Hello", "Hello".length + 1 + 1)
test_value("Hello World", "Hello World".length + 1 + 1)
test_value(range(300).map(i => i % 10).join(""), 300 + 1 + 4)

test_value(1n, 3)
test_value(2n ** 1000n, 307)
test_value(Symbol.for("s1"), 1 + 1 + 2)
test_value(Symbol("s2"), 1 + 1 + 2)

test_value([], 2)
test_value({}, 2)

test_value([10, 9, 8], 3 + 1 + 1)
test_value([true, "", null], 3 + 1 + 1)
test_value(range(300).map(i => i % 16), 300 + 1 + 4)

test_value({ x: 1, y: 2 }, 2 * 2 + 1 + 1)
test_value({ y: 3, x: 4 }, 2 * 2 + 1 + 1)
test_value({ id: 10, name: "name" }, 2 * 2 + 1 + 1)

test_value({ id: 2026 }, (2 + 1 + 1) + (1 + 2))
test_value({ a: 2026 }, (2 + 1 + 1) + (1 + 2) + (1 + 1))
test_value({ aa: 2026 }, (2 + 1 + 1) + (1 + 2) + (1 + 1 + 2))

test_value([{ x: 1, y: 2 }, { x: 3, y: 4 }], (6 * 2) + 2 + 2)
test_value([{ xx: 101, yy: 102 }, { xx: 103, yy: 104 }],
    1 + 1 + 2 + // c len ids
    2 * (1 + 1 + 4) + // 2x objects
    2 * (1 + 1 + 2) + // 2x strings
    4 * 2 // 4x numbers
)


const value_developer = {
    name: "Maanoo",
    type: "human",
    title: "developer",
    birth: { year: 1996 },
    tags: ["developer", "human"]
}

test_value(value_developer, 75)
value_developer.tags.push(1.1)
test_value(value_developer, 75 + (1 + 1 + 8))

test_value([value_developer, value_developer], 89, (v) => v[0] === v[1])
test_value([value_developer, { ref: value_developer }], 98, (v) => v[0] === v[1].ref)

test_value([{}, {}], 8, (v) => v[0] !== v[1])
test_value([value_developer, structuredClone(value_developer)], 110, (v) => v[0] !== v[1])


class Vec2f {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

test_value(new Vec2f(.1, .2),
    1 + 1 + 1 + 2 * 2 + // c len class 2x pairs
    2 * 9 + // 2x floats
    1 + 1 + "Vec2f".length // class
)

const value_vec2f = new Vec2f(.1, .2)
test_value(value_vec2f, 32, (v) => v instanceof Vec2f)
value_vec2f.z = 10
test_value(value_vec2f, 34, (v) => v instanceof Vec2f && v.z === 10)
delete value_vec2f.x
test_value(value_vec2f, 23, (v) => v instanceof Vec2f && v.x === undefined)

test_value(new Vec2f(new Vec2f(1, 2), 3), 21, (v) => v.x instanceof Vec2f)

const test_map = new Map()
test_map.set(100, "hello")
test_map.set("world", 200)

test_value(test_map, 26, (v) => check_equals([...test_map.entries()], [...v.entries()]))

const test_set = new Set([100, "hello", "world", 200])

test_value(test_set, 26, (v) => check_equals([...test_set.entries()], [...v.entries()]))

test_value(new URL("https://example.com"), 26)
test_value(new Date(), 13)
test_value(new Date(2026, 1, 1), 13)
test_value(/hello/, 12, (v) => v.source == "hello")
test_value(/hello/i, 14, (v) => v.source == "hello" && v.flags == "i")


test_value((x) => x * 2, 14, (v) => v(2) == 4)
test_value(function double(x) { return x * 2 }, 37, (v) => v(2) == 4)

const value_temp = new Vec2f(.5, 1.2)

test_value([value_temp, new WeakRef(value_temp)], 40, (v) => v[0] === v[1].deref())

test_value(new WeakSet(), 3, (v) => v instanceof WeakSet)
test_value(new WeakMap(), 3, (v) => v instanceof WeakMap)
// const weak_map = new WeakMap()
// weak_map.set(value_temp, 10)
// test_value([value_developer, weak_map], skip, (v) => v[1].get(v[0]) === 10)
// test_value([value_temp, new WeakSet([value_temp])], skip, (v) => v[1].has(v[0]))

const value_buffer = new ArrayBuffer(16)
const value_buffer_view = new DataView(value_buffer)
value_buffer_view.setUint16(0, 0xcafe)

test_value(value_buffer, 18, (v) => v instanceof ArrayBuffer)
test_value(new Float32Array(value_buffer), 24, (v) => v instanceof Float32Array)
test_value(new Uint8Array(value_buffer, 1, 3), 24, (v) => v instanceof Uint8Array)
test_value(value_buffer_view, 26, (v) => v instanceof DataView)
test_value([new Uint8Array(value_buffer), new Float64Array(value_buffer)], 36, (v) => v[0].buffer == v[1].buffer)

class Level {
    static Ground = new Level("ground")
    static First = new Level("first")
    static All = [Level.Ground, Level.First]

    static get(i) {
        return Level.All[i]
    }

    constructor(name) {
        this.name = name
    }
}

test_value(Level.get(0), 20)
test_value(Level.get(1), 19, (v) => v !== Level.All[1])

bino_config().handlers.set(Level, (x) => (x instanceof Level) ? [Level.All.indexOf(x)] : Level.get(x[0]))

test_value(Level.get(0), 11)
test_value(Level.get(1), 11, (v) => v === Level.All[1])

const value_settings = {
    size: { x: 10, y: 10 }
}

bino_config().refs.set(value_settings, 0)
bino_config().refs.set(value_developer, "developer")

test_value(value_settings, 2, (v) => v === value_settings)
test_value(value_developer, 13, (v) => v === value_developer)

test_value(value_settings, 2, (v) => v.size === value_settings.size)
value_settings.size.y = 100000
test_value(value_settings, 2, (v) => v.size === value_settings.size)
bino_config().refs.delete(value_settings, 0)
test_value(value_settings, 21, (v) => v.size !== value_settings.size)
value_settings.size.y = 10
test_value(value_settings, 21 - 5, (v) => v.size !== value_settings.size)

class Res {
    static Wood = new Res()
    static Gold = new Res()
}

test_value(Res.Wood, 8, (v) => v !== Res.Wood)

bino_config().refs.set([Res.Wood, Res.Gold], "Res")

test_value(Res.Wood, 8, (v) => v === Res.Wood)
test_value([Res.Wood, Res.Wood], 12, (v) => v[0] === Res.Wood && v[1] === Res.Wood)
test_value([Res.Wood, Res.Gold], 15, (v) => v[0] === Res.Wood && v[1] === Res.Gold)

test_value({ inv: new Set([Res.Gold]) },
    1 + 1 + 2 + // object
    1 + 1 + 3 + // inv
    1 + 1 + 3 + // Set
    1 + 1 + 1 + 1 + // set
    1 + 1 + 1 // ref
    , (v) => v.inv.has(Res.Gold))


class World {
    things = []
}
class Thing {
    name = "thing"
    world = null
}

const world = new World()
const thing = new Thing()
world.things.push(thing)
thing.world = world

test_value(world, 51, (v) => world == world.things[0].world)

for (const i of range(10)) {
    const thing = new Thing()
    world.things.push(thing)
    thing.world = world
}

test_value(world, 51 + 10 * 8, (v) => world.things[2].world && world == world.things[4].world)

world.map = new Map()
world.map.set(world, world)
world.things.length = 2

test_value(world, 71, (v) => world === world.map.get(world))

test_value({
    name: "Maanoo",
    world: new Set([new Vec2f(.1, 100n)]),
    validator: /\w+/,
    callback: (res) => console.log(res),
    data: new ArrayBuffer(10)
}, 129)


test_value(range(100).map(i => 128 + i), 1 + 1 + 100 * (1 + 2 + 1))
test_value(range(1000).map(i => 128000 + i), 1 + 4 + 1000 * (1 + 4 + 2))
test_value(range(1 << 15).map(i => 128000 + i), 1 + 4 + (1 << 15) * (1 + 4 + 4))

test_value(Vec2f, 7, (v) => v === Vec2f)
