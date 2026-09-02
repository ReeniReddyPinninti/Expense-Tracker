import axiosClient from './axiosClient';

export async function getBudgets() {
  const res = await axiosClient.get('/budgets');
  return res.data;
}

export async function getBudgetStatus() {
  const res = await axiosClient.get('/budgets/status');
  return res.data;
}

export async function setBudget(scope, limit) {
  const res = await axiosClient.post('/budgets', { scope, limit });
  return res.data;
}

export async function deleteBudget(id) {
  const res = await axiosClient.delete(`/budgets/${id}`);
  return res.data;
}