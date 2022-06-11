const { sqlForPartialUpdate } = require("../helpers/sql");

// mock company for testing
const testCompany = {
    "handler": "psychosis",
    "name": "psychosis Entertainment",
    "num_employees": 15,
    "description": "visual effect production company",
    "logo_url": "http://psychosis.io"
}


describe("Test SQLForPartialUpdate", function () {
    test('Returns sanitized and paramitez input, along with values for SQL query ', function () {

        expect( sqlForPartialUpdate(
            testCompany,
            {
                numEmployees: "num_employees",
                logoUrl: "logo_url",
            })).toEqual({
                setCols: '"handler"=$1, "name"=$2, "num_employees"=$3, "description"=$4, "logo_url"=$5',
                values: [
                    'psychosis',
                    'psychosis Entertainment',
                    15,
                    'visual effect production company',
                    'http://psychosis.io'
                ]
            })
    })
})
