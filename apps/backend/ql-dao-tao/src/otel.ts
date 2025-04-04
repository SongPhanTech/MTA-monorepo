import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import {
    ConsoleSpanExporter,
    SimpleSpanProcessor,
    WebTracerProvider,
} from '@opentelemetry/sdk-trace-web'

const baseUrl = process.env.OPEN_OBSERVE_URL
const username = process.env.OPEN_OBSERVE_USERNAME
const password = process.env.OPEN_OBSERVE_PASSWORD

if (baseUrl && username && password) {
    const credentials = Buffer.from(`${username}:${password}`).toString(
        'base64'
    )

    const traceExporter = new OTLPTraceExporter({
        url: `${baseUrl}/api/default/v1/traces`,
        headers: {
            Authorization: `Basic ${credentials}`,
            'stream-name': 'default',
            'Content-Type': 'application/json',
        },
    })

    const provider = new WebTracerProvider({
        resource: new Resource({
            'service.name': 'ql-nguoi-dung-backend',
        }),
        spanProcessors: [
            new SimpleSpanProcessor(traceExporter),
            // new SimpleSpanProcessor(new ConsoleSpanExporter()),
        ],
    })

    provider.register()
}
