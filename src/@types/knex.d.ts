import { Knex } from "knex";

declare module "knex/types/tables" {
  interface Tables {
    transactions: {
      id: string;
      title: string;
      amount: number;
      created_at: Knex.Types.Timestamp;
      session_id?: string | null;
    };
  }
}