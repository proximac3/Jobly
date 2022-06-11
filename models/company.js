"use strict";

const res = require("express/lib/response");
const { max } = require("pg/lib/defaults");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const jsonschema = require("jsonschema");
const findAllFilterCriteria = require("../schemas/findAllFilter.json");


/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({handle, name, description, numEmployees, logoUrl}) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  static async findAll(filterCriteria) {
    // Find all companies and filter by criteria if provided.
    
    // validate filtering criteria 
    const validate = jsonschema.validate(filterCriteria, findAllFilterCriteria);
    if (!validate.valid) {
      const error = validate.errors.map(e => e.stack)
      throw new BadRequestError(error)
    }

    // Extract filter criteria
    let name, minEmployees, maxEmployees
    if (filterCriteria) {
      name = filterCriteria.name
      minEmployees = filterCriteria.minEmployees
      maxEmployees = filterCriteria.maxEmployees
    }

    // If name param provided, query by name
    if (name) {
      // get companies with name param in company name
      const companies = await db.query(
        `SELECT * FROM companies WHERE LOWER(name) LIKE $1 ORDER BY name`,
        [`%${name.toLowerCase()}%`]);
        
      // Throw error if no companie with provided name parameter
      if(companies.rows.length === 0) throw new BadRequestError(`No company found with name of ${name}`)

      // filter by min or max_employees if provided.
      if (minEmployees || maxEmployees) {
        // error handling
        if (minEmployees > maxEmployees) throw new BadRequestError("minEmployees cannot be greater than maxEmployees")
        
        // filter companies
        const result = companies.rows.filter(company => company.num_employees >= (minEmployees || 0)
          && company.num_employees <= (maxEmployees || Infinity))
        
        return result
      } else {
        return companies.rows
      }
    }

    // if name param not provided, query all companies and filter by min and max num_employees
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    
    const output = companiesRes.rows.filter(company => company.numEmployees >= (minEmployees || 0)
      && company.numEmployees <= (maxEmployees || Infinity))
    
    return output

  };

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    // parallel request to db for company and jobs associated with company
    const company = db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    // jobs associated with company
    const jobs = db.query(`SELECT title, salary, equity FROM jobs JOIN companies ON companies.handle = jobs.company_handle WHERE company_handle=$1 `, [handle]);

    // await returned promise for company and associated job.
    const companyAndAssociatedJobs = await Promise.all([company, jobs])
    const companyResult = companyAndAssociatedJobs[0].rows
    const jobsResult = companyAndAssociatedJobs[1].rows

    if (companyResult.length === 0) throw new NotFoundError(`No company: ${handle}`);

    return [companyResult, jobsResult]
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
