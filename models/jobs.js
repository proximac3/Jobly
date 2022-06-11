const res = require("express/lib/response");
const { max } = require("pg/lib/defaults");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const jsonschema = require("jsonschema");
const jobsFilters = require("../schemas/jobsFilters.json");

class Jobs {
    // find all jobs and filter if filters provided.
    static async findAll(filters) {
        // validate filters
        const validate = jsonschema.validate(filters, jobsFilters)
        if (!validate.valid) { 
            const erros = validate.errors.map(e => e.stack)
            throw new BadRequestError(erros)
        }
        
        // extract filtering criteria
        let title, minSalary, hasEquity
        if (filters) {
            title = filters.title
            minSalary = filters.minSalary
            hasEquity = filters.hasEquity
        }

        // if title provided, qurry by title
        if (title) {
            const jobs = await db.query(
                `SELECT * FROM jobs WHERE LOWER(title) LIKE $1 ORDER BY title`,
                [`%${title.toLowerCase()}%`]);
            
            // throw error if no job with provided title parameter
            if (jobs.rows.length === 0) throw new BadRequestError(`No job found with title:  ${title}`)
            
            // filter jobs by minSalary and Equity
            if (minSalary || hasEquity) {
                const filteredJobs = jobs.rows.filter(job => job.salary >= (minSalary || 0)
                    && (hasEquity == true ? job.equity > 0 : job.equity))
                
                return filteredJobs
            }

            return jobs.rows
        }
        
        // if no title provided, query all and filter by minSalary and hasEquity
        const jobs = await db.query(`SELECT * FROM jobs;`)
        
        if (minSalary || hasEquity) {
            const filteredJobs = jobs.rows.filter(job => job.salary >= (minSalary || 0)
                && (hasEquity == true ? job.equity > 0 : job.equity))
            
            return filteredJobs
        }

        return jobs.rows
    }

    // Create new job
    static async create({ title, salary, equity, company_handle }) {
        // check if job already exits
        const checkforJob = await db.query(`SELECT * FROM jobs WHERE title=$1`, [title])
        
        if (checkforJob.rows.length !== 0)
            return new BadRequestError(`Job ${title} already exist`)
        

        const result = await db.query(
            `INSERT INTO jobs 
            (title, salary, equity, company_handle) 
            VALUES ($1, $2, $3, $4) 
            RETURNING title, salary, equity, company_handle`,
            [title, salary, equity, company_handle])

        const job = result.rows[0]
        return job
    }

    // get Job by title
    static async getJob(title) {
        const job = await db.query(`SELECT * FROM jobs WHERE LOWER(title) = $1`, [title])

        if (job.rows.length === 0) {
            return new BadRequestError(`${title} does not exist`)
        }
        return job.rows
    }

    // delete JOb
    static async delete(title) {
        const job = await db.query(`DELETE FROM jobs where LOWER(title) =$1 RETURNING title`, [title])

        // error nandling
        if (job.rows.length === 0) {
            return new NotFoundError(`${title} not found`)
        }
        return `${title} Deleted`
    }

    // update job
    static async update(jobTitle, { title, salary, equity}) {
        // check if job exist
        const job = await this.getJob(jobTitle)

        if (job.message === `${jobTitle} does not exist`) {
            return job
        }

        // update job if it exist
        const updateJob = await db.query(`
        UPDATE jobs SET title=$1, salary=$2, equity=$3 WHERE id=$4 RETURNING title,salary,equity`,
            [title || job[0].title, salary || job[0].salary, equity || job[0].equity, job[0].id])


        // return updated job
        return updateJob.rows
    }
}


module.exports = Jobs