// const {
//     tiePure,
//     changeOptions,
//     handleGlobalErrors,
//     idxDef,
//     definedDef,
//     createDef,
// } = require("../dist/index.cjs.js")

// handleGlobalErrors(true)

// const retryFunc = tiePure(
//     "retry function",
//     [],
//     n => {
//         if (n < 5) {
//             throw Error("Test Error")
//         } else {
//             return n + 10
//         }
//     },
//     props => {
//         const { args } = props
//         const [n] = args

//         console.log(n)
//         return retryFunc(n + 1)
//     }
// )

// console.log(retryFunc(4)) // success
// console.log()
// console.log(retryFunc(4)) // failed more than once

// const fib = tiePure(
//     "calculating fibonacci number",
//     [idxDef, definedDef, definedDef, definedDef, definedDef, definedDef],
//     (n, a, b, c, d, e) => {
//         if (n <= 1) return n

//         const pre = fib(n - 2, a, b, c, d, e)
//         const prepre = fib(n - 1, a, b, c, d, e)

//         return pre + prepre
//     },
//     () => "There was an error"
// )

// const a = () => {
//     throw new Error("sup")
// }
// const b = new Error("blabla")
// const c = [5, 6]
// const d = { a: 3 }

// d.myself = d

// const dDef = createDef({ strictProps: { a: idxDef } })
// dDef.strictProps.myself = dDef

// const A = tiePure(
//     "class A",
//     [dDef],
//     class {
//         constructor(props) {
//             this.a = props.a
//             this.b = 6
//         }
//     },
//     () => ({})
// )

// const B = tiePure(
//     "class B",
//     [dDef],
//     class extends A {
//         constructor(props) {
//             super(props)

//             this.c = props.a + 123
//         }
//     },
//     () => ({})
// )

// const e = new B(d)

// console.log(fib(500000, a, b, c, d, e))
// console.log(fib(500000, a, b, c, d, e))
// console.log(fib(4000, a, b, c, d, e))
// console.log(fib(4000, a, b, c, d, e))

// Args validation takes its toll on time!
// RUN WITH: NODE_ENV=production node ./tests/index.js
// console.time("fib")
// fib(4000, a, b, c, d, e) // around 13ms is normal for 4000
// console.timeEnd("fib")

// const asyncGen = tiePure(
//     "asynchronous generator function test",
//     [idxDef],
//     async function* (i) {
//         yield i
//         await new Promise(resolve => {
//             setTimeout(resolve, 1000)
//         })
//         // throw new Error("intended")
//         return i + 10
//     },
//     () => "There was an error"
// )

// ;(async () => {
//     const g1 = asyncGen(10)
//     console.log(await g1.next())
//     console.log(await g1.next())
//     console.log(await g1.next())

//     const g2 = asyncGen(10)
//     console.log(await g2.next())
// })()

// const gen = tiePure(
//     "generator function test",
//     [idxDef],
//     function* (i) {
//         yield i
//         // throw new Error("intended")
//         return i + 10
//     },
//     () => "There was an error"
// )

// const g1 = gen(10)
// console.log(g1.next())
// console.log(g1.next())
// console.log(g1.next())
// const g2 = gen(10)
// console.log(g2.next())

// const asyncF = tiePure(
//     "asynchronous function test",
//     [idxDef],
//     async i => {
//         // await asyncF(i + 1)
//         await new Promise(resolve => {
//             setTimeout(resolve, 1000)
//         })
//         // throw new Error("intended")
//         return i
//     },
//     () => "There was an error"
// )

// ;(async () => {
//     console.log(await asyncF(10))
//     console.log(await asyncF(10))
//     console.log("after")
// })()

// const addNumbers = tiePure(
//     "adding two numbers",
//     [idxDef, idxDef],
//     (a, b) => {
//         console.log("ran func")

//         return a + b
//     },
//     () => "There was an error"
// )

// const addSupTo = addNumbers("sup")
// const addTenTo = addNumbers(10)
// const copyOfAddTenTo = addNumbers(10)

// console.log(addSupTo(5))
// console.log(addTenTo(5))
// console.log(copyOfAddTenTo(5))
// console.log(copyOfAddTenTo("bla"))

// changeOptions({ notify: () => {} })
// changeOptions({ typo: () => {} })
// changeOptions({ errorLogger: 5, notify: () => {} })
// changeOptions({ errorLogger: console.error, notify: 5 })
// changeOptions("blabla")
