import client from "./client.js";

// Matches POST /api/auth/login in docs/api-contract.md
export async function login(email, password) {
  const { data } = await client.post("/auth/login", { email, password });
  return data;
}

// Matches POST /api/auth/register in docs/api-contract.md
export async function register(name, email, password) {
  const { data } = await client.post("/auth/register", { name, email, password });
  return data;
}
