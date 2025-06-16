import { FastifyInstance } from "fastify";
import { z } from "zod";
import { knex } from "../database";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

export async function transactionsRoutes(app: FastifyInstance) {
    app.addHook('preHandler', async (req, res) => {
        console.log(`[${req.method}] ${req.url}`);
    })

  app.get(
    "/",
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const { session_id } = req.cookies;

      const transactions = await knex("transactions")
        .where({ session_id })
        .select("*")
        .orderBy("created_at", "desc");
      return res.status(200).send({ transactions });
    }
  );

  app.get(
    "/:id",
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const getTransactionParams = z.object({
        id: z.string().uuid(),
      });
      // Validate the request parameters against the schema
      const { id } = getTransactionParams.parse(req.params);
      const transaction = await knex("transactions")
        .where({ id, session_id: req.cookies.session_id })
        .first();
      if (!transaction) {
        return res.status(404).send({
          message: "Transaction not found",
        });
      }
      return res.status(200).send({ transaction });
    }
  );

  app.get(
    "/summary",
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const summary = await knex("transactions")
        .where({ session_id: req.cookies.session_id })
        .sum("amount as amount")
        .first();

      return res.status(200).send({ summary });
    }
  );

  app.post("/", async (req, res) => {
    const createTransactionBody = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });
    // Validate the request body against the schema
    const { title, amount, type } = createTransactionBody.parse(req.body);

    let session_id = req.cookies.session_id;

    if (!session_id) {
      session_id = crypto.randomUUID();
      res.cookie("session_id", session_id, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 30 days
      });
    }

    await knex("transactions").insert({
      id: crypto.randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: session_id,
    });

    return res.status(201).send({
      message: "Transaction created successfully",
    });
  });
}
