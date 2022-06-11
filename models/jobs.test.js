const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Jobs = require("./jobs.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/////////////////////////////////  Get JObS/
describe("GET /jobs", function () {
  test('get all jobs without filter', async () => {
    let jobs = await Jobs.findAll()
    expect(jobs).toEqual( [
      {
        id: jobs[0].id,
        title: 'mobBoss',
        salary: 500,
        equity: '0.50',
        company_handle: 'c1'
      },
      {
        id: jobs[1].id,
        title: 'film guy',
        salary: 300,
        equity: '0.5',
        company_handle: 'c2'
      },
      {
        id: jobs[2].id,
        title: 'dead man',
        salary: 666,
        equity: '0.69',
        company_handle: 'c3'
      }
    ])
  })

  test("get jobs with filters", async () => {
    let jobs = await Jobs.findAll({ "title": "film" })
    
    expect(jobs).toEqual(   [
      {
        id: jobs[0].id,
        title: 'film guy',
        salary: 300,
        equity: '0.5',
        company_handle: 'c2'
      }
    ])
  })

  test("get jobs with incorrect filter", async () => {
    try {
      let jobs = await Jobs.findAll({ "title": "cool" })
    } catch (e) {
      expect(e instanceof BadRequestError).toBeTruthy();
    }
  })
})

/////////////////////////////////  POST, CREATE JObS/
describe("POST /jobs", function () {
  test("create new job", async () => {
    let job = await Jobs.create({"title":"magic", "salary":500, "equity":"0.5", "company_handle": "c1"})

    const result = await db.query(`SELECT * FROM jobs WHERE title='magic'`)
    expect(result.rows[0]).toEqual(  {
        id: result.rows[0].id,
        title: 'magic',
        salary: 500,
        equity: '0.5',
        company_handle: 'c1'
      })
  })

  test('create duplicate jobe', async () => {
    try {
      let job = await Jobs.create({"title":"magic", "salary":500, "equity":"0.5", "company_handle": "c1"})
    } catch (e) {
      expect(e instanceof BadRequestError).toBeTruthy()
    }
  })
})

/////////////////////////////////  Get JObS by HANDLE/
describe("GET /jobs/handle", function () {
  test("get job by handlde", async () => {
    let job = await Jobs.getJob('dead man')
    expect(job[0]).toEqual({
        id: job[0].id,
        title: 'dead man',
        salary: 666,
        equity: '0.69',
        company_handle: 'c3'
      })
  })

  test("get job with bad title", async () => {
    let job = await Jobs.getJob('c1')
    expect(job.message).toEqual('c1 does not exist')
  })
})

/////////////////////////////////  UPDATE JObS/
describe('UPDATE /jobs', () => { 
  test('uodate job', async () => {
    let updatedJob = await Jobs.update("dead man", { "title": "michael francize" })
    
    const result = await db.query(`select * from jobs`)
    expect(result.rows[2]).toEqual( {
        id: result.rows[2].id,
        title: 'michael francize',
        salary: 666,
        equity: '0.69',
        company_handle: 'c3'
      })
  })

  test('update non existing job', async () => {
    let updatedJob = await Jobs.update("fake job", { "title": "michael francize" })
    expect(updatedJob.message).toEqual('fake job does not exist')
  })
})

/////////////////////////////////  DELETE JObS/
describe('DELETE /jobs', function () {
  test('delete job', async () => {
    let deletedJob = await Jobs.delete('mobboss')
    let results = await db.query(`SELECT * FROM jobs`)

    //expect db not to contain mobboss job
    expect(results.rows).toEqual( [
      {
        id: results.rows[0].id,
        title: 'film guy',
        salary: 300,
        equity: '0.5',
        company_handle: 'c2'
      },
      {
        id: results.rows[1].id,
        title: 'dead man',
        salary: 666,
        equity: '0.69',
        company_handle: 'c3'
      }
    ])
  })

  test('delete non existing job', async () => {
    const fakeJob = await Jobs.delete('fake job')   
    expect(fakeJob.message).toEqual('fake job not found')
  })

})







