const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin, ensureAdminOrRequestByuser } = require("../middleware/auth");
const newJobSchema = require("../schemas/newJob.json")
const updateJobSchema = require("../schemas/updateJob.json")
const Jobs = require("../models/jobs");
const { max } = require("pg/lib/defaults");
const { route } = require("./users");

const router = new express.Router();

// get all jobs
router.get('/', async (req, res, next) => {
    try {
        const jobs = await Jobs.findAll(req.query)
        return res.status(200).json({jobs})
    } catch (e) {
        return next(e);
    }
})

// create new Job
router.post('/create', ensureAdmin, async (req, res, next) => {
    try {
        // validate schema 
        const validate = jsonschema.validate(req.body, newJobSchema)
        if (!validate.valid) {
            const errors = validate.errors.map(e => e.stack)
            throw new BadRequestError(errors)
        }

        // Create new Job
        const newJob = await Jobs.create(req.body)
        return res.status(201).json({ Job: newJob})
    } catch (e) {
        return next(e)
    }
});


// get job by title
router.get('/:title', async (req, res, next) => {
    try {
        const job = await Jobs.getJob(req.params.title)
        return res.json({Job: job})
    } catch (e) {
        return next(e)
    }
})

// Delete job
router.delete('/:title', ensureAdmin, async (req, res, next) => {
    try {
        const job = await Jobs.delete(req.params.title)
        return res.status(202).json({Response: job})
    } catch (e) {
        return next(e)
    }
})

// update job 
router.patch('/:title', ensureAdmin, async (req, res, next) => {
    try {
        // validate schema
        const validate = jsonschema.validate(req.body, updateJobSchema)

        if (!validate.valid) {
            const errors = validate.errors.map(e => e.stack)
            throw new BadRequestError(errors)
        }

        // update job 
        const job = await Jobs.update(req.params.title, req.body)
        return res.json({Job:job})
    } catch (e) {
        return next(e)    
    }
})

module.exports = router