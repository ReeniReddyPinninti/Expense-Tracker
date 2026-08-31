import axiosClient from './axiosClient';

export async function getExpenses() {
  const res = await axiosClient.get('/expenses');
  return res.data;
}

export async function createExpense(expenseData) {
  const res = await axiosClient.post('/expenses', expenseData);
  return res.data;
}

export async function updateExpense(id, expenseData) {
  const res = await axiosClient.put(`/expenses/${id}`, expenseData);
  return res.data;
}

export async function deleteExpense(id) {
  const res = await axiosClient.delete(`/expenses/${id}`);
  return res.data;
}