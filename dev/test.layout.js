

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
   3: o [4] 0 1 1 2 2
`)

debug_value(range(5).map(i => new Pair(2*i, 2*i+1)), `
   0: n "Pair" // class Pair
   1: c a
   2: c b
   3: o [4] 0 1 -1 2 -2
   4: o [4] 0 1 -3 2 -4
   5: o [4] 0 1 -5 2 -6
   6: o [4] 0 1 -7 2 -8
   7: o [4] 0 1 -9 2 -10
   8: a [5] 3 4 5 6 7
`)

test_value(range(300).map(i => new Pair(2*i, 2*i+1)), 5855)

debug_value({
    name: "Maanoo",
    world: new Set([new Vec2f(.1, 100n)]),
    validator: /\w+/,
    callback: (res) => console.log(res),
    data: new ArrayBuffer(10)
}, `
   0: s "Maanoo"
   1: s "world"
   2: n "Vec2f" // class Vec2f
   3: f 0.1
   4: g "100"
   5: o [4] 2 -50 3 -51 4
   6: m [1] -33 5
   7: s "validator"
   8: s "\\\\w+"
   9: m [2] -30 8 -21
  10: s "callback"
  11: l "(res) => console.log(res)"
  12: u [10] (binary)
  13: d [10] -54 0 1 6 7 9 10 11 -56 12
`)

