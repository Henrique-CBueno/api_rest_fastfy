import { it, beforeAll, afterAll, describe, expect, beforeEach } from "vitest";
import req from "supertest";
import { execSync } from "node:child_process";
import { app } from "../src/app";

describe("Transactions routes", () => {

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async() => {
    execSync("npm run knex migrate:rollback --all");
    execSync("npm run knex migrate:latest");
  })

  it("should be able to create a new transaction", async () => {
    await req(app.server)
      .post("/transactions")
      .send({ title: "Transação de teste", amount: 1000, type: "credit" })
      .expect(201);
  });

  it("should be able to get all transactions", async () => {
    const createTransactionRes = await req(app.server)
      .post("/transactions")
      .send({ title: "Transação de teste", amount: 1000, type: "credit" })

    const cookies = createTransactionRes.get("Set-Cookie") ?? [];

    const getTransactionsRes = await req(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    expect(getTransactionsRes.body.transactions).toEqual([
        expect.objectContaining({
            id: expect.any(String),
            title: "Transação de teste",
            amount: 1000,            
        })
        
    ])

      console.log(getTransactionsRes.body);
  });


  it('should be able to get a specific transaction', async () => {
    const createTransactionResponse = await req(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie') ?? []

    const listTransactionsResponse = await req(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    const getTransactionResponse = await req(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New transaction',
        amount: 5000,
      }),
    )
  })

  it('should be able to get the summary', async () => {
    const createTransactionResponse = await req(app.server)
      .post('/transactions')
      .send({
        title: 'Credit transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie') ?? []

    await req(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 2000,
        type: 'debit',
      })

    const summaryResponse = await req(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual({
      amount: 3000,
    })
  })

});
