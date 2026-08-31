import axiosClient from './axiosClient';

export async function getCategories() {
  const res = await axiosClient.get('/categories');
  return res.data;
}

export async function createCategory(name) {
  const res = await axiosClient.post('/categories', { name });
  return res.data;
}