import { randomUUIDv7 } from "bun"
import dayjs from "dayjs"
import { type BucketItem, Client } from "minio"
import type { ListObjectDto, PresignedUrlDto, UrlDto } from "../dto/minio"

export class MinIOService {
  private readonly minioClient: Client
  private readonly bucketName: string

  constructor() {
    this.minioClient = new Client({
      endPoint: process?.env?.MINIO_ENDPOINT ? new URL(process?.env?.MINIO_ENDPOINT).hostname : "",
      ...(process.env.MINIO_PORT
        ? {
            port: Number.parseInt(process.env.MINIO_PORT, 10),
          }
        : {}),
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      pathStyle: true,
      useSSL: process.env.MINIO_USE_SSL === "true",
      region: process.env.MINIO_REGION || "vn",
    })

    this.bucketName = process.env.MINIO_BUCKET || ""
  }

  // async onModuleInit() {
  //     const exists = await this.minioClient.bucketExists(this.bucketName)
  //     console.log(`Bucket ${this.bucketName} exists: ${exists}`)
  //     if (!exists) {
  //         await this.minioClient.makeBucket(this.bucketName)
  //         await this.minioClient.setBucketPolicy(
  //             this.bucketName,
  //             JSON.stringify({
  //                 Version: '2012-10-17',
  //                 Statement: [
  //                     {
  //                         Effect: 'Allow',
  //                         Principal: {
  //                             AWS: ['*'],
  //                         },
  //                         Action: ['s3:GetBucketLocation'],
  //                         Resource: [`arn:aws:s3:::${this.bucketName}`],
  //                     },
  //                     {
  //                         Effect: 'Allow',
  //                         Principal: {
  //                             AWS: ['*'],
  //                         },
  //                         Action: ['s3:ListBucket'],
  //                         Resource: [`arn:aws:s3:::${this.bucketName}`],
  //                         Condition: {
  //                             StringEquals: {
  //                                 's3:prefix': ['media', 'public'],
  //                             },
  //                         },
  //                     },
  //                     {
  //                         Effect: 'Allow',
  //                         Principal: {
  //                             AWS: ['*'],
  //                         },
  //                         Action: ['s3:GetObject'],
  //                         Resource: [
  //                             `arn:aws:s3:::${this.bucketName}/media*`,
  //                             `arn:aws:s3:::${this.bucketName}/public*`,
  //                         ],
  //                     },
  //                 ],
  //             })
  //         )
  //         console.log(`Created bucket ${this.bucketName} successfully`)
  //     }
  //     console.log(`Bucket ${this.bucketName} is ready`)
  // }

  async generatePresignedUrl({
    path: folder,
    extension,
    name = randomUUIDv7(),
    flat,
  }: PresignedUrlDto): Promise<UrlDto> {
    const fileName = `${name}${extension ? `.${extension}` : ""}`
    const path = flat
      ? `${folder}/${fileName}`
      : `${folder}/${dayjs().format("YYYY-MM-DD")}/${fileName}`
    const url = await this.minioClient.presignedPutObject(this.bucketName, path, 3600)

    return { url, fileName: `${this.bucketName}/${path}` }
  }

  async findAll({ path, limit, startAfter }: ListObjectDto) {
    return this.listObjectsWithLimit(this.bucketName, path, limit, startAfter)
  }

  async putObject(objectName: string, buffer: Buffer, contentType: string): Promise<UrlDto> {
    await this.minioClient.putObject(this.bucketName, objectName, buffer, buffer.length, {
      "Content-Type": contentType,
    })
    return { url: "", fileName: `${this.bucketName}/${objectName}` }
  }

  async presignedGetObject(objectName: string): Promise<UrlDto> {
    const url = await this.minioClient.presignedGetObject(this.bucketName, objectName, 3600)
    return { url, fileName: objectName }
  }

  async remove(objectName: string) {
    this.minioClient.removeObject(this.bucketName, objectName)
  }

  private listObjectsWithLimit(
    bucketName: string,
    prefix = "",
    limit = 10,
    startAfter?: string,
    recursive = false
  ) {
    const stream = this.minioClient.listObjectsV2(bucketName, prefix, recursive, startAfter)
    let count = 0

    return new Promise<BucketItem[]>((resolve, reject) => {
      const results: BucketItem[] = []

      stream.on("data", (obj) => {
        if (count < limit) {
          results.push(obj)
          count += 1
        } else {
          stream.destroy()
        }
      })

      stream.on("end", () => {
        resolve(results)
      })

      stream.on("error", (err) => {
        reject(err)
      })
    })
  }
}
