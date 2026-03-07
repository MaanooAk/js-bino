

bino_config(true)

class Pair {
    constructor(a, b) {
        this.a = a
        this.b = b
    }
}

debug_value(new Pair("a", "b"), `
   0: n "Pair" // class Pair
   1: c a
   2: c b
   3: p [2] 0 1 2 // object desc
   4: o 3 1 2
`)

debug_value(range(5).map(i => new Pair(2 * i, 2 * i + 1)), `
   0: n "Pair" // class Pair
   1: c a
   2: c b
   3: p [2] 0 1 2 // object desc
   4: o 3 -1 -2
   5: o 3 -3 -4
   6: o 3 -5 -6
   7: o 3 -7 -8
   8: o 3 -9 -10
   9: a [5] 4 5 6 7 8
`)

test_value(range(300).map(i => new Pair(2 * i, 2 * i + 1)), 4363)

debug_value([{ a: 1 }, { a: 2 }], `
   0: c a
   1: e [1] 0 // dict desc
   2: o 1 -2
   3: o 1 -3
   4: a [2] 2 3
`)

debug_value([{ a: 1 }], `
   0: c a
   1: e [1] 0 // dict desc
   2: o 1 -2
   3: a [1] 2
`)

debug_value({
    name: "Maanoo",
    world: new Set([new Vec2f(.1, 100n)]),
    validator: /w+/,
    callback: (res) => console.log(res),
    data: new ArrayBuffer(10)
}, `
   0: s "world"
   1: s "validator"
   2: s "callback"
   3: e [5] -54 0 1 2 -56 // dict desc
   4: s "Maanoo"
   5: n "Vec2f" // class Vec2f
   6: p [2] 5 -50 -51 // object desc
   7: f 0.1
   8: g "100"
   9: o 6 7 8
  10: m [1] -33 9
  11: s "w+"
  12: m [2] -30 11 -21
  13: l "(res) => console.log(res)"
  14: u [10] (binary)
  15: o 3 4 10 12 13 14
`)

