import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import SessionApp from './sessions'

import userService from './services/user.service'
import userRoute from './routers/user.route'
import groupService from './services/groups.service'
import groupRoute from './routers/groups.route'

const app = new OpenAPIHono({ strict: false })
app.route('/', SessionApp)

app
// #region User
.openapi(userRoute.createUser, async (c) => {
const data = await userService.createUser(c)
return c.json(data, 201)
})
.openapi(userRoute.updateUser, async (c) => {
    const data = await userService.updateUser(c)
    return c.json(data, 200)
})

.openapi(userRoute.getListUsers, async (c) => {
    const data = await userService.getListUsers(c)
    return c.json(data, 200)
})

.openapi(userRoute.getOneUser, async (c) => {
    const data = await userService.getOneUser(c)
    return c.json(data, 200)
})
// #endregion User
.openapi(groupRoute.createGroup, async (c) => {
    const data = await groupService.createGroup(c)
    return c.json(data, 201)
})
.openapi(groupRoute.updateGroup, async (c) => {
    const data = await groupService.updateGroup(c)
    return c.json(data, 200)
})
export default app
