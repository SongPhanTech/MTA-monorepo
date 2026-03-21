import { Button } from '@workspace/ui'
import { ButtonProps } from 'antd'
import { Printer } from 'lucide-react'
import { HTMLProps } from 'react'

export type ExportDiplomaAppendixType = 'ONE_COLUMN' | 'TWO_COLUMNS' | 'TWO_COLUMNS_ONE_PAGE'

interface ExportDiplomaAppendixProps {
    title?: string
    _typeExport?: ExportDiplomaAppendixType
    type?: ButtonProps['type']
    className?: HTMLProps<HTMLElement>['className']
    style?: HTMLProps<HTMLElement>['style']
}

const ExportDiplomaAppendix = (props: ExportDiplomaAppendixProps) => {
    const { title, _typeExport, ...restProps } = props

    const handleExportDiplomaAppendix = () => {
        //TODO: logic export
    }
    return (
        <Button onClick={handleExportDiplomaAppendix} {...restProps}>
            <Printer />
            <span>{title}</span>
        </Button>
    )
}

export default ExportDiplomaAppendix
