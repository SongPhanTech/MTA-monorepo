export class CreateFilledTemplateDto {
  fields: (string | number)[] = []
  cellValues?: { [sheet: string]: { [address: string]: string | number } }
}
