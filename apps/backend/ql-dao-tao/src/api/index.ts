import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import SessionApp from './sessions'

import userService from './services/user.service'
import userRoute from './routes/user.route'
import groupService from './services/groups.service'
import groupRoute from './routes/groups.route'
import roleService from './services/role.service'
import roleRoute from './routes/role.route'
import studentRoute from './routes/student.route'
import studentService from './services/student.service'


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
// #endregion
// #region Group
.openapi(groupRoute.createGroup, async (c) => {
    const data = await groupService.createGroup(c)
    return c.json(data, 201)
})
.openapi(groupRoute.updateGroup, async (c) => {
    const data = await groupService.updateGroup(c)
    return c.json(data, 200)
})
// #endregion
// #region Role
.openapi(roleRoute.createRole, async (c) => {
    const data = await roleService.createRole(c)
    return c.json(data, 201)
})
.openapi(roleRoute.updateRole, async (c) => {
    const data = await roleService.updateRole(c)
    return c.json(data, 200)
})
// #endregion
// #region Student
.openapi(studentRoute.uploadExcel, async (c) => {
    console.log('uploadExcel')
    const data = await studentService.uploadFileStudent(c)
    return c.json(data, 200)
})


export default app
