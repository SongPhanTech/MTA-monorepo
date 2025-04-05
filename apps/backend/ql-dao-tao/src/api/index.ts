import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import SessionApp from './sessions'

import userService from './services/user.service'
import userRoute from './routes/user.route'
import groupService from './services/groups.service'
import groupRoute from './routes/groups.route'
import roleService from './services/role.service'
import roleRoute from './routes/role.route'
import userProfileRoute from './routes/user-profile.route'
import userProfileService from './services/user-profile.service'
import fixedClassRoute from './routes/fixed-class.route'
import fixedClassService from './services/fixed-class.service'

const app = new OpenAPIHono({ strict: false })
app.route('/', SessionApp)

app
    // #region User
    .openapi(userRoute.createUser, async (c) => {
        const data = await userService.createUser(c)
        return data
    })
    .openapi(userRoute.updateUser, async (c) => {
        const data = await userService.updateUser(c)
        return data
    })

    .openapi(userRoute.getListUsers, async (c) => {
        const data = await userService.getListUsers(c)
        return data
    })

    .openapi(userRoute.getOneUser, async (c) => {
        const data = await userService.getOneUser(c)
        return data
    })
    // #endregion
    // #region Group
    .openapi(groupRoute.createGroup, async (c) => {
        const data = await groupService.createGroup(c)
        return data
    })
    .openapi(groupRoute.updateGroup, async (c) => {
        const data = await groupService.updateGroup(c)
        return data
    })
    // #endregion
    // #region Role
    .openapi(roleRoute.createRole, async (c) => {
        const data = await roleService.createRole(c)
        return data
    })
    .openapi(roleRoute.updateRole, async (c) => {
        const data = await roleService.updateRole(c)
        return data
    })
    // #endregion
    // #region UserProfile
    .openapi(userProfileRoute.uploadExcelCreateUserProfile, async (c) => {
        const data = await userProfileService.uploadFileUserProfile(c)
        return data
    })
    .openapi(userProfileRoute.uploadExcelUpdateUserProfile, async (c) => {
        const data = await userProfileService.uploadFileUserProfile(c)
        return data
    })
    // #endregion
    // #region Fixed Class
    .openapi(fixedClassRoute.uploadExcelCreateFixedClass, async (c) => {
        const data = await fixedClassService.uploadExcelCreateFixedClass(c)
        return data
    })
    // #endregion
export default app
