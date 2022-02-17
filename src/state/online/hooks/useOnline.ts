import { useCallback, useEffect, useState } from "react"
import { online } from "../state"

export const useOnline = () => {
    const [, render] = useState<object>({})
    const trigger = useCallback(() => render({}), [])

    useEffect(() => {
        online.subscribe(trigger, "session")

        return () => {
            online.unsubscribe(trigger, "session")
        }
    }, [])

    return online.getState()
}
