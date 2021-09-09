import { isDev, isTest } from "../api/constants"
import {
    arrDef,
    checkObj,
    checkObjType,
    createDef,
    objDef,
    objTypeDef,
    specDef,
    strDef,
} from "../api/validating"

const defaultLogger =
    isDev && checkObj(console) && typeof console.error === "function"
        ? console.error
        : () => {}

export const createValidateFunc = spec => {
    try {
        const validateItem = (key, argsVal, getMsg) => {
            const msg = (function () {
                try {
                    return getMsg(argsVal)
                } catch (error) {
                    throw TypeError(
                        `spec${key}[getMsg] must not throw when called.\n` +
                            error.message
                    )
                }
            })()

            if (typeof msg !== "string") {
                throw TypeError(
                    `spec${key}[getMsg] must return a string when called`
                )
            } else if (msg !== "") {
                throw TypeError(`arguments${key} - ${msg}`)
            }
        }

        if (isTest) {
            validateItem("Def", spec, specDef.getMsg)
        }

        return (...args) => {
            const list = Array(spec.length)
            const refs = new WeakSet()

            const addProps = (key, argsVal, specVal, isStrict) => {
                const props = isStrict ? specVal.strictProps : specVal.props
                const propKeys = Object.keys(props)

                for (let m = 0; m < propKeys.length; m++) {
                    const propKey = propKeys[m]

                    if (isStrict || propKey in argsVal) {
                        list.push([
                            `${key}[${propKey}]`,
                            props[propKey],
                            argsVal[propKey],
                        ])
                    }
                }

                refs.add(argsVal)
            }

            for (let i = 0; i < list.length; i++) {
                const isMain = i < spec.length
                const item = list[i]

                const key = isMain ? `[${i}]` : item[0]
                const specVal = isMain ? spec[i] : item[1]
                const argsVal = isMain ? args[i] : item[2]

                validateItem(key, argsVal, specVal.getMsg)

                if ("props" in specVal && !refs.has(argsVal)) {
                    if (checkObjType(argsVal)) {
                        addProps(key, argsVal, specVal, false)
                    }
                }

                if ("strictProps" in specVal && !refs.has(argsVal)) {
                    validateItem(key, argsVal, objTypeDef.getMsg)
                    addProps(key, argsVal, specVal, true)
                }
            }
        }
    } catch (error) {
        if (isTest) {
            try {
                defaultLogger(
                    "\n Issue with: createValidateFunc\n",
                    `Function arguments: ${spec}\n`,
                    error,
                    "\n"
                )
            } catch {
                // nothing
            }
        }

        return () => {}
    }
}

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
        if (isTest) {
            try {
                defaultLogger(
                    "\n Issue with: stringifyAll\n",
                    `Function arguments: ${data}\n`,
                    error,
                    "\n"
                )
            } catch {
                // nothing
            }
        }

        return JSON.stringify("[unknown]")
    }
}

const createArgsInfoSpec = [arrDef]
const createArgsInfoValidate = createValidateFunc(createArgsInfoSpec)

export const createArgsInfo = args => {
    try {
        if (isTest) {
            createArgsInfoValidate(args)
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

        return argsInfo === "" ? "no args" : argsInfo
    } catch (error) {
        if (isTest) {
            try {
                defaultLogger(
                    "\n Issue with: createArgsInfo\n",
                    `Function arguments: ${args}\n`,
                    error,
                    "\n"
                )
            } catch {
                // nothing
            }
        }

        return "unknown args"
    }
}

const logErrorPropsDef = /*#__PURE__*/ createDef({
    ...objDef,
    strictProps: {
        descr: strDef,
        args: arrDef,
        error: /*#__PURE__*/ createDef({
            getMsg: arg => (!(arg instanceof Error) ? "must be Error" : ""),
        }),
    },
})

export const logErrorSpec = [logErrorPropsDef]
export const logErrorValidate = createValidateFunc(logErrorSpec)

export const logErrorInner = props => {
    try {
        if (isTest) {
            logErrorValidate(props)
        }

        const { descr, args, error } = props

        defaultLogger(
            `\n Issue with: ${descr}\n`,
            `Function arguments: ${createArgsInfo(args)}\n`,
            error,
            "\n"
        )
    } catch (error) {
        if (isTest) {
            try {
                defaultLogger(
                    `\n Issue with: logErrorInner\n`,
                    `Function arguments: ${createArgsInfo([props])}\n`,
                    error,
                    "\n"
                )
            } catch (_e) {
                // nothing
            }
        }
    }
}

export const options = Object.seal({
    errorLogger: defaultLogger,
    notify: () => {},
})

export const errorLogger = (...args) => {
    if (isDev) {
        try {
            options.errorLogger(...args)
        } catch (error) {
            try {
                logErrorInner({ descr: "errorLogger", args, error })
            } catch (_e) {
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
            logErrorInner({ descr: "notify", args, error })
        } catch (_e) {
            // nothing
        }
    }
}
