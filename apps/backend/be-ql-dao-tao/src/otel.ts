import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-web'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

const baseUrl = process.env.OPEN_OBSERVE_URL
const username = process.env.OPEN_OBSERVE_USERNAME
const password = process.env.OPEN_OBSERVE_PASSWORD

if (baseUrl && username && password) {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64')

    const traceExporter = new OTLPTraceExporter({
        url: `${baseUrl}/api/default/v1/traces`,
        headers: {
            Authorization: `Basic ${credentials}`,
            'stream-name': 'default',
            'Content-Type': 'application/json',
        },
    })

    const sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'mta-be-ql-dao-tao',
            [ATTR_SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION || '1.0.0',
        }),
        traceExporter,
        spanProcessors: [
            new SimpleSpanProcessor(traceExporter),
            // new SimpleSpanProcessor(new ConsoleSpanExporter()),
        ],
        instrumentations: [getNodeAutoInstrumentations()],
    })

    sdk.start()

    const shutdownSignals = ['SIGTERM', 'SIGINT', 'SIGQUIT', 'uncaughtException']

    for (const signal of shutdownSignals) {
        process.on(signal, () => {
            sdk.shutdown()
                .then(() => console.log('OpenTelemetry SDK shut down successfully'))
                .catch((error) => console.error('Error shutting down OpenTelemetry SDK', error))
                .finally(() => {
                    if (signal !== 'uncaughtException') {
                        process.exit(0)
                    }
                })
        })
    }
}
