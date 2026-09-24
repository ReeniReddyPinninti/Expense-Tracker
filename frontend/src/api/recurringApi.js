import axiosClient from './axiosClient';

export async function getRecurringItems() {
  const res = await axiosClient.get('/recurring');
  return res.data;
}

export async function createRecurringItem(data) {
  const res = await axiosClient.post('/recurring', data);
  return res.data;
}

export async function deleteRecurringItem(id) {
  const res = await axiosClient.delete(`/recurring/${id}`);
  return res.data;
}