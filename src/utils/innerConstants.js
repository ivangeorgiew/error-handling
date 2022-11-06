import { SpecError, isDev, isTest } from "../api/constants"

const defaultLogger =
    isDev && console instanceof Object && typeof console.error === "function"
        ? console.error
        : () => {}

export const options = Object.seal({
    errorLogger: defaultLogger,
    notify: () => {},
    shouldValidate: isDev,
})

const stringifyAll = data => {
    try {
        const seen = new WeakSet()
        const parser = (_key, val) => {
            if ([Infinity, NaN, null, undefined].includes(val)) {
                return `#${String(val)}#`
            } else if (typeof val === "bigint") {
                return Number(val)
            } else if (typeof val === "object" || typeof val === "function") {
                if (seen.has(val)) {
                    return "#$ref#"
                } else {
                    seen.add(val)

                    return typeof val === "function" ? "#f(x)#" : val
                }
            } else {
                return val
            }
        }

        return JSON.stringify(data, parser, 0)
    } catch (error) {
        try {
            defaultLogger(
                "\n Error at: [stringifyAll] from library tied-up",
                `Function arguments: ${data}\n`,
                error,
                "\n"
            )
        } catch {
            // nothing
        }

        return '"[unknown]"'
    }
}

const createArgsInfo = args => {
    try {
        if (isTest) {
            if (!Array.isArray(args)) {
                throw new SpecError("arguments[0] - must be array")
            }
        }

        const argsInfo = args.reduce((acc, arg, i) => {
            const stringified =
                typeof arg === "function" ? "f(x)" : stringifyAll(arg)

            const parsedArg =
                stringified.length > 100
                    ? Array.isArray(arg)
                        ? "[large array]"
                        : `[large ${typeof arg}]`
                    : stringified.replace(
                          /"#(Infinity|NaN|null|undefined|f\(x\)|\$ref)#"/g,
                          "$1"
                      )

            return i === 0 ? parsedArg : `${acc} , ${parsedArg}`
        }, "")

        return argsInfo === "" ? "[no args]" : argsInfo
    } catch (error) {
        try {
            defaultLogger(
                "\n Error at: [createArgsInfo] from library tied-up",
                `Function arguments: ${args}\n`,
                error,
                "\n"
            )
        } catch {
            // nothing
        }

        return "[unknown args]"
    }
}

const errorLogger = (...args) => {
    if (isDev) {
        try {
            options.errorLogger(...args)
        } catch (error) {
            try {
                defaultLogger(
                    "\n Error at: [errorLogger] from library tied-up",
                    `Function arguments: ${createArgsInfo(args)}\n`,
                    error,
                    "\n"
                )
            } catch {
                // nothing
            }
        }
    }
}

export const notify = (...args) => {
    try {
        options.notify(...args)
    } catch (error) {
        try {
            errorLogger(
                "\n Error at: [notify] from library tied-up",
                `Function arguments: ${createArgsInfo(args)}\n`,
                error,
                "\n"
            )
        } catch {
            // nothing
        }
    }
}

const errorsCache = []

export const getErrorsCacheIdx = (descr, msg) => {
    try {
        if (isTest) {
            if (typeof descr !== "string") {
                throw new SpecError("arguments[0] - must be string")
            }

            if (typeof msg !== "string") {
                throw new SpecError("arguments[1] - must be string")
            }
        }

        const errorsCacheLen = errorsCache.length

        if (errorsCacheLen === 0) {
            return -1
        }

        for (let i = 0; i < errorsCacheLen; i++) {
            const item = errorsCache[i]

            if (descr === item.descr && msg === item.msg) {
                if (Date.now() - item.time < 1000) {
                    return i
                } else {
                    errorsCache.splice(i, 1)

                    return -1
                }
            }
        }

        return -1
    } catch (error) {
        try {
            errorLogger(
                "\n Error at: [getErrorsCacheIdx] from library tied-up",
                `Function arguments: ${createArgsInfo([descr, msg])}\n`,
                error,
                "\n"
            )
        } catch {
            // nothing
        }

        return -1
    }
}

