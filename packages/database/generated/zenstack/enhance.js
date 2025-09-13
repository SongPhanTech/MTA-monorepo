"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhance = void 0;
const node_1 = require("@zenstackhq/runtime/enhancements/node");
const model_meta_1 = __importDefault(require("./model-meta"));
const policy_1 = __importDefault(require("./policy"));
const zodSchemas = __importStar(require("../zod"));
const prisma_client_1 = require("../prisma-client");
function enhance(prisma, context, options) {
    return (0, node_1.createEnhancement)(prisma, Object.assign({ modelMeta: model_meta_1.default,
        policy: policy_1.default, zodSchemas: zodSchemas, prismaModule: prisma_client_1.Prisma }, options), context);
}
exports.enhance = enhance;
