const { BadRequestError } = require("../expressError");

// The purpose of this function is to help prevent SQL injection attacks by sanitizing the inputs we're using for SQL and parametizing them. 

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // Get keys from dataToUpdate
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // assign assending numbers prefixed with $ as values for keys.
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  /* Returns: 
   {
      setCols: '"handler"=$1, "name"=$2, "num_employees"=$3, "description"=$4, "logo_url"=$5',
      values: [returns values from dataToUpdate]
    }
  */
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
