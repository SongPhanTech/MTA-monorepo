import { OpenAPIHono } from "@hono/zod-openapi"
import { auditLog } from "../../middleware/audit"
import { partnerJwtAuth } from "../../middleware/partner-auth"
import { replayGuard } from "../../middleware/replay-guard"
import { responseSignature } from "../../middleware/response-signature"
import LecturersApp from "./lecturers"
import StudentScoresApp from "./student-scores"
import SubjectClassesApp from "./subject-classes"
import SubjectsApp from "./subjects"

const v1 = new OpenAPIHono({ strict: false })

v1.use("*", auditLog)
v1.use("*", partnerJwtAuth)
v1.use("*", replayGuard)
v1.use("*", responseSignature)

v1.route("/", SubjectsApp)
v1.route("/", SubjectClassesApp)
v1.route("/", LecturersApp)
v1.route("/", StudentScoresApp)

export default v1
