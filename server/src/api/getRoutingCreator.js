import {
    tieImpure,
    isServer,
    orThrow,
    validateArgs,
    checkFunc,
    checkNil,
    checkStr,
} from "tied-up"

const defaultOnError = tieImpure(
    "catching server errors",
    () => {},
    props => {
        const { descr, error, args } = props

        const res = args[1]
        const message = error instanceof Error ? error.message : error
        const stack = error instanceof Error ? error.stack : ""

        if (!res.headersSent) {
            res.status(500).json({
                error: {
                    name: `Server issue with: ${descr}`,
                    message,
                    stack,
                },
            })
        }
    }
)

const getRoutingCreatorSpec = [
    [checkFunc, "must be a function"],
    [arg => checkFunc(arg) || checkNil(arg), "must be function or undefined"],
    [checkStr, "must be string"],
    [checkStr, "must be string"],
    [checkFunc, "must be function"],
]

export const getRoutingCreator = tieImpure(
    "creating route for the server",
    () => {},
    (app, onError_, method, path, callback) => {
        validateArgs(getRoutingCreatorSpec, [app, onError_, method, path, callback])

        orThrow(isServer, "This function is meant for server use")

        const onError = checkNil(onError_) ? defaultOnError : onError_

        app[method](
            path,
            tieImpure(`${method.toUpperCase()} ${path}`, onError, callback)
        )
    }
)
