import { isDevelopment } from '../constants'
import { getCacheIdx, handledFuncs } from './helpers'
import { logError } from './logging'

export const createFunc = function (...mainArgs) {
    try {
        const [descr, onError, func, shouldCache] = mainArgs

        if (handledFuncs.has(func)) {
            return func
        }

        const cacheKeys = shouldCache ? [] : undefined
        const cacheValues = shouldCache ? [] : undefined

        let isNextCallFirst = true

        const manageCache = function (idx, key, value) {
            try {
                if (idx > 5) {
                    idx = 5
                }

                while (idx--) {
                    cacheKeys[idx + 1] = cacheKeys[idx]
                    cacheValues[idx + 1] = cacheValues[idx]
                }

                cacheKeys[0] = key
                cacheValues[0] = value
            } catch (error) {
                // nothing
            }
        }

        const innerCatch = function (args, error) {
            try {
                logError({ descr, error, args })

                try {
                    return onError({ descr, args, error })
                } catch (error) {
                    logError({
                        descr: `catching errors for [${descr}]`,
                        args,
                        error
                    })
                }
            } catch (error) {
                // nothing
            }
        }

        const innerFunc = function (...args) {
            let isFirstCall, result

            try {
                if (shouldCache) {
                    const cacheIdx = getCacheIdx(args, cacheKeys)

                    if (cacheIdx !== -1) {
                        if (cacheIdx !== 0) {
                            manageCache(
                                cacheIdx,
                                cacheKeys[cacheIdx],
                                cacheValues[cacheIdx]
                            )
                        }

                        return cacheValues[0]
                    }
                }

                isFirstCall = isNextCallFirst
                isNextCallFirst = false

                if (new.target === undefined) {
                    result = func.apply(this, args)
                } else {
                    result = new func(...args)
                }

                let shouldStore = true

                // handle async, generator and async generator
                if (typeof result === 'object' && result !== null) {
                    if (typeof result[Symbol.asyncIterator] === 'function') {
                        shouldStore = false
                        result = (async function* (iter) {
                            try {
                                const res = yield* iter

                                if (shouldCache) {
                                    manageCache(cacheKeys.length, args, iter)
                                }

                                return res
                            } catch (error) {
                                if (!isFirstCall) throw error
                                return innerCatch(args, error)
                            }
                        })(result)
                    } else if (typeof result[Symbol.iterator] === 'function') {
                        shouldStore = false
                        result = (function* (iter) {
                            try {
                                const res = yield* iter

                                if (shouldCache) {
                                    manageCache(cacheKeys.length, args, iter)
                                }

                                return res
                            } catch (error) {
                                if (!isFirstCall) throw error
                                return innerCatch(args, error)
                            }
                        })(result)
                    } else if (typeof result.then === 'function') {
                        shouldStore = false
                        result = (async function (prom) {
                            try {
                                const res = await prom

                                if (shouldCache) {
                                    manageCache(cacheKeys.length, args, prom)
                                }

                                return res
                            } catch (error) {
                                if (!isFirstCall) throw error
                                return innerCatch(args, error)
                            }
                        })(result)
                    }
                }

                if (shouldCache && shouldStore) {
                    manageCache(cacheKeys.length, args, result)
                }
            } catch (error) {
                if (!isFirstCall) throw error
                result = innerCatch(args, error)
            }

            if (isFirstCall) {
                isNextCallFirst = true
            }

            return result
        }

        if (isDevelopment && typeof innerFunc.name === 'string') {
            Object.defineProperty(innerFunc, 'name', {
                value: `[${descr}]`,
                configurable: true
            })
        }

        handledFuncs.add(innerFunc)

        return innerFunc
    } catch (error) {
        logError({
            descr: 'creating an error-handled function',
            error,
            args: mainArgs
        })

        return () => {}
    }
}
