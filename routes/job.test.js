"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


///////////////////////////////////////////////// GET all jobs
describe("GET /jobs", function () {
  test('get all jobs', async () => {
    const response = await request(app).get('/jobs')

    expect(response.body).toEqual( {
      jobs: [
        {
          id: response.body.jobs[0].id,
          title: 'mobBoss',
          salary: 500,
          equity: '0.50',
          company_handle: 'c1'
        },
        {
          id: response.body.jobs[1].id,
          title: 'film guy',
          salary: 300,
          equity: '0.5',
          company_handle: 'c2'
        },
        {
          id: response.body.jobs[2].id,
          title: 'dead man',
          salary: 666,
          equity: '0.69',
          company_handle: 'c3'
        }
      ]
    })
  })

  test("get jobs with filter", async () => {
    const response = await request(app).get('/jobs?title=mobBoss')
    expect(response.body).toEqual( {
        jobs: [
          {
            id: response.body.jobs[0].id,
            title: 'mobBoss',
            salary: 500,
            equity: '0.50',
            company_handle: 'c1'
          }
        ]
      }
    )
  })
  
  test("get jobs with wrong filter", async () => {
    const response = await request(app).get('/jobs?money=100')
    // if filter does not exist, ignores it a queries all jobs
    expect(response.body).toEqual({
      jobs: [
        {
          id: response.body.jobs[0].id,
          title: 'mobBoss',
          salary: 500,
          equity: '0.50',
          company_handle: 'c1'
        },
        {
          id: response.body.jobs[1].id,
          title: 'film guy',
          salary: 300,
          equity: '0.5',
          company_handle: 'c2'
        },
        {
          id: response.body.jobs[2].id,
          title: 'dead man',
          salary: 666,
          equity: '0.69',
          company_handle: 'c3'
        }
      ]
    })

  })
})


///////////////////////////////////////////////// GET jobs by title
describe('GET /jobs/:title', () => {
  test("get job by title", async () => {
    const response = await request(app).get('/jobs/dead man')
    expect(response.body).toEqual({
      Job: [
        {
          id: response.body.Job[0].id,
          title: 'dead man',
          salary: 666,
          equity: '0.69',
          company_handle: 'c3'
        }
      ]
    })
  })

  test("get non existing job", async () => {
    const response = await request(app).get('/jobs/deed')
    expect(response.body).toEqual(
      { "Job": { "message": "deed does not exist", "status": 400 } })
  })
})



///////////////////////////////////////////////// POST, CREATE JOBS
describe('POST /jobs', () => {
  test('create new job', async () => {
    const response = await request(app)
      .post('/jobs/create')
      .send({ "title": "new JOB", "salary": 600, "equity": 0.3, "company_handle": "c3" })
      .set("authorization", `Bearer ${adminToken}`)
  
    expect(response.statusCode).toEqual(201)
    expect(response.body).toEqual( {
      Job: {
        title: 'new JOB',
        salary: 600,
        equity: '0.3',
        company_handle: 'c3'
      }
    })
  })

  test('create new job, wrong validation', async () => {
    const response = await request(app)
      .post('/jobs/create')
      .send({ "title": "new JOB", "salary": 600, "equity": 0.3, "company_handle": "c3" })
      .set("authorization", `Bearer ${46511651518}`)
    
    console.log(response.body.error.status)

    expect(response.body.error.message).toEqual('authorization token incorrect')
    expect(response.body.error.status).toEqual(401)
    
  })
  
  test('create new job,incorrect inputs', async () => {
    const response = await request(app)
      .post('/jobs/create')
      .send({ "title": "new JOB", "salary": "455", "equity": 0.3, "company_handle": "c3" })
      .set("authorization", `Bearer ${adminToken}`)
    
    expect(response.body.error.message[0]).toEqual('instance.salary is not of a type(s) integer')
    expect(response.body.error.status).toEqual(400)
  })

 })


///////////////////////////////////////////////// DELETE JOB
describe('DELETE /jobs/:title', () => { 
  test('Delete job', async () => {
    const response = await request(app)
      .delete('/jobs/mobboss')
      .set("authorization", `Bearer ${adminToken}`);

    expect(response.body).toEqual({ Response: 'mobboss Deleted' })
    expect(response.statusCode).toEqual(202)
  })
  
  test('Delete nonexisting job', async () => {
    const response = await request(app)
      .delete('/jobs/badjob')
      .set("authorization", `Bearer ${adminToken}`);
    
    expect(response.body.Response.message).toEqual('badjob not found')
    expect(response.body.Response.status).toEqual(404)
  })
  
})


///////////////////////////////////////////////// UPDATE JOB
describe('UPDATE jobs/:title', () => {
  test('Update job', async () => {
    const response = await request(app)
    .patch('/jobs/mobboss')
    .send({ "title": "Michael Franceze", "salary": 600, "equity": 0.3, "company_handle": "c3" })
    .set("authorization", `Bearer ${adminToken}`);
    
    expect(response.statusCode).toEqual(200)
    expect(response.body.Job[0]).toEqual({title: 'Michael Franceze', salary: 600, equity: '0.3' })
  })
  

  test('Update job, wrong authorization', async () => {
    const response = await request(app)
    .patch('/jobs/mobboss')
    .send({ "title": "Michael Franceze", "salary": 600, "equity": 0.3, "company_handle": "c3" })
      .set("authorization", `Bearer ${564515416541}`);
    
    expect(response.body.error.status).toEqual(401)
    expect(response.body.error.message).toEqual('authorization token incorrect')
  })

  test('Update nonexisting job', async () => {
    const response = await request(app)
    .patch('/jobs/fakejob')
    .send({ "title": "Michael Franceze", "salary": 600, "equity": 0.3, "company_handle": "c3" })
    .set("authorization", `Bearer ${adminToken}`);
    
    expect(response.body.Job.status).toEqual(400)
    expect(response.body.Job.message).toEqual('fakejob does not exist')
  })
})