export const manageErrorsCache = (idx, descr, msg) => {
    try {
        if (isTest) {
            if (!Number.isInteger(idx) || !Number.isFinite(idx) || idx < 0) {
                throw new SpecError("arguments[0] - must be positive integer or 0")
            }

            if (typeof descr !== "string") {
                throw new SpecError("arguments[1] - must be string")
            }

            if (typeof msg !== "string") {
                throw new SpecError("arguments[2] - must be string")
            }
        }

        for (let i = idx > 4 ? 4 : idx; i--; ) {
            errorsCache[i + 1] = errorsCache[i]
        }

        errorsCache[0] = { descr, msg, time: Date.now() }
    } catch (error) {
        try {
            errorLogger(
                "\n Error at: [manageErrorsCache] from library tied-up",
                `Function arguments: ${createArgsInfo([idx, descr, msg])}\n`,
                error,
                "\n"
            )
        } catch {
            // nothing
        }
    }
}

export const innerLogError = props => {
    try {
        if (isTest) {
            if (!(props instanceof Object)) {
                throw new SpecError("arguments[0] - must be object")
            }

            if (typeof props.descr !== "string") {
                throw new SpecError("arguments[0][descr] - must be string")
            }

            if (!Array.isArray(props.args)) {
                throw new SpecError("arguments[0][args] - must be array")
            }

            if (!(props.error instanceof Error)) {
                throw new SpecError("arguments[0][error] - must be error")
            }
        }

        const { descr, args, error } = props
        const errorMsg = error.message
        const cacheIdx = getErrorsCacheIdx(descr, errorMsg)

        if (cacheIdx !== -1) {
            if (cacheIdx !== 0) {
                manageErrorsCache(cacheIdx, descr, errorMsg)
            }

            return
        }

        errorLogger(
            `\n Error at: ${descr}\n`,
            `Function arguments: ${createArgsInfo(args)}\n`,
            error,
            "\n"
        )

        manageErrorsCache(errorsCache.length, descr, errorMsg)
    } catch (error) {
        try {
            errorLogger(
                "\n Error at: [innerLogError] from library tied-up",
                `Function arguments: ${createArgsInfo([props])}\n`,
                error,
                "\n"
            )
        } catch {
            // nothing
        }
    }
}

export const checkObjType = a => {
    try {
        const t = typeof a

        return a !== null && (t === "object" || t === "function")
    } catch (error) {
        try {
            innerLogError({
                descr: "[checkObjType] from library tied-up",
                args: [a],
                error,
            })
        } catch {
            // nothing
        }

        throw error
    }
}

export const checkObj = a => {
    try {
        const c = a.constructor

        return checkObjType(a) && (c === Object || c === undefined)
    } catch (error) {
        try {
            innerLogError({
                descr: "[checkObj] from library tied-up",
                args: [a],
                error,
            })
        } catch {
            // nothing
        }

        throw error
    }
}

export const optsKeysGetMsg = (a, keys) => {
    try {
        if (isTest) {
            if (!Array.isArray(keys)) {
                throw new SpecError("arguments[1] - must be array")
            }
        }

        if (!checkObj(a)) {
            return "must be object"
        }

        const aKeys = Object.keys(a)
        let hasValidKeys = false

        for (let i = 0; i < aKeys.length; i++) {
            const aKey = aKeys[i]

            if (keys.indexOf(aKey) === -1) {
                return `has invalid property name: ${aKey}`
            } else if (!hasValidKeys) {
                hasValidKeys = true
            }
        }

        if (!hasValidKeys) {
            return `should contain at least one of: ${keys.join(", ")}`
        }

        return ""
    } catch (error) {
        try {
            innerLogError({
                descr: "[optsKeysGetMsg] from library tied-up",
                args: [a, keys],
                error,
            })
        } catch {
            // nothing
        }

        return ""
    }
}
