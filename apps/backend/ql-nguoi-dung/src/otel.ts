import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import {
    ConsoleSpanExporter,
    SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'

const traceExporter = new OTLPTraceExporter({
    url: 'http://14.232.238.203:5080/api/default/v1/traces',
    headers: {
        Authorization: 'Basic c3dhbnRlY2hAZ21haWwuY29tOlN3YW50ZWNoQDEyMw==',
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
        new SimpleSpanProcessor(new ConsoleSpanExporter()),
    ],
})

provider.register()
