import fs from 'fs'
import XlsxTemplate from 'xlsx-template'

// Load the template
fs.readFile('PHIEU-DIEM.xlsx', (err, data) => {

    const template = new XlsxTemplate(data)

    // Define replacement values
    const values = {
        MA_LMH: 'CS101',
    }

    // Perform substitution on sheet 1 (can also use sheet name as string: 'Sheet1')
    template.substitute(1, values)

    // Generate the output file
    const output = template.generate({
        type:'nodebuffer'
    })
    
    // Save to disk
    fs.writeFileSync('output.xlsx', output)
})
