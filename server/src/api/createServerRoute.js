import {
    SpecError,
    createDef,
    funcDef,
    isServer,
    objTypeDef,
    strDef,
    tie,
} from "tied-up"

const funcOrUndefDef = createDef({
    getMsg: arg =>
        typeof arg !== "function" && arg !== undefined
            ? "must be function or undefined"
            : "",
})

export const createServerRoute = tie({
    descr: "creating route for the server",
    spec: [funcDef, funcOrUndefDef, strDef, strDef, funcDef],
    onTry: (app, onCatch_, method, path, callback) => {
        if (!isServer) {
            throw new Error("This function is meant for server use")
        }

        const defaultOnCatch = props => {
            const { areArgsValid, descr, error, args } = props

            if (areArgsValid) {
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

            throw new SpecError(`at [${descr}], ${error.message}`)
        }

        app[method](
            path,
            tie({
                descr: `${method.toUpperCase()} ${path}`,
                spec: [objTypeDef, objTypeDef],
                onTry: callback,
                onCatch: onCatch_ !== undefined ? onCatch_ : defaultOnCatch,
            })
        )
    },
    onCatch: () => {},
})
